'use client';

import React, { useState } from 'react';
import Link from 'next/link';

// ✅ 사장님이 주신 기능 소개 데이터 (이미지 경로 / 추가)
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
      {/* 폰트 적용 */}
      <style jsx global>{`
        @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css");
        body {
          font-family: "Pretendard Variable", Pretendard, sans-serif;
          margin: 0; padding: 0; background-color: #f5f6f8; color: #333;
        }
        /* 모바일 전용 스타일 */
        @media (max-width: 768px) {
          .mobile-reverse { flex-direction: column-reverse !important; }
          .mobile-center { text-align: center !important; }
          .promo-text-box { padding: 0 !important; }
        }
      `}</style>

      <style jsx>{`
        .page-container {
          min-height: 100vh; display: flex; flexDirection: column; alignItems: center;
          padding-top: 40px; box-sizing: border-box; overflow-x: hidden;
        }
        
        /* 계산기 영역 스타일 */
        .calculator-section {
          width: 100%; display: flex; justify-content: center; padding: 0 20px; box-sizing: border-box; margin-bottom: 80px;
        }
        .card {
          background-color: #fff; max-width: 480px; width: 100%; padding: 32px 24px;
          border-radius: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.06);
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
        }
        .result-box {
          margin-top: 30px; padding: 24px; background-color: #f9faff; border-radius: 16px;
          text-align: center; border: 1px solid #e5e8eb;
        }
        .tip-box { background-color: #f2f4f6; padding: 20px; border-radius: 16px; margin-top: 24px; }
        .tip-title { font-size: 14px; font-weight: 800; color: #333; margin-bottom: 10px; }
        .tip-list { list-style: none; padding: 0; margin: 0; font-size: 13px; color: #555; line-height: 1.6; }
        .tip-list li::before { content: "•"; padding-right: 6px; color: #888; }

        /* 🔥 [로그인 페이지 스타일 적용] 기능 소개 섹션 */
        .features-wrapper {
          width: 100%; background-color: #fff; padding: 80px 20px; display: flex; justify-content: center;
        }
        .features-container {
          max-width: 1000px; width: 100%; display: flex; flexDirection: column; gap: 80px;
        }
        .main-title {
          font-size: 32px; font-weight: 900; color: #333; textAlign: center; margin-bottom: 20px; line-height: 1.3;
        }
        
        .feature-row {
          display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 40px; width: 100%;
        }
        .promo-text-box {
          flex: 1 1 300px; max-width: 100%;
        }
        .promo-title {
          font-size: 24px; font-weight: 800; color: #0052cc; margin-bottom: 16px; line-height: 1.4; word-break: keep-all;
        }
        .promo-desc {
          font-size: 17px; line-height: 1.7; color: #555; margin: 0; word-break: keep-all;
        }
        .promo-img-box {
          flex: 1 1 300px; display: flex; justify-content: center; max-width: 100%;
        }
        .promo-img {
          width: 100%; max-width: 500px; height: auto; border-radius: 16px; 
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }

        /* 하단 고정 CTA */
        .bottom-cta {
          position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
          width: 90%; max-width: 400px; z-index: 100;
        }
        .start-btn {
          display: block; width: 100%; padding: 18px; background-color: #27ae60; color: #fff;
          border-radius: 50px; text-decoration: none; font-weight: 800; font-size: 17px; text-align: center;
          box-shadow: 0 8px 20px rgba(39, 174, 96, 0.4); transition: transform 0.1s;
        }
        .start-btn:active { transform: translateX(-50%) scale(0.98); }
      `}</style>

      {/* 1. 계산기 영역 */}
      <div className="calculator-section">
        <div className="card">
          <h1 style={{ fontSize: '22px', fontWeight: '800', textAlign: 'center', marginBottom: '8px' }}>💰 주휴수당 계산기</h1>
          <p style={{ textAlign: 'center', color: '#8b95a1', marginBottom: '32px', fontSize: '15px' }}>이번 주 내 알바비, 주휴수당은 얼마?</p>

          <div className="input-group">
            <label className="input-label">시급 (원)</label>
            <input type="text" value={hourlyWage} onChange={(e) => handleNumberInput(e, setHourlyWage)} className="calc-input" placeholder="예: 10,030" inputMode="numeric" />
          </div>

          <div className="input-group">
            <label className="input-label">일주일 총 근무 시간</label>
            <input type="text" value={hoursPerWeek} onChange={(e) => handleNumberInput(e, setHoursPerWeek)} className="calc-input" placeholder="예: 20" inputMode="numeric" />
            <p style={{ fontSize: '12px', color: '#8b95a1', marginTop: '6px', textAlign: 'right' }}>* 휴게시간 제외, 실제 근무시간</p>
          </div>

          <button onClick={handleCalculate} className="calc-btn">계산하기</button>

          {result !== null && (
            <div className="result-box">
              <span style={{ fontSize: '14px', color: '#3182f6', fontWeight: '700' }}>예상 주휴수당</span>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#333', margin: '8px 0' }}>{result.toLocaleString()}<span style={{ fontSize: '20px', fontWeight: '600' }}>원</span></div>
              {result === 0 ? <p style={{ fontSize: '13px', color: '#e74c3c' }}>주 15시간 미만은 주휴수당 대상이 아닙니다.</p> : 
                <p style={{ fontSize: '13px', color: '#6b7684' }}>한 달 기준 약 <strong>{(result * 4.345).toLocaleString().split('.')[0]}원</strong> 더 받아요!</p>}
            </div>
          )}

          <div className="tip-box">
            <div className="tip-title">💡 알아두면 좋은 팁</div>
            <ul className="tip-list">
              <li><strong>퇴직하는 주</strong>는 주휴수당이 발생하지 않아요.</li>
              <li><strong>대타 근무</strong> 시간은 주휴수당 계산에서 제외될 수 있어요.</li>
              <li><strong>주 40시간 이상</strong> 근무해도 최대 8시간분까지만 인정돼요.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 2. 기능 소개 (FEATURES) - 로그인 페이지 스타일 */}
      <div className="features-wrapper">
        <div className="features-container">
          <h2 className="main-title">이지알바,<br className="mobile-only"/> 왜 써야 할까요?</h2>
          
          {FEATURES.map((feature, index) => (
            <div key={index} 
              className="feature-row" 
              style={{ flexDirection: index % 2 === 0 ? 'row' : 'row-reverse' }}
            >
              {/* 텍스트 */}
              <div className="promo-text-box mobile-center">
                <h3 className="promo-title">{feature.title}</h3>
                <p className="promo-desc">{feature.desc}</p>
              </div>

              {/* 이미지 */}
              <div className="promo-img-box">
                <img src={`/${feature.img}`} alt={feature.title} className="promo-img" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 고정 CTA 버튼 */}
      <div className="bottom-cta">
        <Link href="/dashboard" className="start-btn">🚀 이지알바 무료로 시작하기</Link>
      </div>

      <div style={{ height: '80px' }}></div>
    </div>
  );
}