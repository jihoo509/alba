'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// ✅ 기능 소개 데이터
const FEATURES = [
  {
    title: "직원 & 알바 관리, 평생 무료로 시작하세요",
    desc: "복잡한 직원 관리, 아직도 엑셀로 하시나요? 이지알바는 직원 등록부터 급여 명세서 생성까지 모든 기능을 무료로 제공합니다.",
    img: "/1.png"
  },
  {
    title: "이메일 & 카카오로 3초 간편 가입",
    desc: "복잡한 절차 없이 구글, 카카오 계정으로 3초 만에 시작할 수 있습니다. 별도의 설치가 필요 없는 웹 기반 서비스입니다.",
    img: "/2.png"
  },
  {
    title: "복잡한 직원 정보, 한 페이지에서 끝",
    desc: "이름, 연락처, 시급, 입사일 등 흩어져 있는 직원 정보를 한눈에 관리하세요. 근로계약서 필수 정보들을 체계적으로 보관합니다.",
    img: "/3.png"
  },
  {
    title: "근무 패턴 생성으로 스케줄 자동화",
    desc: "오픈조, 미들조 등 매장의 고정된 근무 패턴을 미리 만들어두고 직원에 할당하기만 하면 시간표가 완성됩니다.",
    img: "/4.png"
  },
  {
    title: "클릭 한 번으로 월별 스케줄 완성",
    desc: "근무 패턴과 직원 데이터를 바탕으로 스케줄을 자동 생성하며, 드래그 앤 드롭으로 손쉽게 수정할 수 있습니다.",
    img: "/5.png"
  },
  {
    title: "급여 명세서 자동 생성 및 발송",
    desc: "주휴수당, 야간수당 등 복잡한 수당이 법 기준에 맞춰 자동 계산되며, 급여 명세서까지 원클릭으로 생성됩니다.",
    img: "/6.png"
  }
];

type WeekItem = { id: number; hours: string; minutes: string; };

// 세금 상세 내역 타입
type TaxDetail = { label: string; amount: number };

