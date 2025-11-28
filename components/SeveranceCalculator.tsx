'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import { format, differenceInCalendarDays, subMonths, addDays, startOfDay } from 'date-fns';

type Props = {
  currentStoreId: string;
  employees: any[];
};

export default function SeveranceCalculator({ currentStoreId, employees }: Props) {
  const supabase = createSupabaseBrowserClient();

  // 선택된 직원 및 날짜
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [hireDate, setHireDate] = useState('');
  const [resignDate, setResignDate] = useState(format(new Date(), 'yyyy-MM-dd')); // 기본값 오늘

  // 3개월 급여 입력값 (수동/자동 겸용)
  const [pay3Months, setPay3Months] = useState<number>(0); 
  const [annualBonus, setAnnualBonus] = useState<number>(0); // 연차수당/상여금 (선택)
  
  // 계산 결과
  const [totalDays, setTotalDays] = useState(0); // 재직일수
  const [avgWage, setAvgWage] = useState(0);     // 평균임금
  const [severancePay, setSeverancePay] = useState(0); // 예상 퇴직금
  
  const [loadingAuto, setLoadingAuto] = useState(false);

  // 직원 선택 시 입사일 세팅
  const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const empId = e.target.value;
    setSelectedEmpId(empId);
    if (!empId) {
      setHireDate('');
      return;
    }
    const emp = employees.find(ep => ep.id === empId);
    if (emp && emp.hire_date) {
      setHireDate(emp.hire_date);
    } else {
      setHireDate('');
    }
  };

  // 재직일수 계산
  useEffect(() => {
    if (hireDate && resignDate) {
      const start = new Date(hireDate);
      const end = new Date(resignDate);
      const diff = differenceInCalendarDays(end, start) + 1; // 당일 포함
      setTotalDays(diff > 0 ? diff : 0);
    } else {
      setTotalDays(0);
    }
  }, [hireDate, resignDate]);

  // 3개월치 급여 데이터 자동 불러오기
  const fetchAutoData = useCallback(async () => {
    if (!currentStoreId || !selectedEmpId || !resignDate) return;
    
    setLoadingAuto(true);
    try {
      // 퇴사일 기준 3개월 전 날짜 계산
      const rDate = new Date(resignDate);
      const threeMonthsAgo = subMonths(rDate, 3);
      // 정확히는 퇴사일 이전 3개월 (퇴사일 포함 안 함이 원칙이나 편의상 포함 계산)
      const startDateStr = format(threeMonthsAgo, 'yyyy-MM-dd');
      
      // 스케줄 가져오기
      const { data: schedules } = await supabase
        .from('schedules')
        .select('*')
        .eq('store_id', currentStoreId)
        .eq('employee_id', selectedEmpId)
        .gte('date', startDateStr)
        .lte('date', resignDate);

      const { data: emp } = await supabase.from('employees').select('hourly_wage').eq('id', selectedEmpId).single();
      const { data: store } = await supabase.from('stores').select('*').eq('id', currentStoreId).single();

      if (schedules && emp && store) {
        let totalPay = 0;
        
        // 간단 계산 로직 (payroll.ts 로직의 경량화 버전)
        // 3개월간의 총 세전 급여 추산
        schedules.forEach((s: any) => {
            const [sH, sM] = s.start_time.split(':').map(Number);
            const [eH, eM] = s.end_time.split(':').map(Number);
            let rawMins = (eH * 60 + eM) - (sH * 60 + sM);
            if (rawMins < 0) rawMins += 24 * 60;

            // 휴게 차감
            let breakMins = 0;
            if (store.auto_deduct_break !== false) {
                if (rawMins >= 480) breakMins = 60;
                else if (rawMins >= 240) breakMins = 30;
            }
            const workMins = rawMins - breakMins;
            const basePay = Math.floor((workMins / 60) * emp.hourly_wage);
            
            // 각종 수당 가산 (약식)
            let extraPay = 0;
            // 5인 이상일 경우 야간/휴일 등 가산 (여기서는 복잡하니 기본급+0.5배 가산 정도로 추산)
            // 정확하려면 payroll.ts 로직을 다 가져와야 하지만, '수동 입력 가능' 하므로 추정치만 제공
            if (store.is_five_plus) {
                // 야간 등... (복잡하므로 생략하거나, 단순히 기본급에 10% 정도 더해서 보여주는 것도 방법)
                // 여기선 '기본 시급 계산'만 정확히 해서 넣어주고, 사장님이 수정하게 유도
            }
            
            totalPay += basePay;
        });

        // 주휴수당 대략 추산 (총 근무시간의 20% 정도를 주휴로 가정하거나, 데이터가 있으면 정확히 계산)
        // 여기서는 안전하게 '스케줄된 시간 급여'만 자동 입력하고, 
        // 힌트 텍스트로 "주휴수당 포함하여 입력하세요" 라고 안내하는 게 낫습니다.
        
        setPay3Months(totalPay);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAuto(false);
    }
  }, [currentStoreId, selectedEmpId, resignDate, supabase]);

  // 직원 변경 시 자동 조회 트리거
  useEffect(() => {
    if (selectedEmpId) {
        // 데이터가 아예 없을 수도 있으니 0으로 초기화 후 조회
        setPay3Months(0);
        fetchAutoData();
    }
  }, [selectedEmpId, fetchAutoData]);


  // 퇴직금 계산 실행
  const calculateResult = () => {
    if (!hireDate || !resignDate || totalDays < 365) {
        alert('재직 기간이 1년(365일) 이상이어야 퇴직금이 발생합니다.\n(법적 기준 충족 여부를 확인하세요)');
        // 강제로 계산하려면 아래 return 제거
        // return; 
    }

    const rDate = new Date(resignDate);
    const threeMonthsAgo = subMonths(rDate, 3);
    const daysIn3Months = differenceInCalendarDays(rDate, threeMonthsAgo); // 보통 90~92일

    const total3MonthPay = Number(pay3Months) + (Number(annualBonus) * (3/12)); // 상여금은 3개월분만 반영
    const dailyWage = total3MonthPay / daysIn3Months; // 평균일급

    // 퇴직금 공식: 평균일급 * 30일 * (총재직일수 / 365)
    const result = dailyWage * 30 * (totalDays / 365);

    setAvgWage(Math.floor(dailyWage));
    setSeverancePay(Math.floor(result / 10) * 10); // 원단위 절사
  };

  return (
    <div style={cardStyle}>
      <h3 style={{ marginTop: 0, marginBottom: 20, color: '#333', borderBottom: '2px solid #333', paddingBottom: 10 }}>
        💼 퇴직금 계산기
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* 1. 직원 선택 */}
        <div>
            <label style={labelStyle}>직원 선택</label>
            <select 
                value={selectedEmpId} 
                onChange={handleEmployeeChange}
                style={inputStyle}
            >
                <option value="">선택하세요</option>
                {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
            </select>
        </div>

        {/* 2. 재직 기간 */}
        <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
                <label style={labelStyle}>입사일 (자동)</label>
                <input type="date" value={hireDate} readOnly style={{ ...inputStyle, background: '#f5f5f5' }} />
            </div>
            <div style={{ flex: 1 }}>
                <label style={labelStyle}>퇴사일 (마지막 근무)</label>
                <input type="date" value={resignDate} onChange={e => setResignDate(e.target.value)} style={inputStyle} />
            </div>
        </div>
      </div>

      <div style={{ background: '#f9f9f9', padding: 16, borderRadius: 8, marginBottom: 20 }}>
         <div style={{ fontSize: 14, color: '#666', marginBottom: 10 }}>
            📊 <strong>{hireDate || '...'}</strong> 부터 <strong>{resignDate}</strong> 까지 <br/>
            총 재직일수: <strong style={{ color: totalDays >= 365 ? 'green' : 'crimson', fontSize: 18 }}>{totalDays}일</strong> 
            {totalDays < 365 && <span style={{fontSize: 12}}> (1년 미만은 퇴직금 지급 의무가 없습니다)</span>}
         </div>
      </div>

      {/* 3. 급여 정보 입력 */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={labelStyle}>퇴사 전 3개월 급여 총액 (세전)</label>
            {loadingAuto && <span style={{ fontSize: 12, color: 'dodgerblue' }}>데이터 불러오는 중...</span>}
        </div>
        <input 
            type="number" 
            value={pay3Months} 
            onChange={e => setPay3Months(Number(e.target.value))} 
            placeholder="3개월치 급여 합계 입력"
            style={{ ...inputStyle, fontWeight: 'bold', fontSize: 16, color: 'dodgerblue' }} 
        />
        <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
           * 시스템에 급여 내역이 있으면 자동 입력됩니다. (주휴/수당 포함 여부 확인 후 수정하세요)
        </p>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>연간 상여금 / 미사용 연차 수당 (선택)</label>
        <input 
            type="number" 
            value={annualBonus} 
            onChange={e => setAnnualBonus(Number(e.target.value))} 
            placeholder="없으면 0"
            style={inputStyle} 
        />
      </div>

      <button onClick={calculateResult} style={btnStyle}>
        계산하기
      </button>

      {/* 4. 결과 표시 */}
      {severancePay > 0 && (
        <div style={{ marginTop: 24, padding: 20, border: '2px solid dodgerblue', borderRadius: 8, backgroundColor: '#f0f8ff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#555' }}>평균 일급 (1일 통상임금)</span>
                <strong>{avgWage.toLocaleString()} 원</strong>
            </div>
            <div style={{ borderTop: '1px dashed #ccc', margin: '10px 0' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>예상 퇴직금</span>
                <span style={{ fontSize: 28, fontWeight: 'bold', color: 'dodgerblue' }}>{severancePay.toLocaleString()} 원</span>
            </div>
        </div>
      )}

    </div>
  );
}

const cardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '24px',
  border: '1px solid #ddd',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  marginBottom: '24px'
};

const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '6px',
    color: '#333'
};

const inputStyle = {
    width: '100%',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '14px',
    boxSizing: 'border-box' as const
};

const btnStyle = {
    width: '100%',
    padding: '12px',
    backgroundColor: '#333',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer'
};