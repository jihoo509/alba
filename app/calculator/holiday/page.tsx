'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function HolidayCalculatorPage() {
  // 초기값 콤마 적용
  const [hourlyWage, setHourlyWage] = useState('10,030'); 
  const [hoursPerWeek, setHoursPerWeek] = useState('');
  
  const [result, setResult] = useState<number | null>(null);

  const handleCalculate = () => {
    const wage = Number(hourlyWage.replace(/,/g, ''));
    const hours = Number(hoursPerWeek.replace(/,/g, ''));

    if (!wage || !hours) return alert('시급과 근무시간을 입력해주세요.');

    if (hours < 15) {
      setResult(0);
      return;
    }

    // 40시간 초과 시 40시간으로 고정 (최대 8시간분)
    const calcHours = hours > 40 ? 40 : hours;
    const holidayPay = Math.floor((calcHours / 40) * 8 * wage);
    setResult(holidayPay);
  };

  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setter(val ? Number(val).toLocaleString() : '');
  };

  return (
    <div className="page-container">
      {/* 폰트 적용 및 스타일 */}
      <style jsx global>{`
        @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css");
        body {
          font-family: "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f5f6f8;
          color: #333;
        }
      `}</style>

      <style jsx>{`
        .page-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px 16px;
          overflow-x: hidden; /* 모바일 흔들림 방지 */
          width: 100%;
          box-sizing: border-box;
        }
        .card {
          background-color: #fff;
          max-width: 480px;
          width: 100%;
          padding: 32px 24px;
          border-radius: 24px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
          margin-bottom: 40px;
        }
        .input-group { margin-bottom: 20px; }
        .input-label { display: block; font-size: 14px; font-weight: 700; color: #4e5968; margin-bottom: 8px; }
        .calc-input {
          width: 100%; padding: 16px; border: 1px solid #d1d6db; border-radius: 12px;
          font-size: 17px; font-weight: 600; outline: none; transition: all 0.2s;
          box-sizing: border-box; text-align: right;
        }
        .calc-input:focus { border-color: #3182f6; box-shadow: 0 0 0 2px rgba(49, 130, 246, 0.1); }
        
        .calc-btn {
          width: 100%; padding: 18px; background-color: #3182f6; color: #fff; border: none;
          border-radius: 14px; font-size: 17px; font-weight: 700; cursor: pointer; margin-top: 10px;
          transition: background 0.2s;
        }
        .calc-btn:active { background-color: #1b64da; transform: scale(0.98); }

        .result-box {
          margin-top: 30px; padding: 24px; background-color: #f9faff; border-radius: 16px;
          text-align: center; border: 1px solid #e5e8eb;
        }

        .tip-box {
          background-color: #f2f4f6; padding: 20px; border-radius: 16px; margin-top: 24px;
        }
        .tip-title { font-size: 14px; font-weight: 800; color: #333; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
        .tip-list { list-style: none; padding: 0; margin: 0; font-size: 13px; color: #555; line-height: 1.6; }
        .tip-list li { position: relative; padding-left: 12px; margin-bottom: 6px; }
        .tip-list li::before { content: "•"; position: absolute; left: 0; color: #888; }

        /* 하단 홍보 섹션 */
        .promo-section {
          max-width: 480px; width: 100%; text-align: center; margin-top: 20px;
          padding: 30px 20px; background: #fff; border-radius: 24px;
        }
        .promo-title { font-size: 20px; font-weight: 800; margin-bottom: 24px; color: #191f28; }
        .promo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
        .promo-item { background: #f9f9f9; padding: 16px; border-radius: 16px; text-align: center; }
        .promo-icon { font-size: 24px; margin-bottom: 8px; display: block; }
        .promo-text { font-size: 13px; font-weight: 600; color: #333; word-break: keep-all; }
        
        .start-btn {
          display: block; width: 100%; padding: 16px; background-color: #27ae60; color: #fff;
          border-radius: 50px; text-decoration: none; font-weight: 800; font-size: 16px;
          box-shadow: 0 4px 10px rgba(39, 174, 96, 0.2); transition: transform 0.2s;
        }
        .start-btn:active { transform: scale(0.98); }
      `}</style>

      {/* 메인 계산기 카드 */}
      <div className="card">
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#191f28', marginBottom: '8px', textAlign: 'center' }}>
          💰 주휴수당 계산기
        </h1>
        <p style={{ textAlign: 'center', color: '#8b95a1', marginBottom: '32px', fontSize: '14px' }}>
          이번 주 내 알바비, 주휴수당은 얼마일까?
        </p>

        <div className="input-group">
          <label className="input-label">시급 (원)</label>
          <input 
            type="text" 
            value={hourlyWage} 
            onChange={(e) => handleNumberInput(e, setHourlyWage)} 
            className="calc-input"
            placeholder="예: 10,030"
            inputMode="numeric"
          />
        </div>

        <div className="input-group">
          <label className="input-label">일주일 총 근무 시간</label>
          <input 
            type="text" 
            value={hoursPerWeek} 
            onChange={(e) => handleNumberInput(e, setHoursPerWeek)} 
            className="calc-input"
            placeholder="예: 20"
            inputMode="numeric"
          />
          <p style={{ fontSize: '12px', color: '#8b95a1', marginTop: '6px', textAlign: 'right' }}>* 휴게시간 제외, 실제 근무시간</p>
        </div>

        <button onClick={handleCalculate} className="calc-btn">
          계산하기
        </button>

        {/* 결과 화면 */}
        {result !== null && (
          <div className="result-box">
            <span style={{ fontSize: '14px', color: '#3182f6', fontWeight: '700' }}>예상 주휴수당</span>
            <div style={{ fontSize: '30px', fontWeight: '800', color: '#333', margin: '8px 0' }}>
              {result.toLocaleString()}<span style={{ fontSize: '18px', fontWeight: '600' }}>원</span>
            </div>
            {result === 0 ? (
              <p style={{ fontSize: '13px', color: '#e74c3c', marginTop: '8px' }}>
                주 15시간 미만 근무 시 주휴수당이 발생하지 않습니다.
              </p>
            ) : (
              <p style={{ fontSize: '13px', color: '#6b7684', marginTop: '8px' }}>
                한 달(4.34주) 기준 약 <strong>{(result * 4.345).toLocaleString().split('.')[0]}원</strong> 더 받을 수 있어요!
              </p>
            )}
          </div>
        )}

        {/* 💡 주휴수당 상식 (요청하신 내용 반영) */}
        <div className="tip-box">
          <div className="tip-title">💡 알아두면 좋은 주휴수당 상식</div>
          <ul className="tip-list">
            <li><strong>퇴직하는 주(마지막 주)</strong>는 주휴수당이 발생하지 않아요. (주휴일 이전에 근로관계 종료 시)</li>
            <li><strong>대타 근무</strong> 등 일시적인 연장 근로 시간은 주휴수당 계산(소정근로시간)에 포함되지 않을 수 있어요.</li>
            <li><strong>주 40시간 이상</strong> 근무하더라도 주휴수당은 최대 40시간(8시간분)까지만 인정돼요.</li>
          </ul>
        </div>
      </div>

      {/* 🚀 이지알바 홍보 섹션 */}
      <div className="promo-section">
        <div style={{ fontSize: '13px', color: '#27ae60', fontWeight: 'bold', marginBottom: '8px' }}>사장님을 위한 필수 앱</div>
        <h2 className="promo-title">왜 '이지알바'를 써야 할까요?</h2>
        
        <div className="promo-grid">
          <div className="promo-item">
            <span className="promo-icon">📅</span>
            <div className="promo-text">복잡한 근무표<br/>자동 생성</div>
          </div>
          <div className="promo-item">
            <span className="promo-icon">💰</span>
            <div className="promo-text">주휴·야간수당<br/>1초 자동 계산</div>
          </div>
          <div className="promo-item">
            <span className="promo-icon">📱</span>
            <div className="promo-text">PC·모바일<br/>어디서나 관리</div>
          </div>
          <div className="promo-item">
            <span className="promo-icon">📄</span>
            <div className="promo-text">급여명세서<br/>간편 발송</div>
          </div>
        </div>

        <p style={{ fontSize: '14px', color: '#555', marginBottom: '20px', lineHeight: '1.5' }}>
          아직도 엑셀로 계산하시나요?<br/>
          이제 스트레스 받지 말고 편하게 관리하세요.
        </p>

        <Link href="/dashboard" className="start-btn">
          🚀 이지알바 무료로 시작하기
        </Link>
      </div>

    </div>
  );
}