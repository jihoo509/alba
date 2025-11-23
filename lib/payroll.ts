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
    
    // 장부(Ledger) - 일별 내역 + 주휴수당 행을 순서대로 담을 배열
    let ledger: any[] = [];
    
    let totalBasePay = 0;
    let totalNightPay = 0;
    let totalWeeklyPay = 0;
    let totalWorkMinutes = 0;

    // 월의 시작/끝 주 계산
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);
    let current = startOfWeek(monthStart, { weekStartsOn: 1 }); // 월요일 시작
    const endLoop = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const processedWeeks = new Set();

    // 주 단위 루프
    while (current <= endLoop) {
      const weekStartStr = format(current, 'yyyy-MM-dd');
      if (processedWeeks.has(weekStartStr)) { current = addDays(current, 7); continue; }
      processedWeeks.add(weekStartStr);

      const weekSunday = addDays(current, 6);
      
      // 이번 주 스케줄 찾기 (날짜순 정렬)
      const weekSchedules = empSchedules.filter((s: any) => {
        const d = new Date(s.date);
        return d >= current && d <= weekSunday;
      }).sort((a: any, b: any) => a.date.localeCompare(b.date));

      let weekMinutes = 0; // 주휴 판단용 (주휴 제외 체크된 건 빠짐)

      // 1. 스케줄 처리 (장부에 기록)
      weekSchedules.forEach((s: any) => {
        const [sH, sM] = s.start_time.split(':').map(Number);
        const [eH, eM] = s.end_time.split(':').map(Number);
        let mins = (eH * 60 + eM) - (sH * 60 + sM);
        if (mins < 0) mins += 24 * 60;
        
        // 통계용 (이번 달 것만 합산)
        const d = new Date(s.date);
        const isThisMonth = d.getMonth() === month - 1;

        // 기본급
        const basePay = Math.floor((mins / 60) * emp.hourly_wage);
        
        // 야간수당
        let nightPay = 0;
        if (storeSettings.is_five_plus && storeSettings.pay_night) {
             const nightMins = calculateNightMinutes(s.start_time, s.end_time);
             nightPay = Math.floor((nightMins / 60) * emp.hourly_wage * 0.5);
        }

        // 장부에 추가 (타입: WORK)
        if (isThisMonth) {
            ledger.push({
                type: 'WORK',
                date: s.date,
                dayLabel: DAYS[d.getDay()],
                timeRange: `${s.start_time.slice(0,5)}~${s.end_time.slice(0,5)}`,
                hours: (mins / 60).toFixed(1),
                basePay: basePay,
                otherPay: nightPay, // 야간+연장 등 합산 (지금은 야간만)
                nightPayOnly: nightPay, // 상세 표기용
                note: ''
            });

            totalWorkMinutes += mins;
            totalBasePay += basePay;
            totalNightPay += nightPay;
        }

        // 주휴 산정용 시간 누적
        if (!s.exclude_holiday_pay) {
            weekMinutes += mins;
        }
      });

      // 2. 주휴수당 처리 (장부에 기록)
      // 해당 주의 일요일이 이번 달에 포함되어야 지급 (사장님 규칙)
      if (isSameMonth(weekSunday, monthStart)) {
        if (weekMinutes >= 900 && storeSettings.pay_weekly) { // 15시간 이상
          const cappedWeekMinutes = Math.min(weekMinutes, 40 * 60); // 최대 40시간
          const holidayPay = Math.floor((cappedWeekMinutes / 40 / 60) * 8 * emp.hourly_wage);
          
          totalWeeklyPay += holidayPay;

          // 장부에 주휴수당 행 추가 (타입: WEEKLY)
          ledger.push({
              type: 'WEEKLY',
              date: '', // 날짜는 비워둠 (마지막 근무 밑에 붙음)
              dayLabel: '주휴',
              timeRange: '-',
              hours: '-',
              basePay: 0,
              otherPay: 0,
              weeklyPay: holidayPay, // 주휴수당 금액
              note: `1주 ${Math.floor(weekMinutes/60)}시간 근무 달성`
          });
        }
      }

      current = addDays(current, 7);
    }

    // --- 총액 및 세금 계산 ---
    const totalPay = totalBasePay + totalNightPay + totalWeeklyPay;

    let taxDetails = {
        pension: 0, health: 0, care: 0, employment: 0, 
        incomeTax: 0, localTax: 0, total: 0
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
      birthDate: emp.birth_date,
      phoneNumber: emp.phone_number,
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
      ledger: ledger // ✅ 상세 장부 반환
    };
  });
}