import { differenceInMinutes, getDay, startOfWeek, endOfWeek, addDays, format, isSameMonth } from 'date-fns';

// 2024/2025 기준 4대보험 근로자 부담분 요율
const RATES = {
  pension: 0.045,        // 국민연금 (4.5%)
  health: 0.03545,       // 건강보험 (3.545%)
  care: 0.1295,          // 장기요양 (건강보험료의 12.95%)
  employment: 0.009,     // 고용보험 (0.9%)
  incomeTax: 0.03,       // 소득세 (프리랜서 기준 3%, 4대보험은 간이세액표 따르지만 약식 적용)
  localTax: 0.1,         // 지방소득세 (소득세의 10%)
};

// 야간 시간(22:00 ~ 06:00) 분 단위 계산
function calculateNightMinutes(start: string, end: string) {
  const [sH, sM] = start.split(':').map(Number);
  const [eH, eM] = end.split(':').map(Number);
  
  let startMin = sH * 60 + sM;
  let endMin = eH * 60 + eM;
  if (endMin < startMin) endMin += 24 * 60; 

  let nightMin = 0;
  for (let t = startMin; t < endMin; t++) {
    const timeOfDay = t % 1440; 
    if (timeOfDay >= 1320 || timeOfDay < 360) {
      nightMin++;
    }
  }
  return nightMin;
}

export function calculateMonthlyPayroll(
  year: number, 
  month: number, 
  employees: any[], 
  schedules: any[], 
  storeSettings: any
) {
  return employees.map(emp => {
    const empSchedules = schedules.filter(s => s.employee_id === emp.id);
    
    let totalWorkMinutes = 0;
    let totalNightMinutes = 0;
    let weeklyHolidayPay = 0;
    
    // ✅ 일별 상세 내역 (직원용 명세서 데이터)
    const dailyLogs = empSchedules.map((s: any) => {
        const [sH, sM] = s.start_time.split(':').map(Number);
        const [eH, eM] = s.end_time.split(':').map(Number);
        let mins = (eH * 60 + eM) - (sH * 60 + sM);
        if (mins < 0) mins += 24 * 60;
        
        const hours = mins / 60;
        const dailyPay = Math.floor(hours * emp.hourly_wage); // 일급

        return {
            date: s.date,
            startTime: s.start_time.slice(0,5),
            endTime: s.end_time.slice(0,5),
            hours: hours.toFixed(1),
            pay: dailyPay
        };
    }).sort((a: any, b: any) => a.date.localeCompare(b.date));

    // --- 주휴수당 계산 (기존 로직 유지) ---
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

    // --- 기본급 및 야간수당 ---
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

    const basePay = (totalWorkMinutes / 60) * emp.hourly_wage;
    const nightPay = (totalNightMinutes / 60) * emp.hourly_wage * 0.5;
    const totalPay = basePay + nightPay + weeklyHolidayPay;

    // ✅ 세금 상세 계산 (세무서용)
    let taxDetails = {
        pension: 0, health: 0, care: 0, employment: 0, income: 0, local: 0, total: 0
    };

    if (emp.employment_type.includes('four')) {
        // 4대보험
        taxDetails.pension = Math.floor(totalPay * RATES.pension / 10) * 10; // 원단위 절사
        taxDetails.health = Math.floor(totalPay * RATES.health / 10) * 10;
        taxDetails.care = Math.floor(taxDetails.health * RATES.care / 10) * 10;
        taxDetails.employment = Math.floor(totalPay * RATES.employment / 10) * 10;
        // 소득세는 간이세액표가 복잡하므로 여기선 일단 0원 처리하거나 필요시 로직 추가
        // (대부분 알바는 소액이라 소득세가 잘 안 나옴, 일단 0원)
        taxDetails.total = taxDetails.pension + taxDetails.health + taxDetails.care + taxDetails.employment;
    } else {
        // 3.3% 프리랜서
        taxDetails.income = Math.floor(totalPay * RATES.income / 10) * 10;
        taxDetails.local = Math.floor(taxDetails.income * RATES.localTax / 10) * 10;
        taxDetails.total = taxDetails.income + taxDetails.local;
    }

    return {
      empId: emp.id,
      name: emp.name,
      wage: emp.hourly_wage,
      type: emp.employment_type,
      totalHours: (totalWorkMinutes / 60).toFixed(1),
      basePay: Math.floor(basePay),
      nightPay: Math.floor(nightPay),
      weeklyHolidayPay: Math.floor(weeklyHolidayPay),
      totalPay: Math.floor(totalPay),     // 세전
      taxDetails: taxDetails,             // 세금 상세
      finalPay: Math.floor(totalPay - taxDetails.total), // 실수령
      details: {
        bank: emp.bank_name,
        account: emp.account_number,
      },
      dailyLogs: dailyLogs // ✅ 일별 상세 내역 포함
    };
  });
}