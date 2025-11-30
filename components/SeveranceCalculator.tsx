'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import { format, differenceInCalendarDays, subMonths } from 'date-fns';
import DateSelector from './DateSelector';

type Props = { currentStoreId: string; employees: any[]; };

export default function SeveranceCalculator({ currentStoreId, employees }: Props) {
  const supabase = createSupabaseBrowserClient();
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [hireDate, setHireDate] = useState('');
  const [resignDate, setResignDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  // ✅ 콤마 처리를 위해 문자열로 관리 (초기값 빈 문자열)
  const [pay3MonthsStr, setPay3MonthsStr] = useState(''); 
  const [annualBonusStr, setAnnualBonusStr] = useState(''); 

  const [totalDays, setTotalDays] = useState(0); 
  const [avgWage, setAvgWage] = useState(0); 
  const [severancePay, setSeverancePay] = useState(0); 
  const [loadingAuto, setLoadingAuto] = useState(false);
  
  // ✅ 직원 선택 모달 상태
  const [isEmpSelectorOpen, setIsEmpSelectorOpen] = useState(false);

  // 직원 선택 핸들러
  const handleSelectEmployee = (empId: string) => {
    setSelectedEmpId(empId);
    const emp = employees.find(ep => ep.id === empId);
    setHireDate(emp?.hire_date || '');
    setIsEmpSelectorOpen(false); // 선택 후 바로 닫기
  };

  const selectedEmpName = employees.find(e => e.id === selectedEmpId)?.name || '';

  // 숫자 콤마 포맷팅 함수
  const formatNumber = (val: string) => {
    const num = Number(val.replace(/,/g, ''));
    if (isNaN(num) || num === 0) return '';
    return num.toLocaleString();
  };

  const handlePayChange = (val: string) => {
    setPay3MonthsStr(formatNumber(val));
  };

  const handleBonusChange = (val: string) => {
    setAnnualBonusStr(formatNumber(val));
  };

  useEffect(() => {
    if (hireDate && resignDate) {
      const start = new Date(hireDate);
      const end = new Date(resignDate);
      const diff = differenceInCalendarDays(end, start) + 1; 
      setTotalDays(diff > 0 ? diff : 0);
    } else { setTotalDays(0); }
  }, [hireDate, resignDate]);

  const fetchAutoData = useCallback(async () => {
    if (!currentStoreId || !selectedEmpId || !resignDate) return;
    setLoadingAuto(true);
    try {
      const rDate = new Date(resignDate);
      const startDateStr = format(subMonths(rDate, 3), 'yyyy-MM-dd');
      const { data: schedules } = await supabase.from('schedules').select('*').eq('store_id', currentStoreId).eq('employee_id', selectedEmpId).gte('date', startDateStr).lte('date', resignDate);
      const { data: emp } = await supabase.from('employees').select('hourly_wage').eq('id', selectedEmpId).single();
      
      if (schedules && emp) {
        let totalPay = 0;
        schedules.forEach((s: any) => {
            const [sH, sM] = s.start_time.split(':').map(Number);
            const [eH, eM] = s.end_time.split(':').map(Number);
            let rawMins = (eH * 60 + eM) - (sH * 60 + sM);
            if (rawMins < 0) rawMins += 24 * 60;
            const basePay = Math.floor((rawMins / 60) * emp.hourly_wage);
            totalPay += basePay;
        });
        setPay3MonthsStr(totalPay.toLocaleString());
      }
    } catch (e) { console.error(e); } finally { setLoadingAuto(false); }
  }, [currentStoreId, selectedEmpId, resignDate, supabase]);

  useEffect(() => { if (selectedEmpId) { setPay3MonthsStr(''); fetchAutoData(); } }, [selectedEmpId, fetchAutoData]);

  const calculateResult = () => {
    if (!hireDate || !resignDate || totalDays < 365) { alert('재직 기간이 1년 이상이어야 합니다.'); return; }
    const rDate = new Date(resignDate);
    const daysIn3Months = differenceInCalendarDays(rDate, subMonths(rDate, 3));
    
    // 콤마 제거 후 숫자 변환
    const payVal = Number(pay3MonthsStr.replace(/,/g, '')) || 0;
    const bonusVal = Number(annualBonusStr.replace(/,/g, '')) || 0;

    const total3MonthPay = payVal + (bonusVal * (3/12));
    const dailyWage = total3MonthPay / daysIn3Months; 
    const result = dailyWage * 30 * (totalDays / 365);
    setAvgWage(Math.floor(dailyWage));
    setSeverancePay(Math.floor(result / 10) * 10); 
  };

  return (
    <div style={cardStyle}>
      <h3 style={{ marginTop: 0, marginBottom: 20, color: '#333', borderBottom: '2px solid #eee', paddingBottom: 12 }}>💼 퇴직금 계산기</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 20 }}>
        <div>
            <label style={labelStyle}>직원 선택</label>
            {/* ✅ 커스텀 선택 버튼 */}
            <div onClick={() => setIsEmpSelectorOpen(true)} style={{ ...inputStyle, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{selectedEmpName || '직원을 선택하세요'}</span>
              <span style={{ fontSize: 12, color: '#999' }}>▼</span>
            </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={labelStyle}>퇴사일 (마지막 근무일)</label>
            <DateSelector value={resignDate} onChange={setResignDate} />
        </div>
      </div>

<div style={{ background: '#f9f9f9', padding: '16px', borderRadius: 8, marginBottom: 20, fontSize: 14, color: '#555' }}>
         {/* ✅ 모바일 줄바꿈 개선: flex-wrap 사용 */}
         <div style={{ marginBottom: 8 }}>
            📅 재직 기간: 
            {/* 모바일에서는 block으로 줄바꿈, PC에서는 inline 유지 (반응형 스타일) */}
            <span className="date-range-text" style={{ fontWeight: 'bold', color: '#333', marginLeft: 4 }}>
               {hireDate || '-'} ~ {resignDate}
            </span>
         </div>
         
         <div>
            ⏳ 총 재직일수: <strong style={{ color: totalDays >= 365 ? 'green' : 'crimson', fontSize: 16 }}>{totalDays}일</strong>
         </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>퇴사 전 3개월 급여 총액 {loadingAuto && '(계산 중...)'}</label>
        {/* ✅ 텍스트 입력으로 변경 (콤마 지원) */}
        <input 
          type="text" 
          value={pay3MonthsStr} 
          onChange={e => handlePayChange(e.target.value)} 
          placeholder="0" 
          style={inputStyle} 
          inputMode="numeric"
        />
      </div>

      <button onClick={calculateResult} style={btnStyle}>퇴직금 계산하기</button>

      {severancePay > 0 && (
        <div style={{ marginTop: 24, padding: 20, borderRadius: 8, backgroundColor: '#f0f8ff', border: '1px solid #b3d7ff' }}>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>예상 평균 일급: {avgWage.toLocaleString()}원</div>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: '#0056b3' }}>예상 퇴직금: {severancePay.toLocaleString()}원</div>
        </div>
      )}

      {/* ✅ 직원 선택 모달 (모바일 최적화) */}
      {isEmpSelectorOpen && (
        <div style={modalOverlayStyle} onClick={() => setIsEmpSelectorOpen(false)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h4 style={{ margin: '0 0 16px 0', textAlign: 'center', color:'#333' }}>직원 선택</h4>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {employees.map(emp => (
                <div 
                  key={emp.id} 
                  onClick={() => handleSelectEmployee(emp.id)}
                  style={{ 
                    padding: '12px', borderBottom: '1px solid #eee', cursor: 'pointer', 
                    color: selectedEmpId === emp.id ? 'dodgerblue' : '#333',
                    fontWeight: selectedEmpId === emp.id ? 'bold' : 'normal',
                    backgroundColor: selectedEmpId === emp.id ? '#f0f9ff' : 'transparent'
                  }}
                >
                  {emp.name}
                </div>
              ))}
            </div>
            <button onClick={() => setIsEmpSelectorOpen(false)} style={{ width: '100%', padding: '12px', marginTop: '16px', background: '#f5f5f5', border: 'none', borderRadius: '8px', fontWeight: 'bold', color: '#666' }}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}

// 스타일
const cardStyle = { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #ddd', marginBottom: '24px' };
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#555' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', boxSizing: 'border-box' as const, backgroundColor: '#fff', color: '#333' };
const btnStyle = { width: '100%', padding: '12px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' };

const modalOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' };
const modalContentStyle: React.CSSProperties = { width: '80%', maxWidth: '320px', backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' };