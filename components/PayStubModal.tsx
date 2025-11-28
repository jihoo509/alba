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
    if (isOpen && data && data.storeSettingsSnapshot) {
      const s = data.storeSettingsSnapshot;
      // 기본값은 매장 설정 따라감
      setUseWeekly(s.pay_weekly ?? true);
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

  const filteredLedger = (data.ledger || []).map((row: any) => {
    if (row.type === 'WORK') {
      // 1. 기본급 계산 (토글에 따라 선택)
      // potential 값이 없으면 기존 값으로 fallback
      const valDeducted = row.basePayDeducted ?? row.basePay;
      const valNoDeduct = row.basePayNoDeduct ?? row.basePay;

      const rowBase = useBreakDeduct ? valDeducted : valNoDeduct;
      
      // 2. 시간 표기 텍스트 생성 (여기서만 텍스트를 만듦)
      let displayHoursStr = '';
      if (useBreakDeduct) {
         // 차감 적용 시: 순수 시간 + 텍스트
         const h = row.hoursDeducted ?? row.hours; // 없으면 기존 hours(문자일수도 있음)
         displayHoursStr = `${h}h`;
         if (row.breakMins > 0) {
             displayHoursStr += ` (휴게-${row.breakMins}분)`;
         }
      } else {
         // 차감 미적용 시: 전체 시간
         const h = row.hoursNoDeduct ?? row.hours;
         displayHoursStr = `${h}h`;
      }

      // 3. 수당 계산 (potential 값을 사용하여 토글 켤 때 0원 방지)
      // potential 값이 없으면(구버전 데이터) 그냥 0 처리
      const nightAmount = useNight ? (row.potentialNightPay ?? row.nightPay) : 0;
      const overtimeAmount = useOvertime ? (row.potentialOvertimePay ?? row.overtimePay) : 0;
      const holidayAmount = useHolidayWork ? (row.potentialHolidayWorkPay ?? row.holidayWorkPay) : 0;

      newBasePay += rowBase;
      newNightPay += nightAmount;
      newOvertimePay += overtimeAmount;
      newHolidayWorkPay += holidayAmount;

      return { 
        ...row, 
        displayBase: rowBase, 
        displayHours: displayHoursStr, // 텍스트 중복 해결된 문자열
        displayNight: nightAmount,
        displayOvertime: overtimeAmount,
        displayHoliday: holidayAmount
      };
    } 
    
    if (row.type === 'WEEKLY') {
      // 주휴수당 토글 처리
      const weeklyAmount = useWeekly ? (row.potentialWeeklyPay ?? row.weeklyPay) : 0;
      newWeeklyPay += weeklyAmount;
      
      return {
          ...row,
          displayWeekly: weeklyAmount
      };
    }
    return row;
  });

  const currentTotal = newBasePay + newWeeklyPay + newNightPay + newOvertimePay + newHolidayWorkPay;
  const safeTotal = currentTotal || 0;

  // 세금 계산 로직 (비율은 그대로 유지)
  let currentTax = 0;
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
                        {/* 🔴 [수정] row.displayWeekly 사용 */}
                        <td colSpan={3} style={{ ...tdStyle, textAlign: 'right', fontWeight: 'bold', color: '#d68910' }}>{(row.displayWeekly || 0).toLocaleString()}</td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                      <td style={tdStyle}>{row.date.slice(5)} ({row.dayLabel})</td>
                      <td style={tdStyle}>{row.timeRange}</td>
                      <td style={tdStyle}>{row.displayHours}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{(row.displayBase || 0).toLocaleString()}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: row.displayNight > 0 ? 'red' : '#ccc' }}>{(row.displayNight || 0).toLocaleString()}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: row.displayOvertime > 0 ? 'blue' : '#ccc' }}>{(row.displayOvertime || 0).toLocaleString()}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: row.displayHoliday > 0 ? 'red' : '#ccc', fontWeight: 'bold' }}>{(row.displayHoliday || 0).toLocaleString()}</td>
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