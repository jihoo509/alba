import { startOfWeek, endOfWeek, addDays, format, isSameMonth } from 'date-fns';

// 2024/2025 기준 4대보험 요율
const RATES = {
  pension: 0.045, health: 0.03545, care: 0.1295, employment: 0.009, incomeTax: 0.03, localTax: 0.1
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
    
    let totalWorkMinutes = 0;
    let totalNightMinutes = 0;
    let weeklyHolidayPay = 0;
    
    let ledger: any[] = []; // 장부

    // 월 기준 주 단위 루프
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
      
      const weekSchedules = empSchedules.filter((s: any) => {
        const d = new Date(s.date);
        return d >= current && d <= weekSunday;
      }).sort((a: any, b: any) => a.date.localeCompare(b.date));

      let weekMinutes = 0; // 주휴 계산용 (실제 근무시간)

      weekSchedules.forEach((s: any) => {
        const d = new Date(s.date);
        const isThisMonth = d.getMonth() === month - 1;

        const [sH, sM] = s.start_time.split(':').map(Number);
        const [eH, eM] = s.end_time.split(':').map(Number);
        let rawMins = (eH * 60 + eM) - (sH * 60 + sM);
        if (rawMins < 0) rawMins += 24 * 60;

        // ✅ [핵심 로직] 휴게시간 자동 차감
        let actualMins = rawMins;
        let breakMins = 0;

        // 설정이 켜져 있으면(기본값 true) 차감
        if (storeSettings.auto_deduct_break !== false) {
          if (rawMins >= 480) { // 8시간(480분) 이상 -> 1시간 차감
            breakMins = 60;
          } else if (rawMins >= 240) { // 4시간(240분) 이상 -> 30분 차감
            breakMins = 30;
          }
          actualMins = rawMins - breakMins;
        }

        // 기본급 계산 (실제 근무시간 기준)
        const basePay = Math.floor((actualMins / 60) * emp.hourly_wage);
        
        // 야간수당 계산 (야간 시간도 휴게시간 비율만큼 까야 하지만, 
        // 계산이 너무 복잡해지므로 통상적으로 야간 총량에서 비율 차감하거나 그대로 둠. 
        // 여기서는 야간수당은 '시간 대'로 발생하므로 그대로 두고, 총 근무시간에서만 뺍니다.)
        let nightPay = 0;
        if (storeSettings.is_five_plus && storeSettings.pay_night) {
             const nightMins = calculateNightMinutes(s.start_time, s.end_time);
             // 야간수당은 0.5배 가산
             nightPay = Math.floor((nightMins / 60) * emp.hourly_wage * 0.5);
        }

        // 이번 달 급여에 포함될 경우
        if (isThisMonth) {
            ledger.push({
                type: 'WORK',
                date: s.date,
                dayLabel: DAYS[d.getDay()],
                timeRange: `${s.start_time.slice(0,5)}~${s.end_time.slice(0,5)}`,
                // 시간 표시에 휴게시간 차감 여부 힌트 주기
                hours: (actualMins / 60).toFixed(1) + (breakMins > 0 ? ` (휴게 -${breakMins}분)` : ''),
                basePay: basePay,
                otherPay: nightPay, 
                nightPayOnly: nightPay,
                note: ''
            });

            totalWorkMinutes += actualMins; // 총 근무시간 누적
            totalBasePay += basePay;
            totalNightPay += nightPay;
        }

        // 주휴수당 계산용 누적 (휴게시간 뺀 실제 근무시간 기준)
        if (!s.exclude_holiday_pay) {
            weekMinutes += actualMins;
        }
      });

      // 주휴수당 지급 여부 확인
      if (isSameMonth(weekSunday, monthStart)) {
        if (weekMinutes >= 900 && storeSettings.pay_weekly) { 
          // 주 40시간(2400분) 초과 시 최대 8시간분만 지급
          const cappedWeekMinutes = Math.min(weekMinutes, 40 * 60); 
          const holidayPay = Math.floor((cappedWeekMinutes / 40 / 60) * 8 * emp.hourly_wage);
          
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

    const totalPay = totalBasePay + totalNightPay + totalWeeklyPay;

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