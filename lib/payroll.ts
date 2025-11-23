import { differenceInMinutes, getDay, startOfWeek, endOfWeek, addDays, format, isSameMonth } from 'date-fns';

// 요일 배열 (0:일 ~ 6:토)
const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

const RATES = {
  pension: 0.045, health: 0.03545, care: 0.1295, employment: 0.009, incomeTax: 0.03, localTax: 0.1
};

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
    
    // ✅ [수정] 일별 상세 내역에 '요일', '야간수당액' 추가
    const dailyLogs = empSchedules.map((s: any) => {
        const d = new Date(s.date);
        const dayLabel = DAYS[d.getDay()]; // 요일 구하기

        const [sH, sM] = s.start_time.split(':').map(Number);
        const [eH, eM] = s.end_time.split(':').map(Number);
        let mins = (eH * 60 + eM) - (sH * 60 + sM);
        if (mins < 0) mins += 24 * 60;
        
        const hours = mins / 60;
        const basePay = Math.floor(hours * emp.hourly_wage);
        
        // 해당 일자의 야간수당 계산
        let nightMins = 0;
        let nightPay = 0;
        if (storeSettings.is_five_plus && storeSettings.pay_night) {
             nightMins = calculateNightMinutes(s.start_time, s.end_time);
             nightPay = Math.floor((nightMins / 60) * emp.hourly_wage * 0.5);
        }

        return {
            date: s.date,
            dayLabel: dayLabel, // 요일 추가
            startTime: s.start_time.slice(0,5),
            endTime: s.end_time.slice(0,5),
            hours: hours.toFixed(1),
            basePay: basePay,   // 기본급
            nightPay: nightPay, // 야간수당
            total: basePay + nightPay
        };
    }).sort((a: any, b: any) => a.date.localeCompare(b.date));

    // --- 주휴수당 계산 (기존 유지) ---
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
      if (isSameMonth(weekSunday, monthStart)) {
        const weekSchedules = empSchedules.filter((s: any) => {
          const d = new Date(s.date);
          return d >= current && d <= weekSunday;
        });

        let weekMinutes = 0;
        weekSchedules.forEach((s: any) => {
          if (s.exclude_holiday_pay) return;
          const [sH, sM] = s.start_time.split(':').map(Number);
          const [eH, eM] = s.end_time.split(':').map(Number);
          let mins = (eH * 60 + eM) - (sH * 60 + sM);
          if (mins < 0) mins += 24 * 60;
          weekMinutes += mins;
        });

        if (weekMinutes >= 900 && storeSettings.pay_weekly) {
          const cappedWeekMinutes = Math.min(weekMinutes, 40 * 60);
          const holidayPay = (cappedWeekMinutes / 40 / 60) * 8 * emp.hourly_wage;
          weeklyHolidayPay += holidayPay;
        }
      }
      current = addDays(current, 7);
    }

    // --- 총합 계산 ---
    const thisMonthSchedules = empSchedules.filter((s: any) => {
        const d = new Date(s.date);
        return d.getMonth() === month - 1 && d.getFullYear() === year;
    });

    thisMonthSchedules.forEach((s: any) => {
      const [sH, sM] = s.start_time.split(':').map(Number);
      const [eH, eM] = s.end_time.split(':').map(Number);
      let mins = (eH * 60 + eM) - (sH * 60 + sM);
      if (mins < 0) mins += 24 * 60;
      totalWorkMinutes += mins;

      if (storeSettings.is_five_plus && storeSettings.pay_night) {
        totalNightMinutes += calculateNightMinutes(s.start_time, s.end_time);
      }
    });

    const basePayTotal = (totalWorkMinutes / 60) * emp.hourly_wage;
    const nightPayTotal = (totalNightMinutes / 60) * emp.hourly_wage * 0.5;
    const totalPay = basePayTotal + nightPayTotal + weeklyHolidayPay;

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
      basePay: Math.floor(basePayTotal),
      nightPay: Math.floor(nightPayTotal),
      weeklyHolidayPay: Math.floor(weeklyHolidayPay),
      totalPay: Math.floor(totalPay),
      taxDetails: taxDetails,
      finalPay: Math.floor(totalPay - taxDetails.total),
      details: {
        bank: emp.bank_name,
        account: emp.account_number,
      },
      dailyLogs: dailyLogs // 상세 내역
    };
  });
}