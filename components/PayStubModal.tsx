'use client';

import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';

type Props = {
  data: any;
  isOpen: boolean;
  onClose: () => void;
  year: number;
  month: number;
};

export default function PayStubModal({ data, isOpen, onClose, year, month }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  // 옵션 상태
  const [useWeekly, setUseWeekly] = useState(true);
  const [useNight, setUseNight] = useState(true);
  const [useOvertime, setUseOvertime] = useState(true); // ✅ 연장수당 토글
  const [useBreakDeduct, setUseBreakDeduct] = useState(true); // ✅ 휴게시간 차감 여부

  useEffect(() => {
    if (isOpen) {
      setUseWeekly(true);
      setUseNight(true);
      setUseOvertime(true);
      setUseBreakDeduct(true);
    }
  }, [isOpen, data]);

  if (!isOpen || !data) return null;

  // 🔄 실시간 재계산 로직
  let newBasePay = 0;
  let newNightPay = 0;
  let newOvertimePay = 0;
  let newWeeklyPay = 0;

  // 장부(Ledger) 다시 훑으면서 옵션 적용
  const filteredLedger = data.ledger.map((row: any) => {
    if (row.type === 'WORK') {
      let rowBase = row.basePay;
      
      // 휴게시간 차감 해제 시 (즉, 휴게시간도 돈으로 줄 때)
      if (!useBreakDeduct && row.breakMins > 0) {
        // 차감했던 분(min) 만큼 급여 추가
        const addedPay = Math.floor((row.breakMins / 60) * data.wage);
        rowBase += addedPay;
      }

      newBasePay += rowBase;
      if (useNight) newNightPay += row.nightPay;
      if (useOvertime) newOvertimePay += row.overtimePay;

      return { 
        ...row, 
        displayBase: rowBase, // 화면 표시용
        displayHours: row.hours + (useBreakDeduct && row.breakMins > 0 ? ` (휴게-${row.breakMins}분)` : '')
      };
    } 
    if (row.type === 'WEEKLY') {
      if (useWeekly) newWeeklyPay += row.weeklyPay;
      return row;
    }
    return row;
  });

  const currentTotal = newBasePay + newWeeklyPay + newNightPay + newOvertimePay;
  
  // 세금 재계산
  let currentTax = 0;
  if (data.type.includes('four')) {
     const originalRate = data.taxDetails.total / data.totalPay; 
     if (data.totalPay > 0) currentTax = Math.floor(currentTotal * originalRate / 10) * 10;
  } else {
     currentTax = Math.floor(currentTotal * 0.033 / 10) * 10;
  }
  const currentFinalPay = currentTotal - currentTax;

  const handleSaveImage = async () => {
    if (printRef.current) {
      const canvas = await html2canvas(printRef.current);
      const link = document.createElement('a');
      link.download = `${data.name}_${month}월_급여명세서.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
    }}>
      <div style={{ backgroundColor: '#222', color: '#fff', borderRadius: 8, maxWidth: 700, width: '95%', maxHeight: '95vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* 옵션 조절 패널 */}
        <div style={{ padding: 16, borderBottom: '1px solid #444', backgroundColor: '#333' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: 16 }}>⚙️ 지급 옵션 (체크 해제 시 제외)</h3>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={useWeekly} onChange={e => setUseWeekly(e.target.checked)} /> 주휴수당
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={useNight} onChange={e => setUseNight(e.target.checked)} /> 야간수당
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={useOvertime} onChange={e => setUseOvertime(e.target.checked)} /> 연장수당
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: 'orange' }}>
              <input type="checkbox" checked={useBreakDeduct} onChange={e => setUseBreakDeduct(e.target.checked)} /> 휴게시간 차감 적용
            </label>
          </div>
        </div>

        {/* 🟢 명세서 영역 */}
        <div style={{ overflowY: 'auto', flex: 1, backgroundColor: '#fff' }}>
          <div ref={printRef} style={{ padding: 30, backgroundColor: '#fff', color: '#000', minHeight: 400 }}>
            <h2 style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 15, marginBottom: 25, fontSize: 24 }}>
              {year}년 {month}월 급여 명세서
            </h2>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, fontSize: 16 }}>
              <span>성명: <strong>{data.name}</strong></span>
              <span>지급일: {year}.{month}.{new Date().getDate()}</span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 25 }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0', borderTop: '2px solid #000', borderBottom: '1px solid #000' }}>
                  <th style={thStyle}>날짜</th>
                  <th style={thStyle}>시간</th>
                  <th style={thStyle}>근무</th>
                  <th style={thStyle}>기본급</th>
                  <th style={thStyle}>야간</th>
                  <th style={thStyle}>연장</th>
                </tr>
              </thead>
              <tbody>
                {filteredLedger.map((row: any, idx: number) => {
                  if (row.type === 'WEEKLY') {
                    if (!useWeekly) return null;
                    return (
                      <tr key={idx} style={{ backgroundColor: '#fff8c4', borderBottom: '1px solid #ddd' }}>
                        <td colSpan={3} style={{ ...tdStyle, textAlign: 'center', fontWeight: 'bold', color: '#d68910' }}>
                          ⭐ {row.dayLabel} ({row.note})
                        </td>
                        <td style={tdStyle}>-</td>
                        <td colSpan={2} style={{ ...tdStyle, textAlign: 'right', fontWeight: 'bold', color: '#d68910' }}>
                          {row.weeklyPay.toLocaleString()}
                        </td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                      <td style={tdStyle}>{row.date.slice(5)} ({row.dayLabel})</td>
                      <td style={tdStyle}>{row.timeRange}</td>
                      <td style={tdStyle}>{row.displayHours}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{row.displayBase.toLocaleString()}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: useNight && row.nightPay > 0 ? 'red' : '#ccc' }}>
                          {useNight ? row.nightPay.toLocaleString() : 0}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: useOvertime && row.overtimePay > 0 ? 'blue' : '#ccc' }}>
                          {useOvertime ? row.overtimePay.toLocaleString() : 0}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div style={{ border: '2px solid #000', padding: 20, borderRadius: 4 }}>
              <div style={rowStyle}><span>기본급 (시급 {data.wage.toLocaleString()}원)</span> <span>{newBasePay.toLocaleString()}원</span></div>
              <div style={rowStyle}><span style={{color: useWeekly?'#000':'#ccc'}}>+ 주휴수당</span> <span style={{color: useWeekly?'#000':'#ccc'}}>{newWeeklyPay.toLocaleString()}원</span></div>
              <div style={rowStyle}><span style={{color: useNight?'#000':'#ccc'}}>+ 야간수당</span> <span style={{color: useNight?'#000':'#ccc'}}>{newNightPay.toLocaleString()}원</span></div>
              <div style={rowStyle}><span style={{color: useOvertime?'#000':'#ccc'}}>+ 연장수당</span> <span style={{color: useOvertime?'#000':'#ccc'}}>{newOvertimePay.toLocaleString()}원</span></div>
              
              <hr style={{ margin: '12px 0', borderTop: '1px dashed #aaa' }} />
              <div style={rowStyle}><span style={{fontWeight: 'bold'}}>세전 총액</span> <span style={{fontWeight: 'bold'}}>{currentTotal.toLocaleString()}원</span></div>
              <div style={{ ...rowStyle, color: 'red' }}><span>- 공제 (세금 등)</span> <span>{currentTax.toLocaleString()}원</span></div>
              <hr style={{ margin: '12px 0', borderTop: '2px solid #000' }} />
              <div style={{ ...rowStyle, fontSize: 20, fontWeight: 'bold', color: 'blue', marginTop: 10 }}>
                <span>실수령액</span> <span>{currentFinalPay.toLocaleString()}원</span>
              </div>
            </div>
            
            {/* 공제 상세 (생략 없이) */}
            <div style={{ marginTop: 25, borderTop: '1px solid #eee', paddingTop: 15 }}>
               <p style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 8, color: '#333' }}>[참고] 공제 내역 상세 (원단위 절사)</p>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 20px', fontSize: 11, color: '#666' }}>
                  {data.type.includes('four') ? (
                    <>
                      <div style={{display:'flex', justifyContent:'space-between'}}><span>국민연금</span> <span>{(Math.floor(currentTotal * 0.045 / 10) * 10).toLocaleString()}원</span></div>
                      <div style={{display:'flex', justifyContent:'space-between'}}><span>건강보험</span> <span>{(Math.floor(currentTotal * 0.03545 / 10) * 10).toLocaleString()}원</span></div>
                      <div style={{display:'flex', justifyContent:'space-between'}}><span>장기요양</span> <span>{(Math.floor((currentTotal * 0.03545) * 0.1295 / 10) * 10).toLocaleString()}원</span></div>
                      <div style={{display:'flex', justifyContent:'space-between'}}><span>고용보험</span> <span>{(Math.floor(currentTotal * 0.009 / 10) * 10).toLocaleString()}원</span></div>
                    </>
                  ) : (
                    <>
                      <div style={{display:'flex', justifyContent:'space-between'}}><span>소득세(3%)</span> <span>{(Math.floor(currentTotal * 0.03 / 10) * 10).toLocaleString()}원</span></div>
                      <div style={{display:'flex', justifyContent:'space-between'}}><span>지방세(0.3%)</span> <span>{(Math.floor(currentTotal * 0.003 / 10) * 10).toLocaleString()}원</span></div>
                    </>
                  )}
               </div>
            </div>
          </div>
        </div>

        <div style={{ padding: 16, backgroundColor: '#333', borderTop: '1px solid #444', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '10px 20px', background: '#555', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>닫기</button>
          <button onClick={handleSaveImage} style={{ padding: '10px 20px', background: 'seagreen', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>이미지 저장</button>
        </div>
      </div>
    </div>
  );
}

const thStyle = { padding: '8px', textAlign: 'center' as const, fontWeight: 'bold', borderRight: '1px solid #ddd' };
const tdStyle = { padding: '8px', textAlign: 'center' as const, borderRight: '1px solid #ddd' };
const rowStyle = { display: 'flex', justifyContent: 'space-between', marginBottom: 6 };