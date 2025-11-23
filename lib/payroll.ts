import { differenceInMinutes, getDay, startOfWeek, endOfWeek, addDays, format, isSameMonth } from 'date-fns';

// 야간 시간(22:00 ~ 06:00) 분 단위 계산
function calculateNightMinutes(start: string, end: string) {
  // 로직 단순화를 위해 모든 시간을 분으로 변환 (00:00 = 0, 24:00 = 1440)
  const [sH, sM] = start.split(':').map(Number);
  const [eH, eM] = end.split(':').map(Number);
  
  let startMin = sH * 60 + sM;
  let endMin = eH * 60 + eM;
  if (endMin < startMin) endMin += 24 * 60; // 익일

  let nightMin = 0;
  // 하루를 넘어가는 스케줄을 1분 단위로 루프 돌며 체크 (정확도 최우선)
  for (let t = startMin; t < endMin; t++) {
    // 하루 기준 시간 (0~1440)
    const timeOfDay = t % 1440; 
    // 22:00(1320분) ~ 06:00(360분) 사이인지 체크
    if (timeOfDay >= 1320 || timeOfDay < 360) {
      nightMin++;
    }
  }
  return nightMin;
}

// 이번 달 급여 계산 메인 함수
export function calculateMonthlyPayroll(
  year: number, 
  month: number, 
  employees: any[], 
  schedules: any[], 
  storeSettings: any
) {
  const payrollData = employees.map(emp => {
    // 1. 해당 직원의 스케줄만 필터링
    const empSchedules = schedules.filter(s => s.employee_id === emp.id);
    
    let totalWorkMinutes = 0;
    let totalNightMinutes = 0;
    let weeklyHolidayPay = 0; // 주휴수당 총액

    // --- 주휴수당 계산 로직 (주 단위 그룹핑) ---
    // 해당 월의 1일이 포함된 주의 월요일부터 ~ 말일이 포함된 주의 일요일까지 계산
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);
    
    // 계산 범위: 달력의 첫 주 월요일 ~ 마지막 주 일요일
    let current = startOfWeek(monthStart, { weekStartsOn: 1 }); // 월요일 시작
    const endLoop = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const processedWeeks = new Set(); // 중복 계산 방지

    // 주 단위로 순회
    while (current <= endLoop) {
      const weekStartStr = format(current, 'yyyy-MM-dd');
      if (processedWeeks.has(weekStartStr)) {
        current = addDays(current, 7);
        continue;
      }
      processedWeeks.add(weekStartStr);

      // 이 주의 일요일 (주휴 판단 기준일)
      const weekSunday = addDays(current, 6);
      
      // 🚨 핵심: 이 주의 일요일이 "현재 계산 중인 달"에 속해야만 이번 달 주휴로 인정
      // (사장님 요청: 10월 말~11월 초 걸친 주는 11월 급여에 포함)
      if (isSameMonth(weekSunday, monthStart)) {
        // 이 주차의 스케줄 찾기
        const weekSchedules = empSchedules.filter(s => {
          const d = new Date(s.date);
          return d >= current && d <= weekSunday;
        });

        // 주간 총 근무시간 계산
        let weekMinutes = 0;
        weekSchedules.forEach(s => {
          if (s.exclude_holiday_pay) return; // 주휴 제외 체크된 스케줄은 빠짐
          
          const [sH, sM] = s.start_time.split(':').map(Number);
          const [eH, eM] = s.end_time.split(':').map(Number);
          let mins = (eH * 60 + eM) - (sH * 60 + sM);
          if (mins < 0) mins += 24 * 60;
          weekMinutes += mins;
        });

        // 주 15시간(900분) 이상이면 주휴 발생
        if (weekMinutes >= 900) {
          // 주휴수당 공식: (주근무시간 / 40) * 8 * 시급
          // 단, 주 40시간 초과 시 최대 8시간분만 지급
          const cappedWeekMinutes = Math.min(weekMinutes, 40 * 60);
          const holidayPay = (cappedWeekMinutes / 40 / 60) * 8 * emp.hourly_wage;
          weeklyHolidayPay += holidayPay;
        }
      }
      
      // 다음 주 월요일로 이동
      current = addDays(current, 7);
    }

    // --- 기본급 및 야간수당 계산 (일별 합산) ---
    // 이건 월별 필터링된 스케줄만 가지고 계산
    const thisMonthSchedules = empSchedules.filter(s => {
        const d = new Date(s.date);
        return d.getMonth() === month - 1 && d.getFullYear() === year;
    });

    thisMonthSchedules.forEach(s => {
      const [sH, sM] = s.start_time.split(':').map(Number);
      const [eH, eM] = s.end_time.split(':').map(Number);
      let mins = (eH * 60 + eM) - (sH * 60 + sM);
      if (mins < 0) mins += 24 * 60;

      totalWorkMinutes += mins;

      // 5인 이상이면 야간수당 계산
      if (storeSettings.is_five_plus) {
        totalNightMinutes += calculateNightMinutes(s.start_time, s.end_time);
      }
    });

    // 금액 계산
    const basePay = (totalWorkMinutes / 60) * emp.hourly_wage;
    const nightPay = (totalNightMinutes / 60) * emp.hourly_wage * 0.5; // 0.5배 가산
    
    const totalPay = basePay + nightPay + weeklyHolidayPay;

    // 세금 계산
    let tax = 0;
    if (emp.employment_type.includes('free')) {
      // 3.3%
      tax = Math.floor(totalPay * 0.033);
    } else if (emp.employment_type.includes('four')) {
      // 4대보험 (약식 9.32% - 국민4.5 + 건강3.545 + 요양0.46 + 고용0.9)
      // 정확한 건 요율표 따라야 하지만 일단 근사치 적용
      tax = Math.floor(totalPay * 0.0932);
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
      tax: Math.floor(tax),
      finalPay: Math.floor(totalPay - tax),
      details: {
        bank: emp.bank_name,
        account: emp.account_number,
        residentId: emp.resident_number // (DB에 추가했다면)
      }
    };
  });

  return payrollData;
}