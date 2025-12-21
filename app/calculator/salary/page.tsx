'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

type WeekItem = {
  id: number;
  hours: string;
};

export default function SalaryCalculatorPage() {
  // 1. 기본 설정
  const [hourlyWage, setHourlyWage] = useState('10030'); // 2025년 최저시급
  const [totalWorkHours, setTotalWorkHours] = useState(''); // 월 총 근무시간

  // 2. 주휴수당 (주단위 추가 방식)
  const [weeks, setWeeks] = useState<WeekItem[]>([]); 

  // 3. 추가 수당 (토글 방식)
  const [showNight, setShowNight] = useState(false);
  const [nightHours, setNightHours] = useState('');

  const [showOvertime, setShowOvertime] = useState(false);
  const [overtimeHours, setOvertimeHours] = useState('');

  const [showHoliday, setShowHoliday] = useState(false);
  const [holidayHours, setHolidayHours] = useState('');

  // 4. 세금 설정
  const [taxType, setTaxType] = useState<'none' | '3.3' | '4'>('none');

  // 5. 결과값
  const [result, setResult] = useState({
    basePay: 0,
    weeklyPay: 0,
    allowancePay: 0,
    totalGross: 0,
    deduction: 0,
    finalPay: 0
  });

  // 숫자 입력 핸들러 (콤마 자동)
  const handleNumberInput = (val: string, setter: (v: string) => void) => {
    const num = val.replace(/[^0-9]/g, '');
    setter(num ? Number(num).toLocaleString() : '');
  };

  // 주휴수당 주 추가/삭제
  const addWeek = () => {
    setWeeks([...weeks, { id: Date.now(), hours: '' }]);
  };
  const removeWeek = (id: number) => {
    setWeeks(weeks.filter(w => w.id !== id));
  };
  const updateWeek = (id: number, val: string) => {
    const newWeeks = weeks.map(w => w.id === id ? { ...w, hours: val } : w);
    setWeeks(newWeeks);
  };

  // 실시간 자동 계산
  useEffect(() => {
    const wage = Number(hourlyWage.replace(/,/g, ''));
    if (!wage) return;

    // 1. 기본급 (총 시간 * 시급)
    const baseH = Number(totalWorkHours.replace(/,/g, '')) || 0;
    const basePay = baseH * wage;

    // 2. 주휴수당 계산 (각 주별로 계산해서 합산)
    // 조건: 15시간 이상이면 (시간/40)*8*시급, 40시간 초과면 8시간 고정
    let weeklyPayTotal = 0;
    weeks.forEach(w => {
      const h = Number(w.hours.replace(/,/g, '')) || 0;
      if (h >= 15) {
        const calcH = h > 40 ? 40 : h;
        weeklyPayTotal += (calcH / 40) * 8 * wage;
      }
    });
    weeklyPayTotal = Math.floor(weeklyPayTotal);

    // 3. 추가 수당 (0.5배 가산)
    // 보통 기본급에 1배가 포함되어 있다고 가정하고, 여기선 0.5배만 추가 계산
    // (사용자가 '총 근무시간'에 야간/연장 시간을 포함했다고 가정)
    const nH = Number(nightHours.replace(/,/g, '')) || 0;
    const oH = Number(overtimeHours.replace(/,/g, '')) || 0;
    const hH = Number(holidayHours.replace(/,/g, '')) || 0;
    
    const allowancePay = Math.floor((nH + oH + hH) * wage * 0.5);

    // 4. 총액 및 세금
    const totalGross = basePay + weeklyPayTotal + allowancePay;
    
    let deduction = 0;
    if (taxType === '3.3') {
      deduction = Math.floor(totalGross * 0.033);
    } else if (taxType === '4') {
      // 4대보험 대략 9.4% (국민4.5+건강3.545+요양0.46+고용0.9)
      deduction = Math.floor(totalGross * 0.094); 
    }
    // 원단위 절사
    deduction = Math.floor(deduction / 10) * 10;

    setResult({
      basePay,
      weeklyPay: weeklyPayTotal,
      allowancePay,
      totalGross,
      deduction,
      finalPay: totalGross - deduction
    });

  }, [hourlyWage, totalWorkHours, weeks, nightHours, overtimeHours, holidayHours, taxType]);


  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 10px' }}>
      
      <div style={{ backgroundColor: '#fff', maxWidth: '500px', width: '100%', padding: '30px 20px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#333', marginBottom: '24px', textAlign: 'center' }}>
          🧮 2026 알바비·급여 계산기
        </h1>

        <div className="input-group">
          <label>시급 (원)</label>
          <input type="text" value={hourlyWage} onChange={(e) => handleNumberInput(e.target.value, setHourlyWage)} className="calc-input" />
        </div>

        <div className="input-group">
          <label>이번 달 총 근무 시간</label>
          <input type="text" value={totalWorkHours} onChange={(e) => handleNumberInput(e.target.value, setTotalWorkHours)} className="calc-input" placeholder="예: 160" />
          <p className="hint">* 기본급 계산용 (야간/휴일 시간도 포함해서 입력하세요)</p>
        </div>

        {/* 주휴수당 섹션 */}
        <div className="section-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <label style={{ margin: 0 }}>주휴수당 계산</label>
            <button onClick={addWeek} style={btnSmall}>+ 1주 추가</button>
          </div>
          
          {weeks.length === 0 && <p className="hint">버튼을 눌러 주별 근무시간을 입력하면 자동 계산됩니다.</p>}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {weeks.map((week, idx) => (
              <div key={week.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', color: '#555', width: '40px' }}>{idx + 1}주차</span>
                <input 
                  type="text" 
                  value={week.hours} 
                  onChange={(e) => handleNumberInput(e.target.value, (v) => updateWeek(week.id, v))}
                  className="calc-input-small" 
                  placeholder="시간" 
                />
                <span style={{ fontSize: '14px' }}>시간</span>
                <button onClick={() => removeWeek(week.id)} style={{ marginLeft: 'auto', color: '#e74c3c', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
              </div>
            ))}
          </div>
        </div>

        {/* 추가 수당 버튼 섹션 */}
        <div className="section-box">
          <label style={{ marginBottom: '10px', display: 'block' }}>추가 수당 (0.5배 가산)</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button onClick={() => setShowNight(!showNight)} style={showNight ? btnActive : btnInactive}>🌙 야간</button>
            <button onClick={() => setShowOvertime(!showOvertime)} style={showOvertime ? btnActive : btnInactive}>⏰ 연장</button>
            <button onClick={() => setShowHoliday(!showHoliday)} style={showHoliday ? btnActive : btnInactive}>🎉 휴일</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {showNight && (
              <div className="allowance-row">
                <span>야간 시간</span>
                <input type="text" value={nightHours} onChange={(e) => handleNumberInput(e.target.value, setNightHours)} className="calc-input-small" placeholder="0" />
              </div>
            )}
            {showOvertime && (
              <div className="allowance-row">
                <span>연장 시간</span>
                <input type="text" value={overtimeHours} onChange={(e) => handleNumberInput(e.target.value, setOvertimeHours)} className="calc-input-small" placeholder="0" />
              </div>
            )}
            {showHoliday && (
              <div className="allowance-row">
                <span>휴일 시간</span>
                <input type="text" value={holidayHours} onChange={(e) => handleNumberInput(e.target.value, setHolidayHours)} className="calc-input-small" placeholder="0" />
              </div>
            )}
          </div>
        </div>

        {/* 세금 섹션 */}
        <div className="input-group">
          <label>세금 공제</label>
          <div style={{ display: 'flex', gap: '4px', background: '#f0f0f0', padding: '4px', borderRadius: '8px' }}>
            <button onClick={() => setTaxType('none')} style={taxType === 'none' ? tabActive : tabInactive}>미적용</button>
            <button onClick={() => setTaxType('3.3')} style={taxType === '3.3' ? tabActive : tabInactive}>3.3%</button>
            <button onClick={() => setTaxType('4')} style={taxType === '4' ? tabActive : tabInactive}>4대보험</button>
          </div>
        </div>

        <div className="divider"></div>

        {/* 결과 표시 */}
        <div style={{ textAlign: 'right' }}>
          <div style={resultRow}><span>기본급</span> <span>{result.basePay.toLocaleString()}원</span></div>
          {result.weeklyPay > 0 && <div style={{...resultRow, color: '#2980b9'}}><span>+ 주휴수당</span> <span>{result.weeklyPay.toLocaleString()}원</span></div>}
          {result.allowancePay > 0 && <div style={{...resultRow, color: '#e67e22'}}><span>+ 추가수당</span> <span>{result.allowancePay.toLocaleString()}원</span></div>}
          {result.deduction > 0 && <div style={{...resultRow, color: '#c0392b'}}><span>- 세금공제</span> <span>{result.deduction.toLocaleString()}원</span></div>}
          
          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '2px dashed #eee' }}>
            <span style={{ fontSize: '14px', color: '#666', marginRight: '10px' }}>예상 실수령액</span>
            <span style={{ fontSize: '28px', fontWeight: '900', color: '#0052cc' }}>{result.finalPay.toLocaleString()}원</span>
          </div>
        </div>

      </div>

      {/* 🔥 [HOOK] 이지알바 유입 배너 */}
      <div style={{ marginTop: '30px', textAlign: 'center', maxWidth: '500px' }}>
        <p style={{ fontSize: '15px', color: '#555', marginBottom: '16px', lineHeight: '1.6' }}>
          이걸 매달 엑셀로 계산하시나요?<br/>
          <strong>이지알바</strong>는 근무표만 짜면 <span style={{color:'crimson', fontWeight:'bold'}}>1초 만에 자동 계산</span>됩니다.
        </p>
        <Link href="/dashboard" style={{ 
          display: 'inline-block', width: '100%', padding: '16px 0', backgroundColor: '#27ae60', color: '#fff', 
          borderRadius: '12px', textDecoration: 'none', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 12px rgba(39, 174, 96, 0.3)'
        }}>
          🚀 이지알바 무료로 시작하기
        </Link>
      </div>

      <style jsx>{`
        .input-group { margin-bottom: 20px; }
        .input-group label { display: block; font-size: 14px; fontWeight: bold; color: #555; margin-bottom: 8px; }
        .calc-input { width: 100%; padding: 14px; border: 1px solid #ddd; borderRadius: 8px; font-size: 16px; outline: none; box-sizing: border-box; text-align: right; }
        .calc-input:focus { border-color: #0052cc; }
        .hint { font-size: 12px; color: #888; margin-top: 6px; }
        
        .section-box { background: #f8f9fa; padding: 16px; borderRadius: 12px; margin-bottom: 20px; border: 1px solid #eee; }
        .calc-input-small { flex: 1; padding: 10px; border: 1px solid #ddd; borderRadius: 6px; font-size: 14px; text-align: right; outline: none; }
        
        .allowance-row { display: flex; justify-content: space-between; alignItems: center; gap: 10px; font-size: 14px; color: #555; }
        
        .divider { height: 1px; background: #eee; margin: 30px 0; }
      `}</style>
    </div>
  );
}

// 스타일 객체
const btnSmall = { fontSize: '12px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #0052cc', color: '#0052cc', background: '#fff', cursor: 'pointer', fontWeight: 'bold' };
const btnActive = { 
  flex: 1, 
  padding: '8px', 
  borderRadius: '6px', 
  background: '#e6f7ff', 
  color: '#0052cc', 
  fontWeight: 'bold', 
  cursor: 'pointer', 
  border: '1px solid #0052cc' // ✅ 이거 하나만 남기세요
};
const btnInactive = { flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #ddd', background: '#fff', color: '#666', cursor: 'pointer' };
const tabActive = { flex: 1, padding: '10px', borderRadius: '6px', border: 'none', background: '#fff', color: '#333', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', cursor: 'pointer' };
const tabInactive = { flex: 1, padding: '10px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#888', cursor: 'pointer' };
const resultRow = { display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '15px', fontWeight: 'bold', color: '#333' } as const;