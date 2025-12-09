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
  const viewRef = useRef<HTMLDivElement>(null);
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

  const isModified = data.isModified === true;

  // 1. 자동 계산 로직
  let calcBasePay = 0;
  let calcNightPay = 0;
  let calcOvertimePay = 0;
  let calcHolidayWorkPay = 0;
  let calcWeeklyPay = 0;

  const filteredLedger = (data.ledger || []).map((row: any) => {
    // A. 일반 근무 (시급/일당)
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
  
        calcBasePay += rowBase;
        calcNightPay += nightAmount;
        calcOvertimePay += overtimeAmount;
        calcHolidayWorkPay += holidayAmount;
  
        return { ...row, displayBase: rowBase, displayHours: displayHoursStr, displayNight: nightAmount, displayOvertime: overtimeAmount, displayHoliday: holidayAmount };
      } 
      // B. 주휴수당
      if (row.type === 'WEEKLY') {
        const weeklyAmount = useWeekly ? (row.potentialWeeklyPay ?? row.weeklyPay) : 0;
        calcWeeklyPay += weeklyAmount;
        return { ...row, displayWeekly: weeklyAmount };
      }
      // ✅ C. [추가됨] 월급제 (MONTHLY)
      if (row.type === 'MONTHLY' || row.type === 'MONTHLY_BASE') {
        const monthlyAmount = row.basePay || 0;
        calcBasePay += monthlyAmount; // 기본급에 합산
        return { ...row, displayBase: monthlyAmount, displayHours: '-' };
      }

      return row;
  });

  // 2. 총액 결정
  let finalBasePay = 0;
  let finalTotal = 0;

  if (isModified) {
      finalBasePay = data.basePay || 0;
      finalTotal = finalBasePay + (data.adjustment || 0);
  } else {
      finalTotal = calcBasePay + calcWeeklyPay + calcNightPay + calcOvertimePay + calcHolidayWorkPay;
      finalBasePay = calcBasePay; 
  }

  const safeTotal = finalTotal || 0;

  // 3. 세금 계산
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

  return (
    <>
        {/* ✅ [Hidden] 캡처용 렌더링 */}
        <div style={{ position: 'fixed', top: '-10000px', left: '-10000px', width: '800px', zIndex: -1 }}>
            {renderFullStub(
                captureRef, year, month, data, filteredLedger, 
                useWeekly, useNight, useOvertime, useHolidayWork, useBreakDeduct, noTax, 
                calcBasePay, calcWeeklyPay, calcNightPay, calcOvertimePay, calcHolidayWorkPay, 
                finalTotal, currentTax, currentFinalPay, safeTotal, isModified 
            )}
        </div>

        {/* 1. 설정 모드 (모바일) */}
        {mode === 'settings' && (
            <div style={overlayStyle}>
                <div style={{ ...modalStyle, maxWidth: '400px', height: 'auto', padding: '24px', borderRadius: '16px' }}>
                    <h3 style={{ margin: '0 0 24px 0', textAlign: 'center', color: '#333', fontSize: '18px', borderBottom: '2px solid #f0f0f0', paddingBottom: '12px' }}>
                    ⚙️ <strong>{data.name} 님</strong> 급여 설정
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {isModified && <div style={{fontSize: 12, color: 'blue', textAlign:'center', background:'#eff6ff', padding:8, borderRadius:4}}>※ 확정된 급여(수정됨)는 수당 옵션의 영향을 받지 않습니다.</div>}
                        
                        <label style={checkboxLabelMobile}><input type="checkbox" checked={useWeekly} onChange={e => setUseWeekly(e.target.checked)} style={checkInput} disabled={isModified} /> <span style={{color: isModified?'#aaa':'#444'}}>주휴수당 <span style={{fontSize:11, color: isModified?'#ccc':'#888'}}>(15h↑)</span></span></label>
                        <label style={checkboxLabelMobile}><input type="checkbox" checked={useNight} onChange={e => setUseNight(e.target.checked)} style={checkInput} disabled={isModified} /> <span style={{color: isModified?'#aaa':'#444'}}>야간수당 <span style={{fontSize:11, color: isModified?'#ccc':'#888'}}>(1.5배)</span></span></label>
                        <label style={checkboxLabelMobile}><input type="checkbox" checked={useOvertime} onChange={e => setUseOvertime(e.target.checked)} style={checkInput} disabled={isModified} /> <span style={{color: isModified?'#aaa':'#444'}}>연장수당 <span style={{fontSize:11, color: isModified?'#ccc':'#888'}}>(1.5배)</span></span></label>
                        <label style={checkboxLabelMobile}><input type="checkbox" checked={useHolidayWork} onChange={e => setUseHolidayWork(e.target.checked)} style={checkInput} disabled={isModified} /> <span style={{color: isModified?'#aaa':'#444'}}>휴일수당 <span style={{fontSize:11, color: isModified?'#ccc':'#ff6b6b'}}>(1.5배)</span></span></label>
                        <label style={checkboxLabelMobile}><input type="checkbox" checked={useBreakDeduct} onChange={e => setUseBreakDeduct(e.target.checked)} style={checkInput} disabled={isModified} /> <span style={{color: isModified?'#aaa':'#444'}}>휴게시간 자동 차감</span></label>
                        
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

        {/* 3. 풀 모드 (화면 표시) */}
        {mode === 'full' && (
            <div style={overlayStyle}>
                <div style={modalStyle}>
                    <div style={{ padding: 16, borderBottom: '1px solid #444', backgroundColor: '#333', color: '#fff' }}>
                        <h3 style={{ margin: '0 0 12px 0', fontSize: 16 }}>⚙️ 개별 지급 옵션 설정</h3>
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                            {isModified ? (
                                <span style={{fontSize: 13, color: '#FFD700', fontWeight: 'bold'}}>※ 확정 급여(수정됨) 상태입니다. (수당 자동계산 미적용)</span>
                            ) : (
                                <>
                                    <label style={{display:'flex',gap:6,cursor:'pointer'}}><input type="checkbox" checked={useWeekly} onChange={e => setUseWeekly(e.target.checked)} /> 주휴</label>
                                    <label style={{display:'flex',gap:6,cursor:'pointer'}}><input type="checkbox" checked={useNight} onChange={e => setUseNight(e.target.checked)} /> 야간</label>
                                    <label style={{display:'flex',gap:6,cursor:'pointer'}}><input type="checkbox" checked={useOvertime} onChange={e => setUseOvertime(e.target.checked)} /> 연장</label>
                                    <label style={{display:'flex',gap:6,cursor:'pointer'}}><input type="checkbox" checked={useHolidayWork} onChange={e => setUseHolidayWork(e.target.checked)} /> 휴일</label>
                                    <label style={{display:'flex',gap:6,cursor:'pointer'}}><input type="checkbox" checked={useBreakDeduct} onChange={e => setUseBreakDeduct(e.target.checked)} /> 휴게차감</label>
                                </>
                            )}
                            <label style={{display:'flex',gap:6,cursor:'pointer', marginLeft:'auto', color:'#ff6b6b'}}><input type="checkbox" checked={noTax} onChange={e => setNoTax(e.target.checked)} /> 공제 안 함</label>
                        </div>
                    </div>

                    <div style={{ overflowY: 'auto', flex: 1, backgroundColor: '#fff', paddingBottom: '20px' }}>
                        <div ref={viewRef} style={{ padding: '20px', width: '100%', boxSizing: 'border-box' }}>
                             {renderStubContent(year, month, data, filteredLedger, useWeekly, useNight, useOvertime, useHolidayWork, useBreakDeduct, noTax, calcBasePay, calcWeeklyPay, calcNightPay, calcOvertimePay, calcHolidayWorkPay, finalTotal, currentTax, currentFinalPay, safeTotal, isModified, true)}
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

// 📌 [공통 렌더링 함수]
function renderStubContent(
    year: number, month: number, data: any, filteredLedger: any, 
    useWeekly: boolean, useNight: boolean, useOvertime: boolean, useHolidayWork: boolean, useBreakDeduct: boolean, noTax: boolean, 
    cBase: number, cWeekly: number, cNight: number, cOvertime: number, cHoliday: number, 
    finalTotal: number, currentTax: number, currentFinalPay: number, safeTotal: number, 
    isModified: boolean, isCompact: boolean
) {
    const th = isCompact ? compactThStyle : thStyle;
    const td = isCompact ? compactTdStyle : tdStyle;

    return (
        <>
            <h2 style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 15, marginBottom: 15, fontSize: isCompact ? 18 : 24, margin: isCompact ? '10px 0' : '0 0 25px 0' }}>
                {year}년 {month}월 급여 명세서
            </h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: isCompact ? 15 : 20, fontSize: isCompact ? 13 : 16, color: '#555' }}>
                <span>성명: <strong style={{color:'#000'}}>{data.name}</strong></span>
                <span>지급일: {year}.{month}.{new Date().getDate()}</span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: isCompact ? 12 : 11, marginBottom: isCompact ? 15 : 25, minWidth: '100%' }}>
                <thead style={{ background: '#f5f5f5', borderBottom: '1px solid #ddd', borderTop: isCompact ? 'none' : '2px solid #000' }}>
                    <tr>
                        <th style={th}>날짜</th>
                        <th style={th}>시간</th>
                        <th style={th}>근무</th>
                        <th style={th}>기본급</th>
                        <th style={th}>야간</th>
                        <th style={th}>연장</th>
                        <th style={{...th, color: 'red'}}>휴일</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredLedger.map((row: any, idx: number) => {
                        if (row.type === 'WEEKLY') {
                            if (!useWeekly && !isModified) return null;
                            return (
                                <tr key={idx} style={{ backgroundColor: '#fff8c4', borderBottom: '1px solid #ddd' }}>
                                    <td colSpan={3} style={{ ...td, textAlign: 'center', fontWeight: 'bold', color: '#d68910' }}>⭐ {row.dayLabel} ({row.note})</td>
                                    <td style={td}>-</td>
                                    <td colSpan={3} style={{ ...td, textAlign: 'right', fontWeight: 'bold', color: '#d68910' }}>{(row.displayWeekly || 0).toLocaleString()}</td>
                                </tr>
                            );
                        }
                        return (
                            <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                                <td style={td}>{row.date.slice(5)} ({row.dayLabel})</td>
                                <td style={td}>{row.timeRange}</td>
                                <td style={td}>{row.displayHours}</td>
                                <td style={{ ...td, textAlign: 'right' }}>{(row.displayBase || 0).toLocaleString()}</td>
                                <td style={{ ...td, textAlign: 'right', color: row.displayNight > 0 ? (isCompact ? '#888' : 'red') : '#eee' }}>{(row.displayNight || 0).toLocaleString()}</td>
                                <td style={{ ...td, textAlign: 'right', color: row.displayOvertime > 0 ? (isCompact ? '#888' : 'blue') : '#eee' }}>{(row.displayOvertime || 0).toLocaleString()}</td>
                                <td style={{ ...td, textAlign: 'right', color: row.displayHoliday > 0 ? 'red' : '#eee' }}>{(row.displayHoliday || 0).toLocaleString()}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <div style={{ background: isCompact ? '#f9f9f9' : '#fff', padding: isCompact ? 15 : 20, borderRadius: isCompact ? 8 : 4, border: isCompact ? '1px solid #eee' : '2px solid #000' }}>
                {isModified ? (
                    <div style={{ marginBottom: 12 }}>
                        <div style={rowStyle}><span>확정 기본급 (수정됨)</span> <span style={{fontWeight:'bold'}}>{(data.basePay || 0).toLocaleString()}원</span></div>
                        {data.adjustment !== 0 && (
                            <div style={rowStyle}>
                                <span>{data.adjustment > 0 ? '상여금(추가)' : '공제(삭감)'}</span> 
                                <span style={{ color: data.adjustment > 0 ? 'blue' : 'red', fontWeight: 'bold' }}>
                                    {data.adjustment > 0 ? '+' : ''}{data.adjustment.toLocaleString()}원
                                </span>
                            </div>
                        )}
                         <div style={{fontSize: 11, color: '#999', marginTop: 4, textAlign: 'right'}}>* 관리자에 의해 수정된 확정 금액입니다.</div>
                    </div>
                ) : (
                    <div style={{ display: isCompact ? 'flex' : 'block', flexWrap: 'wrap', gap: isCompact ? '15px' : '0', fontSize: isCompact ? 13 : 14, color: '#333', marginBottom: 12 }}>
                        <div style={isCompact?{}:rowStyle}><span>기본급</span> {isCompact?': ':''}<b>{cBase.toLocaleString()}{!isCompact&&'원'}</b></div>
                        <div style={isCompact?{color: useWeekly?'#555':'#ccc'}:rowStyle}><span style={{color: useWeekly?'#000':'#ccc'}}>{isCompact?'+ ':''}주휴{!isCompact&&'수당'}</span> {isCompact?': ':''}<b>{cWeekly.toLocaleString()}{!isCompact&&'원'}</b></div>
                        <div style={isCompact?{color: useNight?'#555':'#ccc'}:rowStyle}><span style={{color: useNight?'#000':'#ccc'}}>{isCompact?'+ ':''}야간{!isCompact&&'수당'}</span> {isCompact?': ':''}<b>{cNight.toLocaleString()}{!isCompact&&'원'}</b></div>
                        <div style={isCompact?{color: useOvertime?'#555':'#ccc'}:rowStyle}><span style={{color: useOvertime?'#000':'#ccc'}}>{isCompact?'+ ':''}연장{!isCompact&&'수당'}</span> {isCompact?': ':''}<b>{cOvertime.toLocaleString()}{!isCompact&&'원'}</b></div>
                        <div style={isCompact?{color: useHolidayWork?'red':'#ccc'}:rowStyle}><span style={{color: useHolidayWork?'red':'#ccc'}}>{isCompact?'+ ':''}휴일{!isCompact&&'수당'}</span> {isCompact?': ':''}<b>{cHoliday.toLocaleString()}{!isCompact&&'원'}</b></div>
                    </div>
                )}
                
                <hr style={{ margin: '8px 0', borderTop: '1px dashed #ccc' }} />
                
                <div style={{ display: isCompact ? 'flex' : 'block', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div style={{fontSize: isCompact ? 13 : 14, width: isCompact ? 'auto' : '100%'}}>
                        <div style={isCompact ? {marginBottom: 4} : rowStyle}>
                            <span style={{fontWeight: 'bold'}}>세전 총액</span> 
                            {isCompact ? ': ' : ''}
                            <span style={{fontWeight: 'bold'}}>{finalTotal.toLocaleString()}원</span>
                        </div>
                        <div style={isCompact ? {color: 'red', fontSize: 12} : {...rowStyle, color: 'red'}}>
                            <span>- 공제 ({noTax ? '미적용' : '세금 등'})</span>
                            {isCompact ? ': ' : ''}
                            <span>{currentTax.toLocaleString()}원</span>
                        </div>
                    </div>
                    {isCompact && (
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 11, color: '#666' }}>실수령액</div>
                            <div style={{ fontSize: 22, fontWeight: 'bold', color: 'dodgerblue' }}>
                                {currentFinalPay.toLocaleString()}<span style={{fontSize:14}}>원</span>
                            </div>
                        </div>
                    )}
                </div>
                {!isCompact && (
                    <>
                        <hr style={{ margin: '12px 0', borderTop: '2px solid #000' }} />
                        <div style={{ ...rowStyle, fontSize: 20, fontWeight: 'bold', color: 'blue', marginTop: 10 }}>
                            <span>실수령액</span> <span>{currentFinalPay.toLocaleString()}원</span>
                        </div>
                    </>
                )}
            </div>

            {/* ✅ [수정] 공제 내역 디자인 개선 */}
            <div style={{ marginTop: 25, borderTop: '1px solid #eee', paddingTop: 15 }}>
                <p style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10, color: '#333' }}>[참고] 공제 내역 상세 (원단위 절사)</p>
                {noTax ? (
                    <p style={{ fontSize: 12, color: '#666' }}>* '공제 안 함' 설정이 적용되어 세금이 계산되지 않았습니다.</p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px', fontSize: 14, color: '#000' }}>
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
        </>
    );
}

function renderFullStub(ref: any, year: number, month: number, data: any, filteredLedger: any, useWeekly: boolean, useNight: boolean, useOvertime: boolean, useHolidayWork: boolean, useBreakDeduct: boolean, noTax: boolean, cBase: number, cWeekly: number, cNight: number, cOvertime: number, cHoliday: number, finalTotal: number, currentTax: number, currentFinalPay: number, safeTotal: number, isModified: boolean) {
    return (
        <div ref={ref} style={{ padding: 40, backgroundColor: '#fff', color: '#000', minHeight: 500, width: '800px', margin: '0 auto', boxSizing: 'border-box' }}>
            {renderStubContent(year, month, data, filteredLedger, useWeekly, useNight, useOvertime, useHolidayWork, useBreakDeduct, noTax, cBase, cWeekly, cNight, cOvertime, cHoliday, finalTotal, currentTax, currentFinalPay, safeTotal, isModified, false)}
        </div>
    );
}

// 스타일
const overlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center' };
const modalStyle: React.CSSProperties = { backgroundColor: '#fff', width: '90%', maxWidth: '750px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', maxHeight: '95vh', display: 'flex', flexDirection: 'column' };
const thStyle = { padding: '8px', textAlign: 'center' as const, fontWeight: 'bold', borderRight: '1px solid #ddd' };
const tdStyle = { padding: '8px', textAlign: 'center' as const, borderRight: '1px solid #ddd', whiteSpace: 'nowrap' as const };
const rowStyle = { display: 'flex', justifyContent: 'space-between', marginBottom: 6 };
const checkInput = { transform: 'scale(1.2)' };
const btnCancel = { flex: 1, padding: '12px', background: '#f5f5f5', border: 'none', color: '#333', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' };
const btnSave = { flex: 1, padding: '12px', background: 'dodgerblue', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' };
const checkboxLabelMobile = { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '15px', color: '#444' };
const btnCancelSmall = { padding: '10px 20px', background: '#f5f5f5', border: '1px solid #ddd', color: '#666', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', minWidth: '80px' };
const btnSaveSmall = { padding: '10px 20px', background: 'dodgerblue', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', minWidth: '80px' };
const compactThStyle = { padding: '6px 4px', textAlign: 'center' as const, fontWeight: 'bold', borderRight: '1px solid #eee', whiteSpace: 'nowrap' as const };
const compactTdStyle = { padding: '6px 4px', textAlign: 'center' as const, borderRight: '1px solid #eee', whiteSpace: 'nowrap' as const };