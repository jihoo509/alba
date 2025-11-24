import { startOfWeek, endOfWeek, addDays, format, isSameMonth } from 'date-fns';

// 2024/2025 기준 4대보험 요율
const RATES = {
  pension: 0.045,        // 국민연금
  health: 0.03545,       // 건강보험
  care: 0.1295,          // 장기요양
  employment: 0.009,     // 고용보험
  incomeTax: 0.03,       // 소득세 (3.3%)
  localTax: 0.1,         // 지방세
};

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

function calculateNightMinutes(start: string, end: string) {
  const [sH, sM] = start.split(':').map(Number);
  const [eH, eM] = end.split(':').map(Number);
  let startMin = sH * 60 + sM;
  let endMin = eH * 60 + eM;
  if (endMin < startMin) endMin += 24 * 60; 

  let nightMin = 0;
  for (let t = startMin; t < endMin; t++) {
    const timeOfDay = t % 1440; 
    if (timeOfDay >= 1320 || timeOfDay < 360) nightMin++;
  }
  return nightMin;
}

export function calculateMonthlyPayroll(
  year: number, month: number, employees: any[], schedules: any[], storeSettings: any
) {
  return employees.map(emp => {
    const empSchedules = schedules.filter(s => s.employee_id === emp.id);
    
    // ✅ [수정] 변수 선언을 맨 위로 올려서 에러 방지
    let totalBasePay = 0;       // 기본급 합계
    let totalNightPay = 0;      // 야간수당 합계
    let totalWeeklyPay = 0;     // 주휴수당 합계
    let totalWorkMinutes = 0;   // 총 근무 시간(분)
    
    let ledger: any[] = []; // 상세 내역 장부

    // 월 기준 주 단위 루프 설정
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);
    let current = startOfWeek(monthStart, { weekStartsOn: 1 }); 
    const endLoop = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const processedWeeks = new Set();

    while (current <= endLoop) {
      const weekStartStr = format(current, 'yyyy-MM-dd');
      if (processedWeeks.has(weekStartStr)) { current = addDays(current, 7); continue; }
      processedWeeks.add(weekStartStr);

      const weekSunday = addDays(current, 6);
      
      // 이번 주 스케줄 필터링
      const weekSchedules = empSchedules.filter((s: any) => {
        const d = new Date(s.date);
        return d >= current && d <= weekSunday;
      }).sort((a: any, b: any) => a.date.localeCompare(b.date));

      let weekMinutes = 0; // 주휴 계산용 주간 근무시간

      // 1. 개별 근무 처리
      weekSchedules.forEach((s: any) => {
        const d = new Date(s.date);
        const isThisMonth = d.getMonth() === month - 1;

        const [sH, sM] = s.start_time.split(':').map(Number);
        const [eH, eM] = s.end_time.split(':').map(Number);
        let rawMins = (eH * 60 + eM) - (sH * 60 + sM);
        if (rawMins < 0) rawMins += 24 * 60;

        // ✅ 휴게시간 차감 로직
        let actualMins = rawMins;
        let breakMins = 0;
        if (storeSettings.auto_deduct_break !== false) {
          if (rawMins >= 480) { breakMins = 60; } // 8시간 이상 -> 1시간
          else if (rawMins >= 240) { breakMins = 30; } // 4시간 이상 -> 30분
          actualMins = rawMins - breakMins;
        }

        // 금액 계산
        const basePay = Math.floor((actualMins / 60) * emp.hourly_wage);
        
        let nightPay = 0;
        if (storeSettings.is_five_plus && storeSettings.pay_night) {
             const nightMins = calculateNightMinutes(s.start_time, s.end_time);
             // 야간수당은 0.5배 가산 (휴게시간 고려 없이 전체 야간 시간 기준)
             nightPay = Math.floor((nightMins / 60) * emp.hourly_wage * 0.5);
        }

        // 이번 달 급여에 포함되는 경우만 합산
        if (isThisMonth) {
            ledger.push({
                type: 'WORK',
                date: s.date,
                dayLabel: DAYS[d.getDay()],
                timeRange: `${s.start_time.slice(0,5)}~${s.end_time.slice(0,5)}`,
                hours: (actualMins / 60).toFixed(1) + (breakMins > 0 ? ` (휴게 -${breakMins}분)` : ''),
                basePay: basePay,
                otherPay: nightPay, 
                nightPayOnly: nightPay,
                note: ''
            });

            // ✅ 합계 변수 누적
            totalWorkMinutes += actualMins;
            totalBasePay += basePay;
            totalNightPay += nightPay;
        }

        // 주휴수당용 시간 누적 (주휴 제외 체크 안 된 것만)
        if (!s.exclude_holiday_pay) {
            weekMinutes += actualMins;
        }
      });

      // 2. 주휴수당 처리
      if (isSameMonth(weekSunday, monthStart)) {
        if (weekMinutes >= 900 && storeSettings.pay_weekly) { 
          const cappedWeekMinutes = Math.min(weekMinutes, 40 * 60); 
          const holidayPay = Math.floor((cappedWeekMinutes / 40 / 60) * 8 * emp.hourly_wage);
          
          // ✅ 주휴수당 누적
          totalWeeklyPay += holidayPay;

          ledger.push({
              type: 'WEEKLY',
              date: '',
              dayLabel: '주휴',
              timeRange: '-',
              hours: '-',
              basePay: 0,
              otherPay: 0,
              weeklyPay: holidayPay,
              note: `1주 ${Math.floor(weekMinutes/60)}시간 근무`
          });
        }
      }
      current = addDays(current, 7);
    }

    // --- 최종 합산 ---
    const totalPay = totalBasePay + totalNightPay + totalWeeklyPay;

    // 세금 계산
    let taxDetails = {
        pension: 0, health: 0, care: 0, employment: 0, incomeTax: 0, localTax: 0, total: 0
    };

    if (emp.employment_type.includes('four')) {
        taxDetails.pension = Math.floor(totalPay * RATES.pension / 10) * 10;
        taxDetails.health = Math.floor(totalPay * RATES.health / 10) * 10;
        taxDetails.care = Math.floor(taxDetails.health * RATES.care / 10) * 10;
        taxDetails.employment = Math.floor(totalPay * RATES.employment / 10) * 10;
        taxDetails.total = taxDetails.pension + taxDetails.health + taxDetails.care + taxDetails.employment;
    } else {
        taxDetails.incomeTax = Math.floor(totalPay * RATES.incomeTax / 10) * 10;
        taxDetails.localTax = Math.floor(taxDetails.incomeTax * RATES.localTax / 10) * 10;
        taxDetails.total = taxDetails.incomeTax + taxDetails.localTax;
    }

    return {
      empId: emp.id,
      name: emp.name,
      wage: emp.hourly_wage,
      type: emp.employment_type,
      totalHours: (totalWorkMinutes / 60).toFixed(1),
      basePay: totalBasePay,
      nightPay: totalNightPay,
      weeklyHolidayPay: totalWeeklyPay,
      totalPay: totalPay,
      taxDetails: taxDetails,
      finalPay: totalPay - taxDetails.total,
      details: {
        bank: emp.bank_name,
        account: emp.account_number,
      },
      birthDate: emp.birth_date,
      phoneNumber: emp.phone_number,
      ledger: ledger
    };
  });
}