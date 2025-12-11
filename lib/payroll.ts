import { startOfWeek, endOfWeek, addDays, format, isSameMonth } from 'date-fns';

// ✅ [중요] 세금 요율 상수를 외부에서 쓸 수 있게 export 합니다.
export const TAX_RATES = {
  pension: 0.045, 
  health: 0.03545, 
  care: 0.1295, 
  employment: 0.009, 
  incomeTax: 0.03, // 3.3% 프리랜서용 (소득세 3%)
  localTax: 0.1    // 지방세 (소득세의 10%)
};

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

// 야간 시간(분) 계산 함수
function calculateNightMinutes(start: string, end: string) {
  const [sH, sM] = start.split(':').map(Number);
  const [eH, eM] = end.split(':').map(Number);
  let startMin = sH * 60 + sM;
  let endMin = eH * 60 + eM;
  
  if (endMin < startMin) endMin += 24 * 60; // 다음날로 넘어가는 경우
  
  let nightMin = 0;
  for (let t = startMin; t < endMin; t++) {
    const timeOfDay = t % 1440; 
    // 22:00(1320분) ~ 06:00(360분)
    if (timeOfDay >= 1320 || timeOfDay < 360) nightMin++;
  }
  return nightMin;
}

// ✅ [신규] 세금 계산 로직 공통 함수 (어디서든 똑같은 결과 보장)
export function calculateTaxAmounts(totalPay: number, isFourIns: boolean, noTax: boolean) {
  // 급여가 없거나 세금 안 냄 설정이면 0원
  if (noTax || totalPay <= 0) {
    return { pension: 0, health: 0, care: 0, employment: 0, incomeTax: 0, localTax: 0, total: 0 };
  }

  if (isFourIns) {
    // 4대보험 (원단위 절사)
    const pension = Math.floor(totalPay * TAX_RATES.pension / 10) * 10;
    const health = Math.floor(totalPay * TAX_RATES.health / 10) * 10;
    const care = Math.floor(health * TAX_RATES.care / 10) * 10;
    const employment = Math.floor(totalPay * TAX_RATES.employment / 10) * 10;
    return {
      pension, health, care, employment, incomeTax: 0, localTax: 0,
      total: pension + health + care + employment
    };
  } else {
    // 3.3% 프리랜서
    const incomeTax = Math.floor(totalPay * TAX_RATES.incomeTax / 10) * 10;
    const localTax = Math.floor(incomeTax * TAX_RATES.localTax / 10) * 10;
    return {
      pension: 0, health: 0, care: 0, employment: 0,
      incomeTax, localTax,
      total: incomeTax + localTax
    };
  }
}

export function calculateMonthlyPayroll(
  year: number, month: number, employees: any[], schedules: any[], storeSettings: any, overrides: any[] = []
) {
  return employees.map(emp => {
    const empSchedules = schedules.filter(s => s.employee_id === emp.id);
    const override = overrides.find(o => o.employee_id === emp.id);

    const isEmpDaily = emp.pay_type === 'day' || emp.pay_type === '일당';
    const isEmpMonthly = emp.pay_type === 'month' || (emp.monthly_wage && emp.monthly_wage > 0);

    // ✅ [수정] 설정값 병합 로직 (Override 우선순위 강화)
    const getSettingValue = (key: string, requireFivePlus: boolean) => {
        // 1. 개별 설정(Override)이 있으면 무조건 따름 (5인 이상 여부 무시)
        if (override && override[key] !== undefined && override[key] !== null) {
            const val = override[key];
            // DB에서 true/false가 문자열이나 숫자로 올 경우 방어 코드
            if (val === true || val === 'true' || val === 1) return true;
            if (val === false || val === 'false' || val === 0) return false;
        }

        // 2. 개별 설정 없으면 매장 기본값 확인
        const storeValRaw = storeSettings[key];
        const isStoreSet = storeValRaw === true || storeValRaw === 'true' || storeValRaw === 1;

        // 3. 매장 설정을 따를 때만 '5인 이상 필수' 조건 체크
        if (requireFivePlus) {
             const isFivePlus = storeSettings.is_five_plus === true || storeSettings.is_five_plus === 'true';
             if (!isFivePlus) return false; // 5인 미만이면 false 강제
        }
        return isStoreSet;
    };

    // 설정 확정
    const cfg = {
        pay_weekly: getSettingValue('pay_weekly', false), 
        pay_night: getSettingValue('pay_night', true),    
        pay_overtime: getSettingValue('pay_overtime', true), 
        pay_holiday: getSettingValue('pay_holiday', true),   
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

            // 추가 수당 계산 (잠재적 금액 - 설정이 꺼져 있어도 계산해둠)
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

                    // 휴게 차감 여부에 따른 기본급 미리 계산
                    basePayDeducted: activeBasePay, 
                    basePayNoDeduct: isDaily ? dailyPay : Math.floor((rawMins / 60) * hourlyWage),
                    
                    basePay: activeBasePay,
                    
                    nightPay: nightPay,        
                    overtimePay: overtimePay, 
                    holidayWorkPay: holidayWorkPay,
                    
                    // 팝업에서 옵션 켤 때 보여줄 금액
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
                    potentialWeeklyPay: potentialWeeklyPay,
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

    // ✅ [수정] 위에서 만든 공통 세금 함수 호출
    const taxDetails = calculateTaxAmounts(
        totalPay, 
        emp.employment_type && emp.employment_type.includes('four'), 
        cfg.no_tax_deduction
    );

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
      // storeSettingsSnapshot에 계산된 최종 cfg 값을 병합해서 보냄
      storeSettingsSnapshot: { ...storeSettings, ...cfg } 
    };
  });
}