export default function SalaryCalculator() {
  const [hourlyWage, setHourlyWage] = useState('10,030'); 
  const [totalHours, setTotalHours] = useState('160');
  const [totalMinutes, setTotalMinutes] = useState('0');
  const [weeks, setWeeks] = useState<WeekItem[]>([]); 
  const [showNight, setShowNight] = useState(false);
  const [nightHours, setNightHours] = useState('');
  const [nightMinutes, setNightMinutes] = useState('');
  const [showOvertime, setShowOvertime] = useState(false);
  const [overtimeHours, setOvertimeHours] = useState('');
  const [overtimeMinutes, setOvertimeMinutes] = useState('');
  const [showHoliday, setShowHoliday] = useState(false);
  const [holidayHours, setHolidayHours] = useState('');
  const [holidayMinutes, setHolidayMinutes] = useState('');
  const [taxType, setTaxType] = useState<'none' | '3.3' | '4'>('4');

  // 결과값 state (상세 세금 내역 포함)
  const [result, setResult] = useState({
    basePay: 0,
    weeklyPay: 0,
    allowancePay: 0,
    totalGross: 0,
    deduction: 0,
    finalPay: 0,
    taxDetails: [] as TaxDetail[] // 상세 내역 배열
  });

  const handleNumberInput = (val: string, setter: (v: string) => void) => {
    const num = val.replace(/[^0-9]/g, '');
    setter(num ? Number(num).toLocaleString() : '');
  };

  const addWeek = () => { setWeeks([...weeks, { id: Date.now(), hours: '', minutes: '' }]); };
  const removeWeek = (id: number) => { setWeeks(weeks.filter(w => w.id !== id)); };
  const updateWeekHours = (id: number, val: string) => { setWeeks(weeks.map(w => w.id === id ? { ...w, hours: val } : w)); };
  const updateWeekMinutes = (id: number, val: string) => { setWeeks(weeks.map(w => w.id === id ? { ...w, minutes: val } : w)); };

  // 실시간 계산
  useEffect(() => {
    const wage = Number(hourlyWage.replace(/,/g, ''));
    if (!wage) return;

    const tH = Number(totalHours.replace(/,/g, '')) || 0;
    const tM = Number(totalMinutes.replace(/,/g, '')) || 0;
    const totalTime = tH + (tM / 60);
    const basePay = Math.floor(totalTime * wage);

    let weeklyPayTotal = 0;
    weeks.forEach(w => {
      const h = Number(w.hours.replace(/,/g, '')) || 0;
      const m = Number(w.minutes.replace(/,/g, '')) || 0;
      const time = h + (m / 60);
      if (time >= 15) {
        const calcTime = time > 40 ? 40 : time;
        weeklyPayTotal += (calcTime / 40) * 8 * wage;
      }
    });
    weeklyPayTotal = Math.floor(weeklyPayTotal);

    const nH = Number(nightHours.replace(/,/g, '')) || 0;
    const nM = Number(nightMinutes.replace(/,/g, '')) || 0;
    const nTime = nH + (nM / 60);
    const oH = Number(overtimeHours.replace(/,/g, '')) || 0;
    const oM = Number(overtimeMinutes.replace(/,/g, '')) || 0;
    const oTime = oH + (oM / 60);
    const hH = Number(holidayHours.replace(/,/g, '')) || 0;
    const hM = Number(holidayMinutes.replace(/,/g, '')) || 0;
    const hTime = hH + (hM / 60);
    const allowancePay = Math.floor((nTime + oTime + hTime) * wage * 0.5);

    const totalGross = basePay + weeklyPayTotal + allowancePay;
    
    // ✅ 세금 상세 계산 로직
    let deduction = 0;
    let details: TaxDetail[] = [];

    if (taxType === '3.3') {
      const tax = Math.floor(totalGross * 0.03); // 사업소득세 3%
      const localTax = Math.floor(totalGross * 0.003); // 지방소득세 0.3%
      deduction = tax + localTax;
      details = [
        { label: '사업소득세(3%)', amount: tax },
        { label: '지방소득세(0.3%)', amount: localTax }
      ];
    } else if (taxType === '4') {
      // 2025년 기준 요율 적용 (대략적)
      const pension = Math.floor(totalGross * 0.045); // 국민연금 4.5%
      const health = Math.floor(totalGross * 0.03545); // 건강보험 3.545%
      const care = Math.floor(health * 0.1295); // 장기요양 (건강보험의 12.95%)
      const employ = Math.floor(totalGross * 0.009); // 고용보험 0.9%
      
      deduction = pension + health + care + employ;
      details = [
        { label: '국민연금(4.5%)', amount: pension },
        { label: '건강보험(3.545%)', amount: health },
        { label: '장기요양(12.95%)', amount: care },
        { label: '고용보험(0.9%)', amount: employ }
      ];
    }
    
    // 원단위 절사 (전체 합계에서)
    deduction = Math.floor(deduction / 10) * 10;

    setResult({ basePay, weeklyPay: weeklyPayTotal, allowancePay, totalGross, deduction, finalPay: totalGross - deduction, taxDetails: details });

  }, [hourlyWage, totalHours, totalMinutes, weeks, nightHours, nightMinutes, overtimeHours, overtimeMinutes, holidayHours, holidayMinutes, taxType]);

  return (
    <div className="page-container">
      <style jsx global>{`
        @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css");
        body { font-family: "Pretendard Variable", Pretendard, sans-serif; margin: 0; padding: 0; background-color: #f5f6f8; color: #333; overflow-x: hidden; }
        * { box-sizing: border-box; }
        footer { padding-bottom: 100px !important; }
      `}</style>
      <style jsx>{`
        /* ✅ [수정] 상단 여백 및 전체적인 간격 축소 */
        .page-container { min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding-top: 30px; overflow-x: hidden; width: 100%; padding-bottom: 80px; }
        .calculator-section { width: 100%; display: flex; justify-content: center; padding: 0 16px; margin-bottom: 60px; }
        .card { background-color: #fff; max-width: 480px; width: 100%; padding: 24px 20px; border-radius: 20px; box-shadow: 0 8px 20px rgba(0,0,0,0.06); }
        
        .input-group { margin-bottom: 16px; }
        .input-label { display: block; font-size: 14px; font-weight: 700; color: #4e5968; margin-bottom: 8px; }
        
        /* ✅ [수정] 입력창 높이 축소 (12px padding) */
        .calc-input { width: 100%; padding: 12px; border: 1px solid #d1d6db; border-radius: 10px; font-size: 16px; font-weight: 600; outline: none; transition: all 0.2s; text-align: right; font-family: inherit; }
        .calc-input:focus { border-color: #3182f6; box-shadow: 0 0 0 2px rgba(49, 130, 246, 0.1); }
        .hint { font-size: 12px; color: #8b95a1; margin-top: 6px; text-align: right; }
        
        .time-input-row { display: flex; gap: 8px; align-items: center; width: 100%; }
        .time-input-wrap { flex: 1; position: relative; }
        .unit-text { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); font-size: 13px; color: #8b95a1; font-weight: 500; }
        .calc-input-time { padding-right: 40px; width: 100%; padding: 12px; border: 1px solid #d1d6db; border-radius: 10px; font-size: 16px; text-align: right; font-weight: 600; outline: none; }
        .calc-input-time:focus { border-color: #3182f6; }

        .section-box { background: #f9faff; padding: 16px; border-radius: 14px; margin-bottom: 16px; border: 1px solid #e5e8eb; }
        .toggle-group { display: flex; gap: 6px; margin-bottom: 10px; }
        .toggle-btn { flex: 1; padding: 10px; border-radius: 10px; border: 1px solid #d1d6db; background: #fff; color: #6b7684; font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.2s; }
        .toggle-btn.active { border-color: #3182f6; background-color: #e8f3ff; color: #3182f6; }
        
        .allowance-block { margin-top: 12px; padding-top: 12px; border-top: 1px dashed #e5e8eb; }
        .allowance-label { font-size: 13px; font-weight: 600; color: #555; margin-bottom: 6px; display: block; }

        .result-box { margin-top: 20px; padding: 20px; background-color: #f2f4f6; border-radius: 14px; }
        .result-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #4e5968; font-weight: 500; }
        .result-row.highlight { color: #333; font-weight: 700; }
        
        /* ✅ 세금 상세 내역 스타일 */
        .tax-detail-list { margin: 8px 0 16px 0; padding: 10px; background-color: #e5e8eb; border-radius: 8px; font-size: 13px; }
        .tax-detail-item { display: flex; justify-content: space-between; margin-bottom: 4px; color: #666; }
        .tax-detail-item:last-child { margin-bottom: 0; }
        
        .final-row { margin-top: 16px; padding-top: 16px; border-top: 1px dashed #d1d6db; display: flex; justify-content: space-between; align-items: center; }
        .final-label { font-size: 16px; font-weight: 700; color: #333; }
        .final-value { font-size: 26px; font-weight: 800; color: #3182f6; }
        
        .features-wrapper { width: 100%; background-color: #fff; padding: 60px 0; display: flex; justify-content: center; }
        .features-container { max-width: 1000px; width: 100%; padding: 0 20px; display: flex; flex-direction: column; align-items: center; gap: 60px; }
        .section-title { font-size: 28px; font-weight: 900; color: #333; text-align: center; margin-bottom: 10px; line-height: 1.3; letter-spacing: -1px; word-break: keep-all; }
        .feature-card { display: flex; flex-wrap: wrap; alignItems: center; justify-content: center; gap: 30px; width: 100%; }
        .feature-text { flex: 1 1 300px; max-width: 100%; padding: 10px; }
        .feature-img-box { flex: 1 1 300px; display: flex; justify-content: center; max-width: 100%; }
        .feature-img { width: 100%; max-width: 400px; height: auto; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .bottom-cta { position: fixed; bottom: 0; left: 0; width: 100%; background-color: #fff; padding: 12px 20px; box-shadow: 0 -4px 16px rgba(0,0,0,0.08); z-index: 100; display: flex; justify-content: center; }
        .start-btn { display: block; width: 100%; max-width: 400px; padding: 16px; background-color: #27ae60; color: #fff; border-radius: 40px; text-decoration: none; font-weight: 800; font-size: 18px; text-align: center; box-shadow: 0 6px 15px rgba(39, 174, 96, 0.3); transition: transform 0.1s; }
        .start-btn:active { transform: scale(0.98); }
        @media (max-width: 768px) { .page-container { padding-top: 20px; } .card { padding: 20px 16px; } .section-title { font-size: 24px; } .feature-card { flexDirection: column-reverse !important; gap: 20px; } }
      `}</style>

      <div className="calculator-section">
        <div className="card">
          <h1 style={{ fontSize: '24px', fontWeight: '800', textAlign: 'center', marginBottom: '6px', color: '#191f28' }}>💰 2026 알바비·급여 계산기</h1>
          <p style={{ textAlign: 'center', color: '#8b95a1', marginBottom: '30px', fontSize: '15px' }}>시급과 시간만 입력하면 월급이 짠!</p>

          <div className="input-group">
            <label className="input-label">시급 (원)</label>
            <input 
                type="text" 
                value={hourlyWage} 
                onChange={(e) => handleNumberInput(e.target.value, setHourlyWage)}
                onFocus={() => { if(hourlyWage === '10,030') setHourlyWage(''); }}
                onBlur={() => { if(hourlyWage === '') setHourlyWage('10,030'); }}
                className="calc-input" 
                inputMode="numeric"
            />
          </div>

          <div className="input-group">
            <label className="input-label">이번 달 총 근무 시간</label>
            <div className="time-input-row">
                <div className="time-input-wrap">
                    <input type="text" value={totalHours} onChange={(e) => handleNumberInput(e.target.value, setTotalHours)} onFocus={() => { if(totalHours === '160') setTotalHours(''); }} onBlur={() => { if(totalHours === '') setTotalHours('160'); }} className="calc-input-time" placeholder="0" inputMode="numeric" />
                    <span className="unit-text">시간</span>
                </div>
                <div className="time-input-wrap">
                    <input type="text" value={totalMinutes} onChange={(e) => handleNumberInput(e.target.value, setTotalMinutes)} onFocus={() => { if(totalMinutes === '0') setTotalMinutes(''); }} onBlur={() => { if(totalMinutes === '') setTotalMinutes('0'); }} className="calc-input-time" placeholder="0" inputMode="numeric" />
                    <span className="unit-text">분</span>
                </div>
            </div>
            <p className="hint">* 기본급 계산용 (야간/휴일 시간도 포함)</p>
          </div>

          {/* 주휴수당 */}
          <div className="section-box">
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontWeight: '700', fontSize: '14px', color:'#333' }}>주휴수당 계산 (주별 입력)</span>
                <button onClick={addWeek} style={{ fontSize: '12px', padding: '6px 10px', borderRadius: '6px', backgroundColor: '#3182f6', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>+ 1주 추가</button>
             </div>
             
             {weeks.length === 0 && <p style={{ fontSize: '13px', color: '#888', textAlign: 'center', padding: '8px 0' }}>'+ 1주 추가' 버튼을 눌러 입력해주세요.</p>}
             
             <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {weeks.map((week, idx) => (
                <div key={week.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#555', width: '30px', flexShrink: 0 }}>{idx + 1}주</span>
                    <div className="time-input-row" style={{ flex: 1 }}>
                        <div className="time-input-wrap">
                            <input type="text" value={week.hours} onChange={(e) => handleNumberInput(e.target.value, (v) => updateWeekHours(week.id, v))} className="calc-input-time" placeholder="0" inputMode="numeric" />
                            <span className="unit-text">시간</span>
                        </div>
                        <div className="time-input-wrap">
                            <input type="text" value={week.minutes} onChange={(e) => handleNumberInput(e.target.value, (v) => updateWeekMinutes(week.id, v))} className="calc-input-time" placeholder="0" inputMode="numeric" />
                            <span className="unit-text">분</span>
                        </div>
                    </div>
                    <button onClick={() => removeWeek(week.id)} style={{ color: '#e74c3c', background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}>✕</button>
                </div>
                ))}
             </div>
          </div>

          {/* 추가 수당 */}
          <div className="section-box">
             <label className="input-label" style={{marginBottom: '10px'}}>추가 수당 (0.5배 가산)</label>
             <div className="toggle-group">
                <button onClick={() => setShowNight(!showNight)} className={`toggle-btn ${showNight ? 'active' : ''}`}>🌙 야간</button>
                <button onClick={() => setShowOvertime(!showOvertime)} className={`toggle-btn ${showOvertime ? 'active' : ''}`}>⏰ 연장</button>
                <button onClick={() => setShowHoliday(!showHoliday)} className={`toggle-btn ${showHoliday ? 'active' : ''}`}>🎉 휴일</button>
             </div>

             {showNight && (
                <div className="allowance-block">
                    <span className="allowance-label">야간 근무 시간</span>
                    <div className="time-input-row">
                        <div className="time-input-wrap"><input type="text" value={nightHours} onChange={(e) => handleNumberInput(e.target.value, setNightHours)} className="calc-input-time" placeholder="0" inputMode="numeric" /><span className="unit-text">시간</span></div>
                        <div className="time-input-wrap"><input type="text" value={nightMinutes} onChange={(e) => handleNumberInput(e.target.value, setNightMinutes)} className="calc-input-time" placeholder="0" inputMode="numeric" /><span className="unit-text">분</span></div>
                    </div>
                </div>
             )}
             {showOvertime && (
                <div className="allowance-block">
                    <span className="allowance-label">연장 근무 시간</span>
                    <div className="time-input-row">
                        <div className="time-input-wrap"><input type="text" value={overtimeHours} onChange={(e) => handleNumberInput(e.target.value, setOvertimeHours)} className="calc-input-time" placeholder="0" inputMode="numeric" /><span className="unit-text">시간</span></div>
                        <div className="time-input-wrap"><input type="text" value={overtimeMinutes} onChange={(e) => handleNumberInput(e.target.value, setOvertimeMinutes)} className="calc-input-time" placeholder="0" inputMode="numeric" /><span className="unit-text">분</span></div>
                    </div>
                </div>
             )}
             {showHoliday && (
                <div className="allowance-block">
                    <span className="allowance-label">휴일 근무 시간</span>
                    <div className="time-input-row">
                        <div className="time-input-wrap"><input type="text" value={holidayHours} onChange={(e) => handleNumberInput(e.target.value, setHolidayHours)} className="calc-input-time" placeholder="0" inputMode="numeric" /><span className="unit-text">시간</span></div>
                        <div className="time-input-wrap"><input type="text" value={holidayMinutes} onChange={(e) => handleNumberInput(e.target.value, setHolidayMinutes)} className="calc-input-time" placeholder="0" inputMode="numeric" /><span className="unit-text">분</span></div>
                    </div>
                </div>
             )}
          </div>

          {/* 세금 공제 */}
          <div className="input-group">
            <label className="input-label">세금 공제</label>
            <div className="toggle-group">
                <button onClick={() => setTaxType('4')} className={`toggle-btn ${taxType === '4' ? 'active' : ''}`}>4대보험</button>
                <button onClick={() => setTaxType('3.3')} className={`toggle-btn ${taxType === '3.3' ? 'active' : ''}`}>3.3%</button>
                <button onClick={() => setTaxType('none')} className={`toggle-btn ${taxType === 'none' ? 'active' : ''}`}>미적용</button>
            </div>
          </div>

          <div className="result-box">
            <div className="result-row highlight"><span>기본급</span> <span>{result.basePay.toLocaleString()}원</span></div>
            {result.weeklyPay > 0 && (<div className="result-row" style={{ color: '#3182f6' }}><span>+ 주휴수당</span> <span>{result.weeklyPay.toLocaleString()}원</span></div>)}
            {result.allowancePay > 0 && (<div className="result-row" style={{ color: '#ff9f0a' }}><span>+ 추가수당</span> <span>{result.allowancePay.toLocaleString()}원</span></div>)}
            
            {/* 세금 공제 합계 */}
            {result.deduction > 0 && (
                <div className="result-row" style={{ color: '#e74c3c' }}>
                    <span>- 세금공제</span> <span>{result.deduction.toLocaleString()}원</span>
                </div>
            )}

            {/* ✅ 세금 상세 내역 (자동으로 펼쳐짐) */}
            {result.taxDetails.length > 0 && (
                <div className="tax-detail-list">
                    {result.taxDetails.map((tax, idx) => (
                        <div key={idx} className="tax-detail-item">
                            <span>• {tax.label}</span>
                            <span>{tax.amount.toLocaleString()}원</span>
                        </div>
                    ))}
                </div>
            )}

            <div className="final-row">
                <span className="final-label">예상 실수령액</span>
                <span className="final-value">{result.finalPay.toLocaleString()}<span style={{fontSize:'20px', fontWeight:600, color:'#333', marginLeft:'4px'}}>원</span></span>
            </div>
          </div>
        </div>
      </div>

      <div className="features-wrapper">
        <div className="features-container">
          <h2 className="section-title">이지알바,<br className="mobile-only"/> 왜 써야 할까요?</h2>
          {FEATURES.map((feature, index) => (
            <div key={index} className="feature-card" style={{ flexDirection: index % 2 === 0 ? 'row' : 'row-reverse' }}>
              <div className="feature-text">
                <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0052cc', marginBottom: '12px', wordBreak: 'keep-all', lineHeight: '1.4' }}>{feature.title}</h3>
                <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#555', margin: 0, wordBreak: 'keep-all' }}>{feature.desc}</p>
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