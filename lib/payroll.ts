import { startOfWeek, endOfWeek, addDays, format, isSameMonth, parseISO, isAfter } from 'date-fns';

export const TAX_RATES = {
  pension: 0.045, health: 0.03545, care: 0.1295, employment: 0.009, incomeTax: 0.03, localTax: 0.1
};
const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

// 1. 소득세 약식 계산
export const calculateIncomeTax = (monthlyPay: number) => {
  const income = monthlyPay; 
  if (income < 1060000) return { incomeTax: 0, localTax: 0 };

  let tax = 0;
  if (income < 1500000) tax = (income - 1060000) * 0.015; 
  else if (income < 2000000) tax = 6600 + (income - 1500000) * 0.03; 
  else if (income < 3000000) tax = 21600 + (income - 2000000) * 0.05; 
  else if (income < 4000000) tax = 71600 + (income - 3000000) * 0.07; 
  else if (income < 5000000) tax = 141600 + (income - 4000000) * 0.09; 
  else if (income < 7000000) tax = 231600 + (income - 5000000) * 0.12; 
  else tax = 471600 + (income - 7000000) * 0.15;

  const incomeTax = Math.floor(tax / 10) * 10;
  const localTax = Math.floor((incomeTax * 0.1) / 10) * 10;
  return { incomeTax, localTax };
};

// 2. 야간 시간 계산
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

// 3. 세금 계산
export function calculateTaxAmounts(totalPay: number, isFourIns: boolean, noTax: boolean) {
  if (noTax || totalPay <= 0) {
    return { pension: 0, health: 0, care: 0, employment: 0, incomeTax: 0, localTax: 0, total: 0 };
  }
  
  if (isFourIns) {
    const pension = Math.floor(totalPay * TAX_RATES.pension / 10) * 10;
    const health = Math.floor(totalPay * TAX_RATES.health / 10) * 10;
    const care = Math.floor(health * TAX_RATES.care / 10) * 10;
    const employment = Math.floor(totalPay * TAX_RATES.employment / 10) * 10;
    const { incomeTax, localTax } = calculateIncomeTax(totalPay);

    return { 
        pension, health, care, employment, incomeTax, localTax, 
        total: pension + health + care + employment + incomeTax + localTax 
    };
  } else {
    const incomeTax = Math.floor(totalPay * TAX_RATES.incomeTax / 10) * 10;
    const localTax = Math.floor(incomeTax * TAX_RATES.localTax / 10) * 10;
    return { pension: 0, health: 0, care: 0, employment: 0, incomeTax, localTax, total: incomeTax + localTax };
  }
}

