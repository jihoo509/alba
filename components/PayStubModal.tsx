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

  const [useWeekly, setUseWeekly] = useState(true);
  const [useNight, setUseNight] = useState(true);
  const [useOvertime, setUseOvertime] = useState(true);
  const [useHolidayWork, setUseHolidayWork] = useState(true);
  const [useBreakDeduct, setUseBreakDeduct] = useState(true);

  useEffect(() => {
    // data.storeSettingsSnapshot이 없을 수도 있으므로 체크 강화
    if (isOpen && data && data.storeSettingsSnapshot) {
      const s = data.storeSettingsSnapshot;
      setUseWeekly(s.pay_weekly ?? true); // 값이 없으면 true 기본값
      setUseNight(s.is_five_plus && s.pay_night);
      setUseOvertime(s.is_five_plus && s.pay_overtime);
      setUseHolidayWork(s.is_five_plus && s.pay_holiday);
      setUseBreakDeduct(s.auto_deduct_break !== false);
    }
  }, [isOpen, data]);

  if (!isOpen || !data) return null;

  let newBasePay = 0;
  let newNightPay = 0;
  let newOvertimePay = 0;
  let newHolidayWorkPay = 0;
  let newWeeklyPay = 0;

  const filteredLedger = (data.ledger || []).map((row: any) => { // data.ledger가 없을 경우 대비
    if (row.type === 'WORK') {
      // 🔴 [수정 포인트] 값이 undefined일 경우 0 또는 기존 basePay로 대체하여 충돌 방지
      // 데이터가 아직 업데이트 안 됐다면 row.basePay를 쓰도록 fallback 처리 (|| row.basePay)
      const valDeducted = row.basePayDeducted !== undefined ? row.basePayDeducted : row.basePay;
      
      // 만약 basePayNoDeduct가 없으면, 직접 계산하거나(수정 전 로직) 일단 0으로 둠
      // 여기서는 안전하게 계산 로직을 복구하거나 0 처리를 합니다.
      const valNoDeduct = row.basePayNoDeduct !== undefined ? row.basePayNoDeduct : (row.basePay + (row.breakMins ? Math.floor((row.breakMins / 60) * data.wage) : 0));

      let rowBase = useBreakDeduct ? valDeducted : valNoDeduct;
      
      // 혹시라도 rowBase가 여전히 undefined나 NaN이면 0으로 만듦
      if (!rowBase) rowBase = 0;

      let displayHours = row.hours;
      if (!useBreakDeduct && row.breakMins > 0) {
         const originalHours = (Number(row.hours) + (row.breakMins / 60)).toFixed(1);
         displayHours = `${originalHours}h`;
      } else if (useBreakDeduct && row.breakMins > 0) {
         displayHours = `${row.hours}h (휴게-${row.breakMins}분)`;
      }

      newBasePay += rowBase;
      if (useNight) newNightPay += (row.nightPay || 0);
      if (useOvertime) newOvertimePay += (row.overtimePay || 0);
      if (useHolidayWork) newHolidayWorkPay += (row.holidayWorkPay || 0);

      return { 
        ...row, 
        displayBase: rowBase, 
        displayHours: displayHours
      };
    } 
    if (row.type === 'WEEKLY') {
      if (useWeekly) newWeeklyPay += (row.weeklyPay || 0);
      return row;
    }
    return row;
  });

  const currentTotal = newBasePay + newWeeklyPay + newNightPay + newOvertimePay + newHolidayWorkPay;
  
  let currentTax = 0;
  // 세금 계산 시 NaN 방지
  const safeTotal = currentTotal || 0;

  if (data.type && data.type.includes('four')) {
      const p = Math.floor(safeTotal * 0.045 / 10) * 10;
      const h = Math.floor(safeTotal * 0.03545 / 10) * 10;
      const c = Math.floor(h * 0.1295 / 10) * 10;
      const e = Math.floor(safeTotal * 0.009 / 10) * 10;
      currentTax = p + h + c + e;
  } else {
      const i = Math.floor(safeTotal * 0.03 / 10) * 10;
      const l = Math.floor(i * 0.1 / 10) * 10;
      currentTax = i + l;
  }
  
  const currentFinalPay = safeTotal - currentTax;

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
      <div style={{ backgroundColor: '#222', color: '#fff', borderRadius: 8, maxWidth: 750, width: '95%', maxHeight: '95vh', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ padding: 16, borderBottom: '1px solid #444', backgroundColor: '#333' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: 16 }}>⚙️ 지급 옵션 (체크 해제 시 제외)</h3>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}><input type="checkbox" checked={useWeekly} onChange={e => setUseWeekly(e.target.checked)} /> 주휴수당</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}><input type="checkbox" checked={useNight} onChange={e => setUseNight(e.target.checked)} /> 야간수당</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}><input type="checkbox" checked={useOvertime} onChange={e => setUseOvertime(e.target.checked)} /> 연장수당</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#ff6b6b', fontWeight: 'bold' }}><input type="checkbox" checked={useHolidayWork} onChange={e => setUseHolidayWork(e.target.checked)} /> 휴일(특근)수당</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: 'orange' }}><input type="checkbox" checked={useBreakDeduct} onChange={e => setUseBreakDeduct(e.target.checked)} /> 휴게시간 차감</label>
          </div>
        </div>

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
                  <th style={{...thStyle, color: 'red'}}>휴일</th>
                </tr>
              </thead>
              <tbody>
                {filteredLedger.map((row: any, idx: number) => {
                  if (row.type === 'WEEKLY') {
                    if (!useWeekly) return null;
                    return (
                      <tr key={idx} style={{ backgroundColor: '#fff8c4', borderBottom: '1px solid #ddd' }}>
                        <td colSpan={3} style={{ ...tdStyle, textAlign: 'center', fontWeight: 'bold', color: '#d68910' }}>⭐ {row.dayLabel} ({row.note})</td>
                        <td style={tdStyle}>-</td>
                        <td colSpan={3} style={{ ...tdStyle, textAlign: 'right', fontWeight: 'bold', color: '#d68910' }}>{(row.weeklyPay || 0).toLocaleString()}</td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                      <td style={tdStyle}>{row.date.slice(5)} ({row.dayLabel})</td>
                      <td style={tdStyle}>{row.timeRange}</td>
                      <td style={tdStyle}>{row.displayHours}</td>
                      {/* 🔴 [오류 수정] toLocaleString 호출 전 undefined 체크 (|| 0) */}
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{(row.displayBase || 0).toLocaleString()}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: useNight && row.nightPay > 0 ? 'red' : '#ccc' }}>{useNight ? (row.nightPay || 0).toLocaleString() : 0}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: useOvertime && row.overtimePay > 0 ? 'blue' : '#ccc' }}>{useOvertime ? (row.overtimePay || 0).toLocaleString() : 0}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: useHolidayWork && row.holidayWorkPay > 0 ? 'red' : '#ccc', fontWeight: 'bold' }}>{useHolidayWork ? (row.holidayWorkPay || 0).toLocaleString() : 0}</td>
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
              <div style={rowStyle}><span style={{color: useHolidayWork?'red':'#ccc'}}>+ 휴일근로수당</span> <span style={{color: useHolidayWork?'red':'#ccc'}}>{newHolidayWorkPay.toLocaleString()}원</span></div>
              
              <hr style={{ margin: '12px 0', borderTop: '1px dashed #aaa' }} />
              <div style={rowStyle}><span style={{fontWeight: 'bold'}}>세전 총액</span> <span style={{fontWeight: 'bold'}}>{currentTotal.toLocaleString()}원</span></div>
              <div style={{ ...rowStyle, color: 'red' }}><span>- 공제 (세금 등)</span> <span>{currentTax.toLocaleString()}원</span></div>
              <hr style={{ margin: '12px 0', borderTop: '2px solid #000' }} />
              <div style={{ ...rowStyle, fontSize: 20, fontWeight: 'bold', color: 'blue', marginTop: 10 }}>
                <span>실수령액</span> <span>{currentFinalPay.toLocaleString()}원</span>
              </div>
            </div>
            
            <div style={{ marginTop: 25, borderTop: '1px solid #eee', paddingTop: 15 }}>
               <p style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 8, color: '#333' }}>[참고] 공제 내역 상세 (원단위 절사)</p>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 20px', fontSize: 11, color: '#666' }}>
                  {data.type && data.type.includes('four') ? (
                    <>
                      <div style={{display:'flex', justifyContent:'space-between'}}><span>국민연금</span> <span>{(Math.floor(safeTotal * 0.045 / 10) * 10).toLocaleString()}원</span></div>
                      <div style={{display:'flex', justifyContent:'space-between'}}><span>건강보험</span> <span>{(Math.floor(safeTotal * 0.03545 / 10) * 10).toLocaleString()}원</span></div>
                      <div style={{display:'flex', justifyContent:'space-between'}}><span>장기요양</span> <span>{(Math.floor((safeTotal * 0.03545) * 0.1295 / 10) * 10).toLocaleString()}원</span></div>
                      <div style={{display:'flex', justifyContent:'space-between'}}><span>고용보험</span> <span>{(Math.floor(safeTotal * 0.009 / 10) * 10).toLocaleString()}원</span></div>
                    </>
                  ) : (
                    <>
                      <div style={{display:'flex', justifyContent:'space-between'}}><span>소득세(3%)</span> <span>{(Math.floor(safeTotal * 0.03 / 10) * 10).toLocaleString()}원</span></div>
                      <div style={{display:'flex', justifyContent:'space-between'}}><span>지방세(0.3%)</span> <span>{(Math.floor(safeTotal * 0.003 / 10) * 10).toLocaleString()}원</span></div>
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