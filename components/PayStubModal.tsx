'use client';

import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';

type Props = {
  data: any;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (settings: any) => void; 
  year: number;
  month: number;
};

export default function PayStubModal({ data, isOpen, onClose, onSave, year, month }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const [useWeekly, setUseWeekly] = useState(true);
  const [useNight, setUseNight] = useState(true);
  const [useOvertime, setUseOvertime] = useState(true);
  const [useHolidayWork, setUseHolidayWork] = useState(true);
  const [useBreakDeduct, setUseBreakDeduct] = useState(true);
  const [noTax, setNoTax] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && data && data.storeSettingsSnapshot) {
      const s = data.storeSettingsSnapshot;
      setUseWeekly(s.pay_weekly ?? true);
      setUseNight(s.pay_night ?? false);
      setUseOvertime(s.pay_overtime ?? false);
      setUseHolidayWork(s.pay_holiday ?? false);
      setUseBreakDeduct(s.auto_deduct_break !== false);
      
      // 개별 설정값 불러오기
      if (data.userSettings) {
          setNoTax(data.userSettings.no_tax_deduction || false);
      } else {
          setNoTax(s.no_tax_deduction || false);
      }
    }
  }, [isOpen, data]);

  if (!isOpen || !data) return null;

  let newBasePay = 0;
  let newNightPay = 0;
  let newOvertimePay = 0;
  let newHolidayWorkPay = 0;
  let newWeeklyPay = 0;

  // ✅ 기존 계산 로직 유지
  const filteredLedger = (data.ledger || []).map((row: any) => {
    if (row.type === 'WORK') {
        const valDeducted = row.basePayDeducted ?? row.basePay;
        const valNoDeduct = row.basePayNoDeduct ?? row.basePay;
        const rowBase = useBreakDeduct ? valDeducted : valNoDeduct;
        
        let displayHoursStr = '';
        if (useBreakDeduct) {
           const h = row.hoursDeducted ?? row.hours; 
           displayHoursStr = `${h}h`;
           if (row.breakMins > 0) displayHoursStr += ` (휴게-${row.breakMins}분)`;
        } else {
           const h = row.hoursNoDeduct ?? row.hours;
           displayHoursStr = `${h}h`;
        }
  
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
          displayHours: displayHoursStr,
          displayNight: nightAmount,
          displayOvertime: overtimeAmount,
          displayHoliday: holidayAmount
        };
      } 
      if (row.type === 'WEEKLY') {
        const weeklyAmount = useWeekly ? (row.potentialWeeklyPay ?? row.weeklyPay) : 0;
        newWeeklyPay += weeklyAmount;
        return { ...row, displayWeekly: weeklyAmount };
      }
      return row;
  });

  const currentTotal = newBasePay + newWeeklyPay + newNightPay + newOvertimePay + newHolidayWorkPay;
  const safeTotal = currentTotal || 0;

  // 세금 계산
  let currentTax = 0;
  if (noTax) {
      currentTax = 0;
  } else {
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
  }

  const currentFinalPay = safeTotal - currentTax;

  const handleSaveSettings = async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave({
        employee_id: data.empId, 
        pay_weekly: useWeekly,
        pay_night: useNight,
        pay_overtime: useOvertime,
        pay_holiday: useHolidayWork,
        auto_deduct_break: useBreakDeduct,
        no_tax_deduction: noTax
      });
      alert('설정이 저장되었습니다.');
      onClose(); 
    } catch (e) {
      alert('오류 발생');
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ 이미지 저장 (PC 뷰 강제)
  const handleSaveImage = async () => {
    if (printRef.current) {
      try {
        const originalElement = printRef.current;
        const clone = originalElement.cloneNode(true) as HTMLElement;
        
        clone.classList.add('force-pc-view');
        document.body.appendChild(clone);

        clone.style.position = 'fixed';
        clone.style.top = '-10000px';
        clone.style.left = '-10000px';
        clone.style.width = '800px'; 
        clone.style.backgroundColor = '#ffffff';
        clone.style.padding = '40px';

        const canvas = await html2canvas(clone, {
            scale: 2,
            backgroundColor: '#ffffff',
            useCORS: true,
            windowWidth: 1000,
            width: 800
        });

        document.body.removeChild(clone);

        const link = document.createElement('a');
        link.download = `${data.name}_${month}월_급여명세서.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (e) {
          console.error(e);
          alert('이미지 저장 실패');
      }
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
    }}>
      <div style={{ backgroundColor: '#222', color: '#fff', borderRadius: 8, maxWidth: 750, width: '95%', maxHeight: '95vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* 상단 설정 영역 */}
        <div style={{ padding: 16, borderBottom: '1px solid #444', backgroundColor: '#333' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: 16 }}>⚙️ 개별 지급 옵션 설정 (이 직원만 적용)</h3>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}><input type="checkbox" checked={useWeekly} onChange={e => setUseWeekly(e.target.checked)} /> 주휴수당</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}><input type="checkbox" checked={useNight} onChange={e => setUseNight(e.target.checked)} /> 야간수당</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}><input type="checkbox" checked={useOvertime} onChange={e => setUseOvertime(e.target.checked)} /> 연장수당</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#ff6b6b', fontWeight: 'bold' }}><input type="checkbox" checked={useHolidayWork} onChange={e => setUseHolidayWork(e.target.checked)} /> 휴일(특근)수당</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: 'orange' }}><input type="checkbox" checked={useBreakDeduct} onChange={e => setUseBreakDeduct(e.target.checked)} /> 휴게시간 차감</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: 'crimson', fontWeight: 'bold', marginLeft: 'auto' }}>
                <input type="checkbox" checked={noTax} onChange={e => setNoTax(e.target.checked)} /> 공제 안 함(실수령 100%)
            </label>
          </div>
        </div>

        {/* 본문 (스크롤 & 하단 여백) */}
        <div style={{ overflowY: 'auto', flex: 1, backgroundColor: '#fff', paddingBottom: '80px' }}>
          <div ref={printRef} style={{ padding: 30, backgroundColor: '#fff', color: '#000', minHeight: 400 }}>
              <h2 style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 15, marginBottom: 25, fontSize: 24 }}>
                {year}년 {month}월 급여 명세서
              </h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, fontSize: 16 }}>
                <span>성명: <strong>{data.name}</strong></span>
                <span>지급일: {year}.{month}.{new Date().getDate()}</span>
              </div>

              {/* 가로 스크롤 적용 */}
              <div className="table-wrapper" style={{ boxShadow: 'none', borderRight: 'none', overflowX: 'auto', width: '100%' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 25, minWidth: '500px' }}>
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
              </div>

              <div style={{ border: '2px solid #000', padding: 20, borderRadius: 4 }}>
                  <div style={rowStyle}><span>기본급 (시급 {data.wage.toLocaleString()}원)</span> <span>{newBasePay.toLocaleString()}원</span></div>
                  <div style={rowStyle}><span style={{color: useWeekly?'#000':'#ccc'}}>+ 주휴수당</span> <span style={{color: useWeekly?'#000':'#ccc'}}>{newWeeklyPay.toLocaleString()}원</span></div>
                  <div style={rowStyle}><span style={{color: useNight?'#000':'#ccc'}}>+ 야간수당</span> <span style={{color: useNight?'#000':'#ccc'}}>{newNightPay.toLocaleString()}원</span></div>
                  <div style={rowStyle}><span style={{color: useOvertime?'#000':'#ccc'}}>+ 연장수당</span> <span style={{color: useOvertime?'#000':'#ccc'}}>{newOvertimePay.toLocaleString()}원</span></div>
                  <div style={rowStyle}><span style={{color: useHolidayWork?'red':'#ccc'}}>+ 휴일근로수당</span> <span style={{color: useHolidayWork?'red':'#ccc'}}>{newHolidayWorkPay.toLocaleString()}원</span></div>
                  
                  <hr style={{ margin: '12px 0', borderTop: '1px dashed #aaa' }} />
                  <div style={rowStyle}><span style={{fontWeight: 'bold'}}>세전 총액</span> <span style={{fontWeight: 'bold'}}>{currentTotal.toLocaleString()}원</span></div>
                  
                  <div style={{ ...rowStyle, color: 'red' }}>
                    <span>- 공제 ({noTax ? '공제 안 함' : '세금 등'})</span> 
                    <span>{currentTax.toLocaleString()}원</span>
                  </div>
                  
                  <hr style={{ margin: '12px 0', borderTop: '2px solid #000' }} />
                  <div style={{ ...rowStyle, fontSize: 20, fontWeight: 'bold', color: 'blue', marginTop: 10 }}>
                    <span>실수령액</span> <span>{currentFinalPay.toLocaleString()}원</span>
                  </div>
              </div>

              <div style={{ marginTop: 25, borderTop: '1px solid #eee', paddingTop: 15 }}>
                 <p style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 8, color: '#333' }}>[참고] 공제 내역 상세 (원단위 절사)</p>
                 {noTax ? (
                     <p style={{ fontSize: 11, color: '#999' }}>* '공제 안 함' 설정이 적용되어 세금이 계산되지 않았습니다.</p>
                 ) : (
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
                 )}
              </div>

          </div>
        </div>

        {/* 하단 버튼 그룹 */}
        <div style={{ padding: 16, backgroundColor: '#333', borderTop: '1px solid #444', display: 'flex', justifyContent: 'flex-end', gap: 10, paddingBottom: 20 }}>
          <button onClick={onClose} style={{ padding: '10px 20px', background: '#555', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>닫기</button>
          {onSave && (
            <button onClick={handleSaveSettings} disabled={isSaving} style={{ padding: '10px 20px', background: 'dodgerblue', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>
              {isSaving ? '저장 중...' : '설정 저장'}
            </button>
          )}
          <button onClick={handleSaveImage} style={{ padding: '10px 20px', background: 'seagreen', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>이미지 저장</button>
        </div>
      </div>
    </div>
  );
}

const thStyle = { padding: '8px', textAlign: 'center' as const, fontWeight: 'bold', borderRight: '1px solid #ddd' };
const tdStyle = { padding: '8px', textAlign: 'center' as const, borderRight: '1px solid #ddd' };
const rowStyle = { display: 'flex', justifyContent: 'space-between', marginBottom: 6 };