// ✅ [핵심 변경] calculateMonthlyPayroll -> calculatePayrollByRange
// year, month 대신 startDateStr, endDateStr을 받습니다.
export function calculatePayrollByRange(
  startDateStr: string, 
  endDateStr: string, 
  employees: any[], 
  schedules: any[], 
  storeSettings: any, 
  overrides: any[] = []
) {
  return employees.map(emp => {
    // 1. 해당 직원의 스케줄만 필터링 (이미 상위에서 날짜 필터링을 했겠지만 안전장치)
    const empSchedules = schedules.filter(s => 
      s.employee_id === emp.id && s.date >= startDateStr && s.date <= endDateStr
    );
    const override = overrides.find(o => o.employee_id === emp.id);

    // 개별 설정 적용 여부 확인
    const isOverrideApplied = override && (
        override.pay_weekly !== null || override.pay_night !== null || 
        override.pay_overtime !== null || override.pay_holiday !== null || 
        override.auto_deduct_break !== null || override.no_tax_deduction !== null ||
        (override.monthly_override !== null && override.monthly_override !== undefined) 
    );

    const isEmpDaily = emp.pay_type === 'day' || emp.pay_type === '일당';
    const isEmpMonthly = emp.pay_type === 'month' || (emp.monthly_wage && emp.monthly_wage > 0);

    const getSettingValue = (key: string, requireFivePlus: boolean) => {
        if (override && override[key] !== undefined && override[key] !== null) {
            const val = override[key];
            if (val === true || val === 'true' || val === 1) return true;
            if (val === false || val === 'false' || val === 0) return false;
        }
        const storeValRaw = storeSettings[key];
        const isStoreSet = storeValRaw === true || storeValRaw === 'true' || storeValRaw === 1;
        if (requireFivePlus) {
             const isFivePlus = storeSettings.is_five_plus === true || storeSettings.is_five_plus === 'true';
             if (!isFivePlus) return false;
        }
        return isStoreSet;
    };

    const cfg = {
        pay_weekly: getSettingValue('pay_weekly', false), 
        pay_night: getSettingValue('pay_night', true),    
        pay_overtime: getSettingValue('pay_overtime', true), 
        pay_holiday: getSettingValue('pay_holiday', true),   
        auto_deduct_break: override?.auto_deduct_break ?? ((isEmpDaily || isEmpMonthly) ? false : (storeSettings.auto_deduct_break !== false)),
        no_tax_deduction: override?.no_tax_deduction ?? (storeSettings.no_tax_deduction || false)
    };
    
    let totalBasePay = 0; let totalNightPay = 0; let totalOvertimePay = 0; let totalHolidayWorkPay = 0; let totalWeeklyPay = 0; let totalWorkMinutes = 0; 
    let ledger: any[] = []; 

    // ✅ 날짜 루프 설정 (입력된 범위의 시작주 ~ 끝주)
    const rangeStart = parseISO(startDateStr);
    const rangeEnd = parseISO(endDateStr);
    
    // 주휴수당 계산을 위해 루프는 '범위의 첫 날이 포함된 주의 월요일' 부터 시작
    let current = startOfWeek(rangeStart, { weekStartsOn: 1 }); 
    const endLoop = endOfWeek(rangeEnd, { weekStartsOn: 1 });
    const processedWeeks = new Set();

    while (current <= endLoop) {
        const weekStartStr = format(current, 'yyyy-MM-dd');
        const weekSunday = addDays(current, 6);
        const weekEndStr = format(weekSunday, 'yyyy-MM-dd');

        if (processedWeeks.has(weekStartStr)) { current = addDays(current, 7); continue; }
        processedWeeks.add(weekStartStr);

        // 해당 주차에 포함되는 스케줄 필터링
        const weekSchedules = empSchedules.filter((s: any) => {
             return s.date >= weekStartStr && s.date <= weekEndStr;
        }).sort((a: any, b: any) => a.date.localeCompare(b.date));

        let weekMinutes = 0;

        weekSchedules.forEach((s: any) => {
            // ... (기존 시급/일당 계산 로직 유지) ...
            const [y, m, d] = s.date.split('-').map(Number);
            const scheduleDate = new Date(y, m - 1, d);
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
            let activeBasePay = 0; let activeMins = 0;

            if (isEmpMonthly) { activeBasePay = 0; activeMins = rawMins; } 
            else if (isDaily) { activeBasePay = dailyPay; activeMins = cfg.auto_deduct_break ? deductedMins : rawMins; } 
            else { activeMins = cfg.auto_deduct_break ? deductedMins : rawMins; activeBasePay = Math.floor((activeMins / 60) * hourlyWage); }

            const nightMins = calculateNightMinutes(s.start_time, s.end_time);
            const potentialNightPay = (isDaily || isEmpMonthly) ? 0 : Math.floor((nightMins / 60) * hourlyWage * 0.5);
            let overMins = 0; if (activeMins > 480) overMins = activeMins - 480;
            const potentialOvertimePay = (isDaily || isEmpMonthly) ? 0 : Math.floor((overMins / 60) * hourlyWage * 0.5);
            let potentialHolidayWorkPay = 0; if (s.is_holiday_work && !isDaily && !isEmpMonthly) { potentialHolidayWorkPay = Math.floor((activeMins / 60) * hourlyWage * 0.5); }

            const nightPay = cfg.pay_night ? potentialNightPay : 0;
            const overtimePay = cfg.pay_overtime ? potentialOvertimePay : 0;
            const holidayWorkPay = cfg.pay_holiday ? potentialHolidayWorkPay : 0;

            // ✅ 장부(Ledger) 추가: 조회 기간(Range) 내에 있는 날짜만 장부에 표시하고 합산
            if (s.date >= startDateStr && s.date <= endDateStr) {
                ledger.push({
                    type: 'WORK', date: s.date, dayLabel: DAYS[scheduleDate.getDay()],
                    timeRange: `${s.start_time.slice(0,5)}~${s.end_time.slice(0,5)}`,
                    hoursDeducted: (activeMins / 60).toFixed(1), hoursNoDeduct: (rawMins / 60).toFixed(1), breakMins: breakMins,
                    basePayDeducted: activeBasePay, basePayNoDeduct: isDaily ? dailyPay : Math.floor((rawMins / 60) * hourlyWage),
                    basePay: activeBasePay, nightPay, overtimePay, holidayWorkPay,
                    potentialNightPay, potentialOvertimePay, potentialHolidayWorkPay,
                    note: [ s.is_holiday_work ? '특근' : '', isDaily ? '일당' : '', isEmpMonthly ? '월급 포함' : '' ].filter(Boolean).join(', ')
                });
                totalBasePay += activeBasePay; totalNightPay += nightPay; totalOvertimePay += overtimePay; totalHolidayWorkPay += holidayWorkPay; totalWorkMinutes += activeMins;
            }

            // 주휴수당 계산용 시간 합산은 범위 밖이라도 '같은 주'라면 포함해야 정확함
            if (!s.exclude_holiday_pay) { weekMinutes += activeMins; }
        });

        // ✅ [핵심 로직] 주휴수당 지급 판단
        // 조건: 해당 주의 마지막 날(일요일)이 조회 기간(endDateStr) 안에 포함되어 있어야 함.
        // 예: 1일(월)~3일(수) 조회 -> weekEndStr은 7일(일). 7일 > 3일 이므로 주휴수당 미지급.
        if (weekEndStr <= endDateStr && weekEndStr >= startDateStr) {
            let potentialWeeklyPay = 0; const hourlyWage = Number(emp.hourly_wage || 0);
            if (!isEmpDaily && !isEmpMonthly && weekMinutes >= 900 && hourlyWage > 0) { 
                const cappedWeekMinutes = Math.min(weekMinutes, 40 * 60); 
                potentialWeeklyPay = Math.floor((cappedWeekMinutes / 40 / 60) * 8 * hourlyWage);
            }
            const weeklyPay = cfg.pay_weekly ? potentialWeeklyPay : 0;
            
            // 주휴수당 발생 시 장부 추가
            if (potentialWeeklyPay > 0) {
                totalWeeklyPay += weeklyPay;
                ledger.push({ type: 'WEEKLY', date: weekEndStr, dayLabel: '주휴', timeRange: '-', hours: '-', basePay: 0, nightPay: 0, overtimePay: 0, holidayWorkPay: 0, potentialWeeklyPay, weeklyPay, note: `1주 ${Math.floor(weekMinutes/60)}시간 근무` });
            }
        }
        current = addDays(current, 7);
    } 

    if (isEmpMonthly) {
        const monthlyWage = Number(emp.monthly_wage || 0); totalBasePay += monthlyWage; 
        ledger.push({ type: 'MONTHLY_BASE', date: '', dayLabel: '기본급', timeRange: '-', hours: '-', basePay: monthlyWage, nightPay: 0, overtimePay: 0, holidayWorkPay: 0, note: '고정 월급' });
    }

    const totalPay = totalBasePay + totalNightPay + totalOvertimePay + totalHolidayWorkPay + totalWeeklyPay;
    const taxDetails = calculateTaxAmounts(totalPay, emp.employment_type && emp.employment_type.includes('four'), cfg.no_tax_deduction);

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
      details: { bank: emp.bank_name, account: emp.account_number }, 
      birthDate: emp.birth_date, 
      phoneNumber: emp.phone_number,
      
      // ✅ [수정] 날짜가 같으면 주휴수당(WEEKLY)을 맨 뒤로 보내는 정렬 로직
      ledger: ledger.sort((a, b) => {
        // 1. 날짜가 다르면 날짜순 정렬 (오름차순)
        if (a.date !== b.date) {
            return a.date > b.date ? 1 : -1;
        }
        // 2. 날짜가 같다면(일요일), '주휴(WEEKLY)'가 뒤로 가도록 설정
        if (a.type === 'WEEKLY') return 1;
        if (b.type === 'WEEKLY') return -1;
        
        return 0;
      }), 

      storeSettingsSnapshot: { ...storeSettings, ...cfg },
      isOverrideApplied: isOverrideApplied 
    };
  });
}