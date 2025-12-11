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

    // ✅ [수정] 설정 우선순위 로직 명확화
    // 1순위: override (개별 설정)이 있으면 무조건 따름 (true든 false든)
    // 2순위: override가 없으면(null/undefined), 매장 기본 설정 + 5인 이상 여부 확인
    const getSettingValue = (key: string, requireFivePlus: boolean) => {
        // 개별 설정값이 명확히(true/false) 존재하면 그 값을 반환
        if (override && override[key] !== undefined && override[key] !== null) {
            return override[key];
        }
        // 개별 설정 없으면 매장 설정 따름 (5인 이상 조건이 필요하면 체크)
        const storeValue = storeSettings[key] || false;
        if (requireFivePlus) {
            return storeSettings.is_five_plus && storeValue;
        }
        return storeValue;
    };

    const cfg = {
        pay_weekly: getSettingValue('pay_weekly', false), // 주휴는 5인 미만도 적용 가능하므로 5인체크 X (보통)
        pay_night: getSettingValue('pay_night', true),    // 야간: 기본적으론 5인 이상만
        pay_overtime: getSettingValue('pay_overtime', true), // 연장: 기본적으론 5인 이상만
        pay_holiday: getSettingValue('pay_holiday', true),   // 휴일: 기본적으론 5인 이상만
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

            const isScheduleDaily = s.pay_type === 'day' || s.pay_type === '일당';
            const isDaily = isScheduleDaily || isEmpDaily;

            const hourlyWage = Number(emp.hourly_wage || 0);
            const dailyPay = Number(s.daily_pay_amount || 0) > 0 ? Number(s.daily_pay_amount) : Number(emp.daily_wage || 0);

            let activeBasePay = 0;
            let activeMins = 0;

            if (isEmpMonthly) {
                activeBasePay = 0; 
                activeMins = rawMins; 
            } else if (isDaily) {
                activeBasePay = dailyPay;
                activeMins = cfg.auto_deduct_break ? deductedMins : rawMins;
            } else {
                activeMins = cfg.auto_deduct_break ? deductedMins : rawMins;
                activeBasePay = Math.floor((activeMins / 60) * hourlyWage);
            }

            // 추가 수당 계산 (잠재적 금액 계산)
            const nightMins = calculateNightMinutes(s.start_time, s.end_time);
            const potentialNightPay = (isDaily || isEmpMonthly) ? 0 : Math.floor((nightMins / 60) * hourlyWage * 0.5);

            let overMins = 0;
            if (activeMins > 480) overMins = activeMins - 480;
            const potentialOvertimePay = (isDaily || isEmpMonthly) ? 0 : Math.floor((overMins / 60) * hourlyWage * 0.5);

            let potentialHolidayWorkPay = 0;
            if (s.is_holiday_work && !isDaily && !isEmpMonthly) {
                potentialHolidayWorkPay = Math.floor((activeMins / 60) * hourlyWage * 0.5);
            }

            // 실제 지급액 (설정에 따라 결정)
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

                    basePayDeducted: activeBasePay,
                    basePayNoDeduct: activeBasePay,
                    
                    basePay: activeBasePay,
                    
                    // ✅ [중요] 실제 지급액
                    nightPay: nightPay,       
                    overtimePay: overtimePay, 
                    holidayWorkPay: holidayWorkPay,
                    
                    // ✅ [핵심 수정] 설정이 꺼져있어도 계산된 '잠재적 금액'을 무조건 보냄
                    // 그래야 팝업에서 체크박스를 켰을 때 이 금액을 보여줄 수 있음
                    potentialNightPay: potentialNightPay,
                    potentialOvertimePay: potentialOvertimePay,
                    potentialHolidayWorkPay: potentialHolidayWorkPay,
                    
                    note: [
                        s.is_holiday_work ? '특근' : '', 
                        isDaily ? '일당' : '',
                        isEmpMonthly ? '월급 포함' : '' 
                    ].filter(Boolean).join(', ')
                });

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

        // 주휴수당
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
                    potentialWeeklyPay: potentialWeeklyPay, // 이건 기존에도 잘 되어 있었음
                    weeklyPay: weeklyPay, 
                    note: `1주 ${Math.floor(weekMinutes/60)}시간 근무`
                });
            }
        }
        current = addDays(current, 7);
    } 

    if (isEmpMonthly) {
        const monthlyWage = Number(emp.monthly_wage || 0);
        totalBasePay += monthlyWage; 

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
      // storeSettingsSnapshot에는 계산된 cfg 값을 병합해서 보냄 (초기 팝업 상태용)
      storeSettingsSnapshot: { ...storeSettings, ...cfg } 
    };
  });
}