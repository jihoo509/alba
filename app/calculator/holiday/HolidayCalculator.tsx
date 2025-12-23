'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// ✅ 기능 소개 데이터
const FEATURES = [
  {
    title: "직원 & 알바 관리, 평생 무료로 시작하세요",
    desc: "복잡한 직원 관리, 아직도 엑셀로 하시나요? 이지알바는 직원 등록부터 급여 명세서 생성까지 모든 기능을 무료로 제공합니다. PC와 모바일 어디서든 사장님의 매장을 효율적으로 관리해보세요.",
    img: "/1.png"
  },
  {
    title: "이메일 & 카카오로 3초 간편 가입",
    desc: "복잡한 절차 없이 구글, 카카오 계정으로 3초 만에 시작할 수 있습니다. 별도의 설치가 필요 없는 웹 기반 서비스로, 언제 어디서나 즉시 접속하여 매장 현황을 파악할 수 있습니다.",
    img: "/2.png"
  },
  {
    title: "복잡한 직원 정보, 한 페이지에서 끝",
    desc: "이름, 연락처, 시급, 입사일 등 흩어져 있는 직원 정보를 한눈에 관리하세요. 근로계약서 작성에 필요한 필수 정보들을 체계적으로 정리하여 보관할 수 있습니다.",
    img: "/3.png"
  },
  {
    title: "근무 패턴 생성으로 스케줄 자동화",
    desc: "오픈조, 미들조, 마감조 등 매장의 고정된 근무 패턴을 미리 만들어두세요. 매번 새로 짤 필요 없이, 만들어둔 패턴을 직원에 할당하기만 하면 시간표가 완성됩니다.",
    img: "/4.png"
  },
  {
    title: "클릭 한 번으로 월별 스케줄 완성",
    desc: "설정해둔 근무 패턴과 직원 데이터를 바탕으로 달력에 스케줄을 자동으로 생성합니다. 급하게 대타가 필요하거나 근무가 변경되어도 드래그 앤 드롭으로 손쉽게 수정할 수 있습니다.",
    img: "/5.png"
  },
  {
    title: "급여 명세서 자동 생성 및 발송",
    desc: "가장 골치 아픈 급여 계산, 이제 자동으로 해결하세요. 주휴수당, 야간수당, 연장수당 등 복잡한 가산 수당이 법 기준에 맞춰 자동으로 계산되며, 급여 명세서까지 원클릭으로 생성됩니다.",
    img: "/6.png"
  }
];

