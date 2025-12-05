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
  mode?: 'full' | 'settings' | 'download'; 
};

export default function PayStubModal({ data, isOpen, onClose, onSave, year, month, mode = 'full' }: Props) {
  // ✅ 보이는 화면용 Ref
  const viewRef = useRef<HTMLDivElement>(null);
  // ✅ [핵심] 숨겨진 캡처용 Ref (무조건 PC 풀버전)
  const captureRef = useRef<HTMLDivElement>(null);

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
      
      if (data.userSettings) {
          setNoTax(data.userSettings.no_tax_deduction || false);
      } else {
          setNoTax(s.no_tax_deduction || false);
      }
    }
  }, [isOpen, data]);

  useEffect(() => {
    if (isOpen && mode === 'download') {
        const timer = setTimeout(() => {
            handleSaveImage(true); 
        }, 500);
        return () => clearTimeout(timer);
    }
  }, [isOpen, mode]);

  if (!isOpen || !data) return null;

  let newBasePay = 0;
  let newNightPay = 0;
  let newOvertimePay = 0;
  let newHolidayWorkPay = 0;
  let newWeeklyPay = 0;

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
  
        return { ...row, displayBase: rowBase, displayHours: displayHoursStr, displayNight: nightAmount, displayOvertime: overtimeAmount, displayHoliday: holidayAmount };
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
      alert('설정이 저장되었습니다. (급여 재계산됨)');
      onClose(); 
    } catch (e) {
      alert('오류 발생');
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveImage = async (autoClose = false) => {
    // 📸 무조건 'captureRef' (숨겨진 A4 버전)를 캡처합니다.
    if (captureRef.current) {
      try {
        const canvas = await html2canvas(captureRef.current, { 
            scale: 2, 
            backgroundColor: '#ffffff', 
            useCORS: true,
        });

        const link = document.createElement('a');
        link.download = `${data.name}_${month}월_급여명세서.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        if (autoClose) onClose(); 
      } catch (e) {
          console.error(e);
          alert('이미지 저장 실패');
      }
    }
  };

  // --- 렌더링 ---
  return (
    <>
        {/* ✅ [Hidden] 캡처 전용 보이지 않는 DOM (무조건 PC 풀버전 스타일 유지) */}
        <div style={{ position: 'fixed', top: '-10000px', left: '-10000px', width: '800px', zIndex: -1 }}>
            {renderFullStub(captureRef, year, month, data, filteredLedger, useWeekly, useNight, useOvertime, useHolidayWork, useBreakDeduct, noTax, newBasePay, newWeeklyPay, newNightPay, newOvertimePay, newHolidayWorkPay, currentTotal, currentTax, currentFinalPay, safeTotal)}
        </div>

        {/* 1. 설정 모드 (모바일용) */}
        {mode === 'settings' && (
            <div style={overlayStyle}>
                <div style={{ ...modalStyle, maxWidth: '400px', height: 'auto', padding: '24px', borderRadius: '16px' }}>
                    <h3 style={{ margin: '0 0 24px 0', textAlign: 'center', color: '#333', fontSize: '18px', borderBottom: '2px solid #f0f0f0', paddingBottom: '12px' }}>
                    ⚙️ <strong>{data.name} 님</strong> 급여 설정
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <label style={checkboxLabelMobile}><input type="checkbox" checked={useWeekly} onChange={e => setUseWeekly(e.target.checked)} style={checkInput} /> <span>주휴수당 <span style={{fontSize:11, color:'#888'}}>(15h↑)</span></span></label>
                        <label style={checkboxLabelMobile}><input type="checkbox" checked={useNight} onChange={e => setUseNight(e.target.checked)} style={checkInput} /> <span>야간수당 <span style={{fontSize:11, color:'#888'}}>(1.5배)</span></span></label>
                        <label style={checkboxLabelMobile}><input type="checkbox" checked={useOvertime} onChange={e => setUseOvertime(e.target.checked)} style={checkInput} /> <span>연장수당 <span style={{fontSize:11, color:'#888'}}>(1.5배)</span></span></label>
                        <label style={checkboxLabelMobile}><input type="checkbox" checked={useHolidayWork} onChange={e => setUseHolidayWork(e.target.checked)} style={checkInput} /> <span>휴일수당 <span style={{fontSize:11, color:'#ff6b6b'}}>(1.5배)</span></span></label>
                        <label style={checkboxLabelMobile}><input type="checkbox" checked={useBreakDeduct} onChange={e => setUseBreakDeduct(e.target.checked)} style={checkInput} /> <span>휴게시간 자동 차감</span></label>
                        
                        <div style={{ borderTop: '1px dashed #ddd', margin: '4px 0' }}></div>
                        
                        <label style={{ ...checkboxLabelMobile, color: 'crimson', fontWeight: 'bold' }}>
                            <input type="checkbox" checked={noTax} onChange={e => setNoTax(e.target.checked)} style={checkInput} /> 
                            <span>세금 공제 안 함 <span style={{fontSize:11}}>(100%)</span></span>
                        </label>
                    </div>
                    <div style={{ marginTop: 28, display: 'flex', gap: 10, justifyContent: 'center' }}>
                        <button onClick={onClose} style={btnCancelSmall}>취소</button>
                        <button onClick={handleSaveSettings} disabled={isSaving} style={btnSaveSmall}>{isSaving ? '...' : '저장'}</button>
                    </div>
                </div>
            </div>
        )}

        {/* 2. 다운로드 모드 */}
        {mode === 'download' && (
             <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontSize: '18px' }}>
                ⏳ 다운로드 생성 중...
             </div>
        )}

        {/* 3. 풀 모드 (화면 표시용) */}
        {mode === 'full' && (
            <div style={overlayStyle}>
                <div style={modalStyle}>
                    <div style={{ padding: 16, borderBottom: '1px solid #444', backgroundColor: '#333', color: '#fff' }}>
                        <h3 style={{ margin: '0 0 12px 0', fontSize: 16 }}>⚙️ 개별 지급 옵션 설정</h3>
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                            <label style={{display:'flex',gap:6,cursor:'pointer'}}><input type="checkbox" checked={useWeekly} onChange={e => setUseWeekly(e.target.checked)} /> 주휴</label>
                            <label style={{display:'flex',gap:6,cursor:'pointer'}}><input type="checkbox" checked={useNight} onChange={e => setUseNight(e.target.checked)} /> 야간</label>
                            <label style={{display:'flex',gap:6,cursor:'pointer'}}><input type="checkbox" checked={useOvertime} onChange={e => setUseOvertime(e.target.checked)} /> 연장</label>
                            <label style={{display:'flex',gap:6,cursor:'pointer'}}><input type="checkbox" checked={useHolidayWork} onChange={e => setUseHolidayWork(e.target.checked)} /> 휴일</label>
                            <label style={{display:'flex',gap:6,cursor:'pointer'}}><input type="checkbox" checked={useBreakDeduct} onChange={e => setUseBreakDeduct(e.target.checked)} /> 휴게차감</label>
                            <label style={{display:'flex',gap:6,cursor:'pointer', marginLeft:'auto', color:'#ff6b6b'}}><input type="checkbox" checked={noTax} onChange={e => setNoTax(e.target.checked)} /> 공제 안 함</label>
                        </div>
                    </div>

                    {/* ✅ [수정] 화면 표시용 컴팩트 뷰 (Compact View) */}
                    <div style={{ overflowY: 'auto', flex: 1, backgroundColor: '#fff', paddingBottom: '20px' }}>
                        <div ref={viewRef} style={{ padding: '20px', width: '100%', boxSizing: 'border-box' }}>
                             {/* 1. 타이틀 축소 */}
                            <h2 style={{ textAlign: 'center', borderBottom: '2px solid #333', paddingBottom: 10, marginBottom: 15, fontSize: 18, margin: '10px 0' }}>
                                {year}년 {month}월 급여 명세서
                            </h2>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15, fontSize: 13, color:'#555' }}>
                                <span>성명: <strong style={{color:'#000'}}>{data.name}</strong></span>
                                <span>지급일: {year}.{month}.{new Date().getDate()}</span>
                            </div>

                            {/* 2. 테이블 컴팩트화 (폰트 12px, 패딩 축소) */}
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 15 }}>
                                <thead style={{ background: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
                                    <tr>
                                        <th style={compactThStyle}>날짜</th>
                                        <th style={compactThStyle}>시간</th>
                                        <th style={compactThStyle}>근무</th>
                                        <th style={compactThStyle}>기본급</th>
                                        <th style={compactThStyle}>야간</th>
                                        <th style={compactThStyle}>연장</th>
                                        <th style={{...compactThStyle, color: 'red'}}>휴일</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLedger.map((row: any, idx: number) => {
                                        if (row.type === 'WEEKLY') {
                                            if (!useWeekly) return null;
                                            return (
                                                <tr key={idx} style={{ backgroundColor: '#fffcf0', borderBottom: '1px solid #eee' }}>
                                                    <td colSpan={3} style={{ ...compactTdStyle, textAlign: 'center', fontWeight: 'bold', color: '#d68910' }}>⭐ {row.dayLabel} ({row.note})</td>
                                                    <td style={compactTdStyle}>-</td>
                                                    <td colSpan={3} style={{ ...compactTdStyle, textAlign: 'right', fontWeight: 'bold', color: '#d68910' }}>{(row.displayWeekly || 0).toLocaleString()}</td>
                                                </tr>
                                            );
                                        }
                                        return (
                                            <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                                <td style={compactTdStyle}>{row.date.slice(5)} ({row.dayLabel})</td>
                                                <td style={compactTdStyle}>{row.timeRange}</td>
                                                <td style={compactTdStyle}>{row.displayHours}</td>
                                                <td style={{ ...compactTdStyle, textAlign: 'right' }}>{(row.displayBase || 0).toLocaleString()}</td>
                                                <td style={{ ...compactTdStyle, textAlign: 'right', color: row.displayNight > 0 ? '#888' : '#eee' }}>{(row.displayNight || 0).toLocaleString()}</td>
                                                <td style={{ ...compactTdStyle, textAlign: 'right', color: row.displayOvertime > 0 ? '#888' : '#eee' }}>{(row.displayOvertime || 0).toLocaleString()}</td>
                                                <td style={{ ...compactTdStyle, textAlign: 'right', color: row.displayHoliday > 0 ? 'red' : '#eee' }}>{(row.displayHoliday || 0).toLocaleString()}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {/* 3. 합계 박스 컴팩트화 (가로 배치) */}
                            <div style={{ background: '#f9f9f9', padding: 15, borderRadius: 8, border: '1px solid #eee' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', rowGap: '8px', fontSize: 13, color: '#555', marginBottom: 12 }}>
                                    <div>기본급: <b>{newBasePay.toLocaleString()}</b></div>
                                    <div style={{color: useWeekly?'#555':'#ccc'}}>+ 주휴: <b>{newWeeklyPay.toLocaleString()}</b></div>
                                    <div style={{color: useNight?'#555':'#ccc'}}>+ 야간: <b>{newNightPay.toLocaleString()}</b></div>
                                    <div style={{color: useOvertime?'#555':'#ccc'}}>+ 연장: <b>{newOvertimePay.toLocaleString()}</b></div>
                                    <div style={{color: useHolidayWork?'red':'#ccc'}}>+ 휴일: <b>{newHolidayWorkPay.toLocaleString()}</b></div>
                                </div>
                                
                                <div style={{ borderTop: '1px dashed #ccc', margin: '8px 0' }}></div>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                    <div style={{fontSize: 13}}>
                                        <div style={{marginBottom: 4}}>세전 총액: <b>{currentTotal.toLocaleString()}원</b></div>
                                        <div style={{color: 'red', fontSize: 12}}>
                                            - 공제 합계: {currentTax.toLocaleString()}원 
                                            <span style={{fontSize: 11, color: '#999', marginLeft: 4}}>({noTax ? '미적용' : '세금 등'})</span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 11, color: '#666' }}>실수령액</div>
                                        <div style={{ fontSize: 22, fontWeight: 'bold', color: 'dodgerblue' }}>
                                            {currentFinalPay.toLocaleString()}<span style={{fontSize:14}}>원</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ padding: 16, backgroundColor: '#333', borderTop: '1px solid #444', display: 'flex', justifyContent: 'flex-end', gap: 10, paddingBottom: 20 }}>
                        <button onClick={onClose} style={btnCancel}>닫기</button>
                        {onSave && <button onClick={handleSaveSettings} disabled={isSaving} style={{...btnSave, background:'dodgerblue'}}>설정 저장</button>}
                        <button onClick={() => handleSaveImage(false)} style={btnSave}>이미지 저장</button>
                    </div>
                </div>
            </div>
        )}
    </>
  );
}

// 📌 [Capture용] 기존 풀버전 렌더링 함수 (변경 없음 - 이미지 저장용으로 유지)
function renderFullStub(ref: any, year: number, month: number, data: any, filteredLedger: any, useWeekly: boolean, useNight: boolean, useOvertime: boolean, useHolidayWork: boolean, useBreakDeduct: boolean, noTax: boolean, newBasePay: number, newWeeklyPay: number, newNightPay: number, newOvertimePay: number, newHolidayWorkPay: number, currentTotal: number, currentTax: number, currentFinalPay: number, safeTotal: number) {
    return (
        <div ref={ref} style={{ padding: 40, backgroundColor: '#fff', color: '#000', minHeight: 500, width: '800px', margin: '0 auto', boxSizing: 'border-box' }}>
            <h2 style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 15, marginBottom: 25, fontSize: 24 }}>
            {year}년 {month}월 급여 명세서
            </h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, fontSize: 16 }}>
            <span>성명: <strong>{data.name}</strong></span>
            <span>지급일: {year}.{month}.{new Date().getDate()}</span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 25, minWidth: '100%' }}>
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
    );
}

// 스타일
const overlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 2000,
  display: 'flex', justifyContent: 'center', alignItems: 'center'
};
const modalStyle: React.CSSProperties = {
  backgroundColor: '#fff', width: '90%', maxWidth: '750px',
  borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
  maxHeight: '95vh', display: 'flex', flexDirection: 'column'
};
const thStyle = { padding: '8px', textAlign: 'center' as const, fontWeight: 'bold', borderRight: '1px solid #ddd' };
const tdStyle = { padding: '8px', textAlign: 'center' as const, borderRight: '1px solid #ddd', whiteSpace: 'nowrap' as const };
const rowStyle = { display: 'flex', justifyContent: 'space-between', marginBottom: 6 };
const checkboxLabel = { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', padding: '8px 0', borderBottom: '1px solid #f0f0f0' };
const checkInput = { transform: 'scale(1.2)' };
const btnCancel = { flex: 1, padding: '12px', background: '#f5f5f5', border: 'none', color: '#333', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' };
const btnSave = { flex: 1, padding: '12px', background: 'dodgerblue', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' };
const checkboxLabelMobile = { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '15px', color: '#444' };
const btnCancelSmall = { padding: '10px 20px', background: '#f5f5f5', border: '1px solid #ddd', color: '#666', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', minWidth: '80px' };
const btnSaveSmall = { padding: '10px 20px', background: 'dodgerblue', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', minWidth: '80px' };

// ✅ 컴팩트용 스타일 추가
const compactThStyle = { padding: '6px 4px', textAlign: 'center' as const, fontWeight: 'bold', borderRight: '1px solid #eee', whiteSpace: 'nowrap' as const };
const compactTdStyle = { padding: '6px 4px', textAlign: 'center' as const, borderRight: '1px solid #eee', whiteSpace: 'nowrap' as const };