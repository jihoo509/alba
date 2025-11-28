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

// overrides 파라미터 유지
export function calculateMonthlyPayroll(
  year: number, month: number, employees: any[], schedules: any[], storeSettings: any, overrides: any[] = []
) {
  return employees.map(emp => {
    const empSchedules = schedules.filter(s => s.employee_id === emp.id);
    
    // 이 직원을 위한 개별 설정이 있는지 확인
    const override = overrides.find(o => o.employee_id === emp.id);

    // 적용할 설정값 결정
    const cfg = {
        pay_weekly: override?.pay_weekly ?? storeSettings.pay_weekly,
        pay_night: override?.pay_night ?? (storeSettings.is_five_plus && storeSettings.pay_night),
        pay_overtime: override?.pay_overtime ?? (storeSettings.is_five_plus && storeSettings.pay_overtime),
        pay_holiday: override?.pay_holiday ?? (storeSettings.is_five_plus && storeSettings.pay_holiday),
        auto_deduct_break: override?.auto_deduct_break ?? (storeSettings.auto_deduct_break !== false),
        // ✅ [추가] 세금 공제 안 함 설정 (개별 설정 > 매장 설정 > 기본값 false)
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

        // 값 계산
        const basePayDeducted = Math.floor((deductedMins / 60) * emp.hourly_wage);
        const basePayNoDeduct = Math.floor((rawMins / 60) * emp.hourly_wage);
        
        // 결정된 cfg(설정)을 사용하여 적용 여부 판단
        const useBreak = cfg.auto_deduct_break;
        const activeBasePay = useBreak ? basePayDeducted : basePayNoDeduct;
        const activeMins = useBreak ? deductedMins : rawMins;

        const nightMins = calculateNightMinutes(s.start_time, s.end_time);
        const potentialNightPay = Math.floor((nightMins / 60) * emp.hourly_wage * 0.5);

        let overMins = 0;
        if (activeMins > 480) overMins = activeMins - 480;
        const potentialOvertimePay = Math.floor((overMins / 60) * emp.hourly_wage * 0.5);

        let potentialHolidayWorkPay = 0;
        if (s.is_holiday_work) {
            potentialHolidayWorkPay = Math.floor((activeMins / 60) * emp.hourly_wage * 0.5);
        }

        // cfg 설정에 따라 지급액 결정
        const nightPay = cfg.pay_night ? potentialNightPay : 0;
        const overtimePay = cfg.pay_overtime ? potentialOvertimePay : 0;
        const holidayWorkPay = cfg.pay_holiday ? potentialHolidayWorkPay : 0;

        if (isThisMonth) {
            ledger.push({
                type: 'WORK',
                date: s.date,
                dayLabel: DAYS[scheduleDate.getDay()],
                timeRange: `${s.start_time.slice(0,5)}~${s.end_time.slice(0,5)}`,
                
                hoursDeducted: (deductedMins / 60).toFixed(1),
                hoursNoDeduct: (rawMins / 60).toFixed(1),
                breakMins: breakMins,

                basePayDeducted: basePayDeducted,
                basePayNoDeduct: basePayNoDeduct,
                
                potentialNightPay: potentialNightPay,
                potentialOvertimePay: potentialOvertimePay,
                potentialHolidayWorkPay: potentialHolidayWorkPay,

                basePay: activeBasePay,
                nightPay: nightPay,      
                overtimePay: overtimePay, 
                holidayWorkPay: holidayWorkPay,
                
                note: s.is_holiday_work ? '특근' : ''
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

      if (isSameMonth(weekSunday, monthStart)) {
        let potentialWeeklyPay = 0;
        if (weekMinutes >= 900) { 
           const cappedWeekMinutes = Math.min(weekMinutes, 40 * 60); 
           potentialWeeklyPay = Math.floor((cappedWeekMinutes / 40 / 60) * 8 * emp.hourly_wage);
        }

        // cfg.pay_weekly 사용
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
    }

    const totalPay = totalBasePay + totalNightPay + totalOvertimePay + totalHolidayWorkPay + totalWeeklyPay;

    let taxDetails = {
        pension: 0, health: 0, care: 0, employment: 0, incomeTax: 0, localTax: 0, total: 0
    };

    // ✅ [수정] 공제 안 함 설정 시 세금 계산 건너뛰기
    if (cfg.no_tax_deduction) {
        // 모든 세금 0원 처리 (초기값 유지)
        taxDetails.total = 0;
    } else {
        // 기존 세금 계산 로직
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
    }

    return {
      empId: emp.id,
      name: emp.name,
      wage: emp.hourly_wage,
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
      // storeSettingsSnapshot에 현재 적용된 cfg(no_tax_deduction 포함) 저장
      storeSettingsSnapshot: { ...storeSettings, ...cfg } 
    };
  });
}