export default function HolidayCalculatorPage() {
  const [hourlyWage, setHourlyWage] = useState('10,030'); 
  
  // ✅ [수정] 기본값을 15시간 0분으로 설정 (주휴수당 최소 기준)
  const [weeklyHours, setWeeklyHours] = useState('15');
  const [weeklyMinutes, setWeeklyMinutes] = useState('0');
  
  const [result, setResult] = useState<number>(0);

  // ✅ 실시간 자동 계산
  useEffect(() => {
    const wage = Number(hourlyWage.replace(/,/g, ''));
    const h = Number(weeklyHours.replace(/,/g, ''));
    const m = Number(weeklyMinutes.replace(/,/g, ''));

    if (!wage || (h === 0 && m === 0)) {
        setResult(0);
        return;
    }

    const totalHours = h + (m / 60);

    if (totalHours < 15) {
      setResult(0);
      return;
    }

    const calcHours = totalHours > 40 ? 40 : totalHours;
    const holidayPay = Math.floor((calcHours / 40) * 8 * wage);
    
    setResult(holidayPay);

  }, [hourlyWage, weeklyHours, weeklyMinutes]);

  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setter(val ? Number(val).toLocaleString() : '');
  };

  return (
    <div className="page-container">
      <style jsx global>{`
        @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css");
        body { font-family: "Pretendard Variable", Pretendard, sans-serif; margin: 0; padding: 0; background-color: #f5f6f8; color: #333; overflow-x: hidden; }
        * { box-sizing: border-box; }
        footer { padding-bottom: 120px !important; }
      `}</style>

      <style jsx>{`
        /* Compact Mode 적용 */
        .page-container { min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding-top: 40px; overflow-x: hidden; width: 100%; padding-bottom: 80px; }
        .calculator-section { width: 100%; display: flex; justify-content: center; padding: 0 16px; margin-bottom: 60px; }
        .card { background-color: #fff; max-width: 480px; width: 100%; padding: 28px 24px; border-radius: 20px; box-shadow: 0 8px 24px rgba(0,0,0,0.06); transition: padding 0.3s; }
        .input-group { margin-bottom: 16px; }
        .input-label { display: block; font-size: 14px; font-weight: 700; color: #4e5968; margin-bottom: 6px; }
        .calc-input { width: 100%; padding: 12px; border: 1px solid #d1d6db; border-radius: 10px; font-size: 16px; font-weight: 600; outline: none; transition: all 0.2s; text-align: right; font-family: inherit; }
        .calc-input:focus { border-color: #3182f6; box-shadow: 0 0 0 3px rgba(49, 130, 246, 0.1); }
        .time-input-row { display: flex; gap: 8px; align-items: center; }
        .time-input-wrap { flex: 1; position: relative; }
        .unit-text { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); font-size: 14px; color: #8b95a1; font-weight: 500; }
        .calc-input-time { padding-right: 42px; }
        .result-box { margin-top: 20px; padding: 20px; background-color: #f9faff; border-radius: 14px; text-align: center; border: 1px solid #e5e8eb; }
        .tip-box { background-color: #f2f4f6; padding: 20px; border-radius: 14px; margin-top: 20px; }
        .tip-title { font-size: 14px; font-weight: 800; color: #333; margin-bottom: 10px; }
        .tip-list { list-style: none; padding: 0; margin: 0; font-size: 13px; color: #555; line-height: 1.6; }
        .tip-list li { margin-bottom: 4px; position: relative; padding-left: 10px; word-break: keep-all; }
        .tip-list li::before { content: "•"; position: absolute; left: 0; color: #888; }
        .features-wrapper { width: 100%; background-color: #fff; padding: 60px 0; display: flex; justify-content: center; }
        .features-container { max-width: 1000px; width: 100%; padding: 0 20px; display: flex; flex-direction: column; align-items: center; gap: 60px; }
        .section-title { font-size: 28px; font-weight: 900; color: #333; text-align: center; margin-bottom: 10px; line-height: 1.3; letter-spacing: -1px; word-break: keep-all; }
        .feature-card { display: flex; flex-wrap: wrap; alignItems: center; justify-content: center; gap: 30px; width: 100%; }
        .feature-text { flex: 1 1 300px; max-width: 100%; padding: 10px; }
        .feature-img-box { flex: 1 1 300px; display: flex; justify-content: center; max-width: 100%; }
        .feature-img { width: 100%; max-width: 400px; height: auto; border-radius: 14px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
        .bottom-cta { position: fixed; bottom: 0; left: 0; width: 100%; background-color: #fff; padding: 12px 20px; box-shadow: 0 -4px 20px rgba(0,0,0,0.1); z-index: 100; display: flex; justify-content: center; }
        .start-btn { display: block; width: 100%; max-width: 400px; padding: 16px; background-color: #27ae60; color: #fff; border-radius: 50px; text-decoration: none; font-weight: 800; font-size: 18px; text-align: center; box-shadow: 0 8px 20px rgba(39, 174, 96, 0.4); transition: transform 0.1s; }
        .start-btn:active { transform: scale(0.98); }
        @media (max-width: 768px) { .mobile-hide { display: none; } .page-container { padding-top: 20px; } .card { padding: 20px 16px; } .section-title { font-size: 24px; } .feature-text { text-align: center; } .feature-card { flex-direction: column-reverse !important; gap: 20px; } }
      `}</style>

      <div className="calculator-section">
        <div className="card">
          <h1 style={{ fontSize: '24px', fontWeight: '800', textAlign: 'center', marginBottom: '6px', color: '#191f28' }}>💰 주휴수당 계산기</h1>
          <p style={{ textAlign: 'center', color: '#8b95a1', marginBottom: '24px', fontSize: '14px' }}>복잡한 주휴수당, 바로 확인해보세요!</p>

          <div className="input-group">
            <label className="input-label">시급 (원)</label>
            <input 
                type="text" 
                value={hourlyWage} 
                onChange={(e) => handleNumberInput(e, setHourlyWage)}
                onFocus={() => { if(hourlyWage === '10,030') setHourlyWage(''); }}
                onBlur={() => { if(hourlyWage === '') setHourlyWage('10,030'); }}
                className="calc-input" 
                placeholder="예: 10,030" 
                inputMode="numeric" 
            />
          </div>

          {/* ✅ [수정] 클릭 시 값 초기화 기능 적용 (15 -> 빈값, 0 -> 빈값) */}
          <div className="input-group">
            <label className="input-label">일주일 총 근무 시간</label>
            <div className="time-input-row">
                <div className="time-input-wrap">
                    <input 
                        type="text" 
                        value={weeklyHours} 
                        onChange={(e) => handleNumberInput(e, setWeeklyHours)} 
                        // 클릭 시 15면 비우고, 비어있으면 15 복구
                        onFocus={() => { if(weeklyHours === '15') setWeeklyHours(''); }}
                        onBlur={() => { if(weeklyHours === '') setWeeklyHours('15'); }}
                        className="calc-input calc-input-time" 
                        placeholder="0" 
                        inputMode="numeric" 
                    />
                    <span className="unit-text">시간</span>
                </div>
                <div className="time-input-wrap">
                    <input 
                        type="text" 
                        value={weeklyMinutes} 
                        onChange={(e) => handleNumberInput(e, setWeeklyMinutes)} 
                        // 클릭 시 0이면 비우고, 비어있으면 0 복구
                        onFocus={() => { if(weeklyMinutes === '0') setWeeklyMinutes(''); }}
                        onBlur={() => { if(weeklyMinutes === '') setWeeklyMinutes('0'); }}
                        className="calc-input calc-input-time" 
                        placeholder="0" 
                        inputMode="numeric" 
                    />
                    <span className="unit-text">분</span>
                </div>
            </div>
            <p style={{ fontSize: '12px', color: '#8b95a1', marginTop: '6px', textAlign: 'right' }}>* 휴게시간 제외, 실제 근무시간</p>
          </div>

          <div className="result-box">
            <span style={{ fontSize: '14px', color: '#3182f6', fontWeight: '700' }}>예상 주휴수당 (주급)</span>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#333', margin: '8px 0' }}>
              {result.toLocaleString()}<span style={{ fontSize: '20px', fontWeight: '600', marginLeft: '4px' }}>원</span>
            </div>
            
            {(!weeklyHours && !weeklyMinutes) ? (
                 <p style={{ fontSize: '13px', color: '#8b95a1' }}>시간을 입력하면 자동으로 계산됩니다.</p>
            ) : result === 0 ? (
                <p style={{ fontSize: '13px', color: '#e74c3c' }}>주 15시간 미만은 주휴수당 대상이 아닙니다.</p>
            ) : (
                <p style={{ fontSize: '13px', color: '#6b7684' }}>한 달 기준 약 <strong>{(result * 4.345).toLocaleString().split('.')[0]}원</strong> 더 받아요!</p>
            )}
          </div>

          <div className="tip-box">
            <div className="tip-title">💡 알아두면 좋은 팁</div>
            <ul className="tip-list">
              <li><strong>퇴직하는 주</strong>는 주휴수당이 발생하지 않아요.</li>
              <li><strong>대타로 근무한 시간</strong>은 주휴시간 계산에서 제외할 수 있어요.</li>
              <li><strong>주 40시간 초과</strong> 근무는 주휴수당에 포함되지 않습니다.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="features-wrapper">
        <div className="features-container">
          <h2 className="section-title">이지알바,<br className="mobile-only"/> 왜 써야 할까요?</h2>
          {FEATURES.map((feature, index) => (
            <div key={index} className="feature-card" style={{ flexDirection: index % 2 === 0 ? 'row' : 'row-reverse' }}>
              <div className="feature-text">
                <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0052cc', marginBottom: '14px', wordBreak: 'keep-all', lineHeight: '1.4' }}>{feature.title}</h3>
                <p style={{ fontSize: '16px', lineHeight: '1.7', color: '#555', margin: 0, wordBreak: 'keep-all' }}>{feature.desc}</p>
              </div>
              <div className="feature-img-box"><img src={feature.img} alt={feature.title} className="feature-img" /></div>
            </div>
          ))}
        </div>
      </div>

      <div className="bottom-cta">
        <Link href="/dashboard" className="start-btn">🚀 이지알바 무료로 시작하기</Link>
      </div>
    </div>
  );
}