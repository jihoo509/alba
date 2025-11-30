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
  const [pay3Months, setPay3Months] = useState<number>(0); 
  const [annualBonus, setAnnualBonus] = useState<number>(0);
  const [totalDays, setTotalDays] = useState(0); 
  const [avgWage, setAvgWage] = useState(0); 
  const [severancePay, setSeverancePay] = useState(0); 
  const [loadingAuto, setLoadingAuto] = useState(false);

  const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const empId = e.target.value;
    setSelectedEmpId(empId);
    const emp = employees.find(ep => ep.id === empId);
    setHireDate(emp?.hire_date || '');
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
        setPay3Months(totalPay);
      }
    } catch (e) { console.error(e); } finally { setLoadingAuto(false); }
  }, [currentStoreId, selectedEmpId, resignDate, supabase]);

  useEffect(() => { if (selectedEmpId) { setPay3Months(0); fetchAutoData(); } }, [selectedEmpId, fetchAutoData]);

  const calculateResult = () => {
    if (!hireDate || !resignDate || totalDays < 365) { alert('재직 기간이 1년 이상이어야 합니다.'); return; }
    const rDate = new Date(resignDate);
    const daysIn3Months = differenceInCalendarDays(rDate, subMonths(rDate, 3));
    const total3MonthPay = Number(pay3Months) + (Number(annualBonus) * (3/12));
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
            <select value={selectedEmpId} onChange={handleEmployeeChange} style={inputStyle}>
                <option value="">직원을 선택하세요</option>
                {employees.map(emp => (<option key={emp.id} value={emp.id}>{emp.name}</option>))}
            </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={labelStyle}>퇴사일 (마지막 근무일)</label>
            <DateSelector value={resignDate} onChange={setResignDate} />
        </div>
      </div>

      <div style={{ background: '#f9f9f9', padding: '16px', borderRadius: 8, marginBottom: 20, fontSize: 14, color: '#555' }}>
         📅 재직 기간: <strong>{hireDate || '-'}</strong> ~ <strong>{resignDate}</strong> <br/>
         ⏳ 총 재직일수: <strong style={{ color: totalDays >= 365 ? 'green' : 'crimson', fontSize: 16 }}>{totalDays}일</strong>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>퇴사 전 3개월 급여 총액 {loadingAuto && '(계산 중...)'}</label>
        <input type="number" value={pay3Months} onChange={e => setPay3Months(Number(e.target.value))} placeholder="0" style={inputStyle} />
      </div>

      <button onClick={calculateResult} style={btnStyle}>퇴직금 계산하기</button>

      {severancePay > 0 && (
        <div style={{ marginTop: 24, padding: 20, borderRadius: 8, backgroundColor: '#f0f8ff', border: '1px solid #b3d7ff' }}>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>예상 평균 일급: {avgWage.toLocaleString()}원</div>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: '#0056b3' }}>예상 퇴직금: {severancePay.toLocaleString()}원</div>
        </div>
      )}
    </div>
  );
}

const cardStyle = { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #ddd', marginBottom: '24px' };
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#555' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', boxSizing: 'border-box' as const, backgroundColor: '#fff', color: '#333' };
const btnStyle = { width: '100%', padding: '12px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' };