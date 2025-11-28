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
    
    // 실제 지급할 합계
    let finalTotalBase = 0;
    let finalTotalNight = 0;
    let finalTotalOvertime = 0;
    let finalTotalHoliday = 0;
    let finalTotalWeekly = 0;
    
    // 잠재적 합계 (설정 꺼져있어도 계산된 값)
    let potentialTotalBase = 0; // 휴게 차감 적용된 기본급
    let potentialTotalBaseNoDeduct = 0; // 휴게 차감 안 된 기본급
    let potentialTotalNight = 0;
    let potentialTotalOvertime = 0;
    let potentialTotalHoliday = 0;
    let potentialTotalWeekly = 0;

    let ledger: any[] = []; 

    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);
    let current = startOfWeek(monthStart, { weekStartsOn: 1 }); 
    const endLoop = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const processedWeeks = new Set();

    while (current <= endLoop) {
      const weekStartStr = format(current, 'yyyy-MM-dd');
      const weekSunday = addDays(current, 6);
      const weekEndStr = format(weekSunday, 'yyyy-MM-dd');

      if (processedWeeks.has(weekStartStr)) { current = addDays(current, 7); continue; }
      processedWeeks.add(weekStartStr);

      const weekSchedules = empSchedules.filter((s: any) => {
        return s.date >= weekStartStr && s.date <= weekEndStr;
      }).sort((a: any, b: any) => a.date.localeCompare(b.date));

      let weekMinutesForWeeklyPay = 0; // 주휴 계산용 (휴게 차감 후 기준)

      weekSchedules.forEach((s: any) => {
        const [y, m, d] = s.date.split('-').map(Number);
        const scheduleDate = new Date(y, m - 1, d);
        const isThisMonth = m === month && y === year;

        const [sH, sM] = s.start_time.split(':').map(Number);
        const [eH, eM] = s.end_time.split(':').map(Number);
        let rawMins = (eH * 60 + eM) - (sH * 60 + sM);
        if (rawMins < 0) rawMins += 24 * 60;

        // 1. 휴게시간 계산 (무조건 계산)
        let breakMins = 0;
        if (rawMins >= 480) breakMins = 60;
        else if (rawMins >= 240) breakMins = 30;
        
        const actualMinsDeducted = rawMins - breakMins; // 차감된 시간
        const actualMinsNoDeduct = rawMins; // 차감 안 된 시간

        // 기본급 (두 가지 버전 계산)
        const basePayDeducted = Math.floor((actualMinsDeducted / 60) * emp.hourly_wage);
        const basePayNoDeduct = Math.floor((actualMinsNoDeduct / 60) * emp.hourly_wage);

        // 2. 야간수당 계산 (무조건 계산)
        const nightMins = calculateNightMinutes(s.start_time, s.end_time);
        const nightPay = Math.floor((nightMins / 60) * emp.hourly_wage * 0.5);

        // 3. 연장수당 계산 (무조건 계산 - 휴게 차감된 시간 기준 8시간 초과)
        let overtimePay = 0;
        if (actualMinsDeducted > 480) { 
            const overMins = actualMinsDeducted - 480;
            overtimePay = Math.floor((overMins / 60) * emp.hourly_wage * 0.5);
        }

        // 4. 휴일수당 계산 (무조건 계산)
        let holidayWorkPay = 0;
        if (s.is_holiday_work) {
            holidayWorkPay = Math.floor((actualMinsDeducted / 60) * emp.hourly_wage * 0.5);
        }

        // 이번 달 데이터면 장부/합계에 기록
        if (isThisMonth) {
            ledger.push({
                type: 'WORK',
                date: s.date,
                dayLabel: DAYS[scheduleDate.getDay()], 
                timeRange: `${s.start_time.slice(0,5)}~${s.end_time.slice(0,5)}`,
                hours: (actualMinsDeducted / 60).toFixed(1), // 기본 표시는 차감된 시간
                breakMins: breakMins,
                
                // ✅ [핵심] 모든 경우의 수 금액을 다 담아둠
                basePayDeducted: basePayDeducted,
                basePayNoDeduct: basePayNoDeduct,
                nightPay: nightPay,      
                overtimePay: overtimePay, 
                holidayWorkPay: holidayWorkPay,
                note: s.is_holiday_work ? '특근' : ''
            });

            // 잠재적 합계 누적
            potentialTotalBase += basePayDeducted;
            potentialTotalBaseNoDeduct += basePayNoDeduct;
            potentialTotalNight += nightPay;
            potentialTotalOvertime += overtimePay;
            potentialTotalHoliday += holidayWorkPay;

            // 실제 지급 합계 (설정에 따라)
            finalTotalBase += (storeSettings.auto_deduct_break ? basePayDeducted : basePayNoDeduct);
            if (storeSettings.is_five_plus && storeSettings.pay_night) finalTotalNight += nightPay;
            if (storeSettings.is_five_plus && storeSettings.pay_overtime) finalTotalOvertime += overtimePay;
            if (storeSettings.is_five_plus && storeSettings.pay_holiday) finalTotalHoliday += holidayWorkPay;
        }

        // 주휴 산정용 시간 (휴게 차감된 시간 기준이 원칙)
        if (!s.exclude_holiday_pay) {
            weekMinutesForWeeklyPay += actualMinsDeducted;
        }
      });

      // 5. 주휴수당 계산 (무조건 계산)
      if (isSameMonth(weekSunday, monthStart)) {
        let weeklyPay = 0;
        if (weekMinutesForWeeklyPay >= 900) { 
          const cappedWeekMinutes = Math.min(weekMinutesForWeeklyPay, 40 * 60); 
          weeklyPay = Math.floor((cappedWeekMinutes / 40 / 60) * 8 * emp.hourly_wage);
        }

        if (weeklyPay > 0) {
            ledger.push({
                type: 'WEEKLY',
                date: '', dayLabel: '주휴', timeRange: '-', hours: '-',
                basePayDeducted: 0, basePayNoDeduct: 0, nightPay: 0, overtimePay: 0, holidayWorkPay: 0,
                weeklyPay: weeklyPay, // 잠재적 주휴 금액
                note: `1주 ${Math.floor(weekMinutesForWeeklyPay/60)}시간 근무`
            });

            potentialTotalWeekly += weeklyPay;
            // 실제 지급 여부
            if (storeSettings.pay_weekly) finalTotalWeekly += weeklyPay;
        }
      }
      current = addDays(current, 7);
    }

    const totalPay = finalTotalBase + finalTotalNight + finalTotalOvertime + finalTotalHoliday + finalTotalWeekly;

    // 세금 계산
    let taxDetails = { pension: 0, health: 0, care: 0, employment: 0, incomeTax: 0, localTax: 0, total: 0 };
    // (세금 로직은 동일)
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
      empId: emp.id, name: emp.name, wage: emp.hourly_wage, type: emp.employment_type,
      
      // ✅ [핵심] 모든 잠재적 금액들을 다 보냄 (팝업에서 쓰려고)
      potential: {
        baseDeducted: potentialTotalBase,
        baseNoDeduct: potentialTotalBaseNoDeduct,
        night: potentialTotalNight,
        overtime: potentialTotalOvertime,
        holiday: potentialTotalHoliday,
        weekly: potentialTotalWeekly
      },
      
      // 실제 확정 금액 (목록 표시용)
      totalPay: totalPay,
      finalPay: totalPay - taxDetails.total,
      taxDetails: taxDetails,
      
      details: { bank: emp.bank_name, account: emp.account_number },
      birthDate: emp.birth_date, phoneNumber: emp.phone_number,
      ledger: ledger,
      
      // 매장 설정도 같이 보냄 (팝업 기본값 세팅용)
      storeSettingsSnapshot: storeSettings 
    };
  });
}