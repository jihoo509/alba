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
  year: number, month: number, employees: any[], schedules: any[], storeSettings: any, overrides: any[] = []
) {
  return employees.map(emp => {
    const empSchedules = schedules.filter(s => s.employee_id === emp.id);
    const override = overrides.find(o => o.employee_id === emp.id);

    // ✅ 직원 급여 타입 확인
    const isEmpDaily = emp.pay_type === 'day' || emp.pay_type === '일당';
    const isEmpMonthly = emp.pay_type === 'month' || (emp.monthly_wage && emp.monthly_wage > 0);

    const cfg = {
        pay_weekly: override?.pay_weekly ?? ((isEmpDaily || isEmpMonthly) ? false : storeSettings.pay_weekly),
        pay_night: override?.pay_night ?? (storeSettings.is_five_plus && storeSettings.pay_night),
        pay_overtime: override?.pay_overtime ?? (storeSettings.is_five_plus && storeSettings.pay_overtime),
        pay_holiday: override?.pay_holiday ?? (storeSettings.is_five_plus && storeSettings.pay_holiday),
        auto_deduct_break: override?.auto_deduct_break ?? ((isEmpDaily || isEmpMonthly) ? false : (storeSettings.auto_deduct_break !== false)),
        no_tax_deduction: override?.no_tax_deduction ?? (storeSettings.no_tax_deduction || false)
    };
    
    let totalBasePay = 0;
    let totalNightPay = 0;
    let totalOvertimePay = 0;
    let totalHolidayWorkPay = 0;
    let totalWeeklyPay = 0;
    let totalWorkMinutes = 0; 
    
    let ledger: any[] = []; 

    // ✅ [수정] 월급제여도 날짜별 기록을 위해 루프를 돌림
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

        let weekMinutes = 0;

        weekSchedules.forEach((s: any) => {
            const [y, m, d] = s.date.split('-').map(Number);
            const scheduleDate = new Date(y, m - 1, d);
            const isThisMonth = m === month && y === year;

            const [sH, sM] = s.start_time.split(':').map(Number);
            const [eH, eM] = s.end_time.split(':').map(Number);
            let rawMins = (eH * 60 + eM) - (sH * 60 + sM);
            if (rawMins < 0) rawMins += 24 * 60;

            let breakMins = 0;
            if (rawMins >= 480) { breakMins = 60; }
            else if (rawMins >= 240) { breakMins = 30; }
            
            const deductedMins = rawMins - breakMins;

            // 스케줄별 일당 여부 확인
            const isScheduleDaily = s.pay_type === 'day' || s.pay_type === '일당';
            const isDaily = isScheduleDaily || isEmpDaily;

            const hourlyWage = Number(emp.hourly_wage || 0);
            const dailyPay = Number(s.daily_pay_amount || 0) > 0 ? Number(s.daily_pay_amount) : Number(emp.daily_wage || 0);

            // ✅ 금액 계산 로직 분기
            let activeBasePay = 0;
            let activeMins = 0;

            if (isEmpMonthly) {
                // [월급제] 시간은 계산하되, 하루치 급여는 0원으로 처리 (나중에 통으로 더함)
                activeBasePay = 0; 
                activeMins = rawMins; // 휴게시간 공제 없이 순수 근무시간 기록 (보통 월급제는 이렇게 봄)
            } else if (isDaily) {
                // [일당제]
                activeBasePay = dailyPay;
                activeMins = cfg.auto_deduct_break ? deductedMins : rawMins;
            } else {
                // [시급제]
                activeMins = cfg.auto_deduct_break ? deductedMins : rawMins;
                activeBasePay = Math.floor((activeMins / 60) * hourlyWage);
            }

            // 추가 수당 계산 (월급제/일당제는 보통 0원 처리, 필요시 수정 가능)
            const nightMins = calculateNightMinutes(s.start_time, s.end_time);
            const potentialNightPay = (isDaily || isEmpMonthly) ? 0 : Math.floor((nightMins / 60) * hourlyWage * 0.5);

            let overMins = 0;
            if (activeMins > 480) overMins = activeMins - 480;
            const potentialOvertimePay = (isDaily || isEmpMonthly) ? 0 : Math.floor((overMins / 60) * hourlyWage * 0.5);

            let potentialHolidayWorkPay = 0;
            if (s.is_holiday_work && !isDaily && !isEmpMonthly) {
                potentialHolidayWorkPay = Math.floor((activeMins / 60) * hourlyWage * 0.5);
            }

            const nightPay = cfg.pay_night ? potentialNightPay : 0;
            const overtimePay = cfg.pay_overtime ? potentialOvertimePay : 0;
            const holidayWorkPay = cfg.pay_holiday ? potentialHolidayWorkPay : 0;

            if (isThisMonth) {
                ledger.push({
                    type: 'WORK',
                    date: s.date,
                    dayLabel: DAYS[scheduleDate.getDay()],
                    timeRange: `${s.start_time.slice(0,5)}~${s.end_time.slice(0,5)}`,
                    
                    hoursDeducted: (activeMins / 60).toFixed(1),
                    hoursNoDeduct: (rawMins / 60).toFixed(1),
                    breakMins: breakMins,

                    // 월급제면 0원 찍힘, 일당제면 일당, 시급제면 시급계산액
                    basePayDeducted: activeBasePay,
                    basePayNoDeduct: activeBasePay,
                    
                    basePay: activeBasePay,
                    nightPay: nightPay,      
                    overtimePay: overtimePay, 
                    holidayWorkPay: holidayWorkPay,
                    
                    // 비고란에 표시
                    note: [
                        s.is_holiday_work ? '특근' : '', 
                        isDaily ? '일당' : '',
                        isEmpMonthly ? '월급 포함' : '' 
                    ].filter(Boolean).join(', ')
                });

                // 월급제는 여기서 합산하지 않고(0원이니까), 나중에 통으로 더함
                totalBasePay += activeBasePay;
                totalNightPay += nightPay;
                totalOvertimePay += overtimePay;
                totalHolidayWorkPay += holidayWorkPay;
                totalWorkMinutes += activeMins;
            }

            if (!s.exclude_holiday_pay) {
                weekMinutes += activeMins;
            }
        });

        // 주휴수당 (시급제일 때만)
        if (isSameMonth(weekSunday, monthStart)) {
            let potentialWeeklyPay = 0;
            const hourlyWage = Number(emp.hourly_wage || 0);
            
            if (!isEmpDaily && !isEmpMonthly && weekMinutes >= 900 && hourlyWage > 0) { 
                const cappedWeekMinutes = Math.min(weekMinutes, 40 * 60); 
                potentialWeeklyPay = Math.floor((cappedWeekMinutes / 40 / 60) * 8 * hourlyWage);
            }

            const weeklyPay = cfg.pay_weekly ? potentialWeeklyPay : 0;
            
            if (potentialWeeklyPay > 0) {
                totalWeeklyPay += weeklyPay;
                ledger.push({
                    type: 'WEEKLY',
                    date: '',
                    dayLabel: '주휴',
                    timeRange: '-',
                    hours: '-',
                    basePay: 0,
                    nightPay: 0,
                    overtimePay: 0,
                    holidayWorkPay: 0,
                    potentialWeeklyPay: potentialWeeklyPay,
                    weeklyPay: weeklyPay, 
                    note: `1주 ${Math.floor(weekMinutes/60)}시간 근무`
                });
            }
        }
        current = addDays(current, 7);
    } // Loop End

    // ✅ [핵심 추가] 월급제인 경우, 고정 월급을 기본급에 더하고 별도 항목 추가
    if (isEmpMonthly) {
        const monthlyWage = Number(emp.monthly_wage || 0);
        totalBasePay += monthlyWage; // 총액에 반영

        // 명세서 맨 아래에 '기본급' 항목 추가
        ledger.push({
            type: 'MONTHLY_BASE',
            date: '',
            dayLabel: '기본급',
            timeRange: '-',
            hours: '-',
            basePay: monthlyWage,
            nightPay: 0,
            overtimePay: 0,
            holidayWorkPay: 0,
            note: '고정 월급'
        });
    }

    const totalPay = totalBasePay + totalNightPay + totalOvertimePay + totalHolidayWorkPay + totalWeeklyPay;

    let taxDetails = {
        pension: 0, health: 0, care: 0, employment: 0, incomeTax: 0, localTax: 0, total: 0
    };

    if (cfg.no_tax_deduction) {
        taxDetails.total = 0;
    } else {
        if (emp.employment_type && emp.employment_type.includes('four')) {
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
    }

    return {
      empId: emp.id,
      name: emp.name,
      wage: emp.hourly_wage,
      dailyWage: emp.daily_wage,
      monthlyWage: emp.monthly_wage,
      type: emp.employment_type,
      totalHours: (totalWorkMinutes / 60).toFixed(1), 
      basePay: totalBasePay,
      nightPay: totalNightPay,
      overtimePay: totalOvertimePay,
      holidayWorkPay: totalHolidayWorkPay,
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
      ledger: ledger,
      storeSettingsSnapshot: { ...storeSettings, ...cfg } 
    };
  });
}