'use client';

import React, { useState } from 'react';
import Link from 'next/link';

// ✅ 사장님이 주신 기능 소개 데이터
const FEATURES = [
  {
    title: "직원 & 알바 관리, 평생 무료로 시작하세요",
    desc: "복잡한 직원 관리, 아직도 엑셀로 하시나요? 이지알바는 직원 등록부터 급여 명세서 생성까지 모든 기능을 무료로 제공합니다.",
    img: "/1.png"
  },
  {
    title: "이메일 & 카카오로 3초 간편 가입",
    desc: "복잡한 절차 없이 구글, 카카오 계정으로 3초 만에 시작할 수 있습니다. 설치 필요 없는 웹 서비스로 언제 어디서나 접속하세요.",
    img: "/2.png"
  },
  {
    title: "복잡한 직원 정보, 한 페이지에서 끝",
    desc: "이름, 연락처, 시급, 입사일 등 흩어져 있는 직원 정보를 한눈에 관리하세요. 근로계약서 필수 정보들을 체계적으로 보관합니다.",
    img: "/3.png"
  },
  {
    title: "근무 패턴 생성으로 스케줄 자동화",
    desc: "오픈조, 미들조 등 고정된 근무 패턴을 미리 만들어두세요. 만들어둔 패턴을 직원에 할당하기만 하면 시간표가 완성됩니다.",
    img: "/4.png"
  },
  {
    title: "클릭 한 번으로 월별 스케줄 완성",
    desc: "설정해둔 패턴과 직원 데이터를 바탕으로 스케줄을 자동 생성합니다. 대타나 변경 사항도 드래그 앤 드롭으로 쉽게 수정하세요.",
    img: "/5.png"
  },
  {
    title: "급여 명세서 자동 생성 및 발송",
    desc: "주휴수당, 야간수당, 연장수당 등 복잡한 가산 수당이 법 기준에 맞춰 1초 만에 자동 계산되며, 명세서까지 생성됩니다.",
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
      <style jsx global>{`
        @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css");
        body {
          font-family: "Pretendard Variable", Pretendard, sans-serif;
          margin: 0; padding: 0; background-color: #f5f6f8; color: #333;
        }
      `}</style>

      <style jsx>{`
        .page-container {
          min-height: 100vh; display: flex; flexDirection: column; alignItems: center;
          padding: 40px 20px; box-sizing: border-box;
        }
        .card {
          background-color: #fff; max-width: 480px; width: 100%; padding: 32px 24px;
          border-radius: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); margin-bottom: 60px;
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

        /* 🔥 기능 소개 섹션 스타일 */
        .features-container {
          max-width: 800px; width: 100%; margin-top: 20px;
        }
        .section-title {
          font-size: 24px; fontWeight: 800; text-align: center; margin-bottom: 40px; color: #191f28;
        }
        .feature-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px;
        }
        .feature-card {
          background: #fff; border-radius: 20px; overflow: hidden;
          box-shadow: 0 2px 12px rgba(0,0,0,0.04); transition: transform 0.2s;
        }
        .feature-card:hover { transform: translateY(-4px); }
        .feature-img-wrapper {
          width: 100%; height: 200px; background: #f0f2f5; display: flex; align-items: center; justify-content: center; overflow: hidden;
        }
        .feature-img { width: 100%; height: 100%; object-fit: cover; }
        .feature-content { padding: 24px; }
        .feature-title { font-size: 17px; fontWeight: 700; margin-bottom: 10px; color: #333; line-height: 1.4; }
        .feature-desc { font-size: 14px; color: #6b7684; line-height: 1.6; word-break: keep-all; }

        /* 하단 고정 버튼 */
        .bottom-cta {
          position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
          width: 90%; max-width: 400px; z-index: 100;
        }
        .start-btn {
          display: block; width: 100%; padding: 18px; background-color: #27ae60; color: #fff;
          border-radius: 50px; text-decoration: none; font-weight: 800; font-size: 17px; text-align: center;
          box-shadow: 0 8px 20px rgba(39, 174, 96, 0.4);
        }
      `}</style>

      {/* 1. 계산기 영역 */}
      <div className="card">
        <h1 style={{ fontSize: '24px', fontWeight: '800', textAlign: 'center', marginBottom: '8px' }}>💰 주휴수당 계산기</h1>
        <p style={{ textAlign: 'center', color: '#8b95a1', marginBottom: '32px', fontSize: '15px' }}>이번 주 내 알바비, 주휴수당은 얼마?</p>

        <div className="input-group">
          <label className="input-label">시급 (원)</label>
          <input type="text" value={hourlyWage} onChange={(e) => handleNumberInput(e, setHourlyWage)} className="calc-input" placeholder="예: 10,030" inputMode="numeric" />
        </div>

        <div className="input-group">
          <label className="input-label">일주일 총 근무 시간</label>
          <input type="text" value={hoursPerWeek} onChange={(e) => handleNumberInput(e, setHoursPerWeek)} className="calc-input" placeholder="예: 20" inputMode="numeric" />
          <p style={{ fontSize: '13px', color: '#8b95a1', marginTop: '6px', textAlign: 'right' }}>* 휴게시간 제외</p>
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

      {/* 2. 기능 소개 (FEATURES) 섹션 */}
      <div className="features-container">
        <h2 className="section-title">왜 '이지알바'를 써야 할까요?</h2>
        <div className="feature-grid">
          {FEATURES.map((item, idx) => (
            <div key={idx} className="feature-card">
              <div className="feature-img-wrapper">
                {/* public 폴더 내 이미지 사용 */}
                <img src={item.img} alt={item.title} className="feature-img" />
              </div>
              <div className="feature-content">
                <h3 className="feature-title">{item.title}</h3>
                <p className="feature-desc">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 고정 CTA 버튼 */}
      <div className="bottom-cta">
        <Link href="/dashboard" className="start-btn">🚀 이지알바 무료로 시작하기</Link>
      </div>

      <div style={{ height: '80px' }}></div> {/* 버튼 가림 방지 여백 */}
    </div>
  );
}