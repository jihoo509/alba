'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function HolidayCalculatorPage() {
  // 입력 상태
  const [hourlyWage, setHourlyWage] = useState('10030'); // 2025년 최저시급 기본값
  const [hoursPerWeek, setHoursPerWeek] = useState('');
  
  // 결과 상태
  const [result, setResult] = useState<number | null>(null);

  const handleCalculate = () => {
    const wage = Number(hourlyWage.replace(/,/g, ''));
    const hours = Number(hoursPerWeek.replace(/,/g, ''));

    if (!wage || !hours) return alert('시급과 근무시간을 입력해주세요.');

    // 주휴수당 계산 공식 (40시간 이상은 40시간으로 고정)
    // (1주 근무시간 / 40) * 8 * 시급
    // 단, 15시간 미만은 0원
    if (hours < 15) {
      setResult(0);
      return;
    }

    const calcHours = hours > 40 ? 40 : hours;
    const holidayPay = Math.floor((calcHours / 40) * 8 * wage);
    setResult(holidayPay);
  };

  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setter(val ? Number(val).toLocaleString() : '');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      
      {/* 계산기 카드 */}
      <div style={{ backgroundColor: '#fff', maxWidth: '480px', width: '100%', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#333', marginBottom: '8px', textAlign: 'center' }}>
          💰 주휴수당 계산기
        </h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '32px', fontSize: '14px' }}>
          이번 주 내 알바비, 주휴수당은 얼마일까?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#555', marginBottom: '8px' }}>시급 (원)</label>
            <input 
              type="text" 
              value={hourlyWage} 
              onChange={(e) => handleNumberInput(e, setHourlyWage)} 
              className="calc-input"
              placeholder="예: 10,030"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#555', marginBottom: '8px' }}>일주일 총 근무 시간</label>
            <input 
              type="text" 
              value={hoursPerWeek} 
              onChange={(e) => handleNumberInput(e, setHoursPerWeek)} 
              className="calc-input"
              placeholder="예: 20"
            />
            <p style={{ fontSize: '12px', color: '#999', marginTop: '6px' }}>* 휴게시간 제외, 실제 일한 시간만 입력하세요.</p>
          </div>

          <button 
            onClick={handleCalculate}
            style={{ 
              width: '100%', padding: '16px', backgroundColor: '#0052cc', color: '#fff', border: 'none', 
              borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px',
              transition: 'background 0.2s'
            }}
          >
            계산하기
          </button>
        </div>

        {/* 결과 화면 */}
        {result !== null && (
          <div style={{ marginTop: '30px', padding: '24px', backgroundColor: '#f0f7ff', borderRadius: '16px', textAlign: 'center', border: '1px solid #cce5ff' }}>
            <span style={{ fontSize: '14px', color: '#0052cc', fontWeight: 'bold' }}>예상 주휴수당</span>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#333', margin: '8px 0' }}>
              {result.toLocaleString()}<span style={{ fontSize: '20px', fontWeight: 'normal' }}>원</span>
            </div>
            {result === 0 ? (
              <p style={{ fontSize: '13px', color: '#e74c3c' }}>주 15시간 미만 근무는 주휴수당 대상이 아닙니다.</p>
            ) : (
              <p style={{ fontSize: '13px', color: '#666' }}>
                한 달(4.34주) 기준 약 <strong>{(result * 4.345).toLocaleString().split('.')[0]}원</strong> 더 받을 수 있어요!
              </p>
            )}
          </div>
        )}
      </div>

      {/* 🔥 [HOOK] 이지알바 유입 배너 */}
      <div style={{ marginTop: '40px', textAlign: 'center', maxWidth: '480px' }}>
        <p style={{ fontSize: '15px', color: '#555', marginBottom: '16px', lineHeight: '1.5' }}>
          매번 계산하기 귀찮으신가요?<br/>
          <strong>이지알바</strong>로 급여 명세서까지 1초 만에 보내세요.
        </p>
        <Link href="/dashboard" style={{ 
          display: 'inline-block', padding: '14px 24px', backgroundColor: '#27ae60', color: '#fff', 
          borderRadius: '50px', textDecoration: 'none', fontWeight: 'bold', fontSize: '15px', boxShadow: '0 4px 12px rgba(39, 174, 96, 0.3)'
        }}>
          🚀 이지알바 무료로 시작하기
        </Link>
      </div>

      <style jsx>{`
        .calc-input {
          width: 100%; padding: 16px; border: 2px solid #eee; border-radius: 12px; font-size: 16px; outline: none; transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .calc-input:focus { border-color: #0052cc; }
      `}</style>
    </div>
  );
}