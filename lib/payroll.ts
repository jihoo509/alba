import { startOfWeek, endOfWeek, addDays, format, isSameMonth } from 'date-fns';

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
    
    let totalBasePay = 0;
    let totalNightPay = 0;
    let totalOvertimePay = 0;
    let totalHolidayWorkPay = 0; // ✅ 휴일근로수당 합계
    let totalWeeklyPay = 0;
    
    let ledger: any[] = []; 

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

      let weekMinutes = 0;

      weekSchedules.forEach((s: any) => {
        const d = new Date(s.date);
        const isThisMonth = d.getMonth() === month - 1;

        const [sH, sM] = s.start_time.split(':').map(Number);
        const [eH, eM] = s.end_time.split(':').map(Number);
        let rawMins = (eH * 60 + eM) - (sH * 60 + sM);
        if (rawMins < 0) rawMins += 24 * 60;

        let actualMins = rawMins;
        let breakMins = 0;
        if (storeSettings.auto_deduct_break !== false) {
          if (rawMins >= 480) { breakMins = 60; }
          else if (rawMins >= 240) { breakMins = 30; }
          actualMins = rawMins - breakMins;
        }

        const basePay = Math.floor((actualMins / 60) * emp.hourly_wage);
        
        let nightPay = 0;
        if (storeSettings.is_five_plus && storeSettings.pay_night) {
             const nightMins = calculateNightMinutes(s.start_time, s.end_time);
             nightPay = Math.floor((nightMins / 60) * emp.hourly_wage * 0.5);
        }

        let overtimePay = 0;
        if (storeSettings.is_five_plus && storeSettings.pay_overtime) {
            if (actualMins > 480) { 
                const overMins = actualMins - 480;
                overtimePay = Math.floor((overMins / 60) * emp.hourly_wage * 0.5);
            }
        }

        // ✅ [추가] 휴일근로수당 (0.5배 가산)
        let holidayWorkPay = 0;
        if (storeSettings.is_five_plus && storeSettings.pay_holiday && s.is_holiday_work) {
            holidayWorkPay = Math.floor((actualMins / 60) * emp.hourly_wage * 0.5);
        }

        if (isThisMonth) {
            ledger.push({
                type: 'WORK',
                date: s.date,
                dayLabel: DAYS[d.getDay()],
                timeRange: `${s.start_time.slice(0,5)}~${s.end_time.slice(0,5)}`,
                hours: (actualMins / 60).toFixed(1) + (breakMins > 0 ? ` (휴게 -${breakMins}분)` : ''),
                breakMins: breakMins,
                basePay: basePay,
                nightPay: nightPay,      
                overtimePay: overtimePay, 
                holidayWorkPay: holidayWorkPay, // ✅ 장부 기록
                note: s.is_holiday_work ? '특근' : ''
            });

            totalBasePay += basePay;
            totalNightPay += nightPay;
            totalOvertimePay += overtimePay;
            totalHolidayWorkPay += holidayWorkPay; // ✅ 합계 누적
        }

        if (!s.exclude_holiday_pay) {
            weekMinutes += actualMins;
        }
      });

      if (isSameMonth(weekSunday, monthStart)) {
        if (weekMinutes >= 900 && storeSettings.pay_weekly) { 
          const cappedWeekMinutes = Math.min(weekMinutes, 40 * 60); 
          const holidayPay = Math.floor((cappedWeekMinutes / 40 / 60) * 8 * emp.hourly_wage);
          totalWeeklyPay += holidayPay;
          ledger.push({
              type: 'WEEKLY',
              date: '', dayLabel: '주휴', timeRange: '-', hours: '-',
              basePay: 0, nightPay: 0, overtimePay: 0, holidayWorkPay: 0,
              weeklyPay: holidayPay,
              note: `1주 ${Math.floor(weekMinutes/60)}시간 근무`
          });
        }
      }
      current = addDays(current, 7);
    }

    const totalPay = totalBasePay + totalNightPay + totalOvertimePay + totalHolidayWorkPay + totalWeeklyPay;

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
      totalHours: (1), // 여기서는 안씀
      basePay: totalBasePay,
      nightPay: totalNightPay,
      overtimePay: totalOvertimePay,
      holidayWorkPay: totalHolidayWorkPay, // ✅ 반환
      weeklyHolidayPay: totalWeeklyPay,
      totalPay: totalPay,
      taxDetails: taxDetails,
      finalPay: totalPay - taxDetails.total,
      details: { bank: emp.bank_name, account: emp.account_number },
      birthDate: emp.birth_date,
      phoneNumber: emp.phone_number,
      ledger: ledger
    };
  });
}