'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import { format, differenceInCalendarDays, subMonths } from 'date-fns';
import DateSelector from './DateSelector';
import html2canvas from 'html2canvas'; // 캡처 라이브러리

type Props = { currentStoreId: string; employees: any[]; };

export default function SeveranceCalculator({ currentStoreId, employees }: Props) {
  const supabase = createSupabaseBrowserClient();
  
  // ✅ [신규] 섹션 열림/닫힘 상태 (기본값: false - 닫힘)
  const [isOpen, setIsOpen] = useState(false);

  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [hireDate, setHireDate] = useState('');
  const [resignDate, setResignDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const [pay3MonthsStr, setPay3MonthsStr] = useState(''); 
  const [annualBonusStr, setAnnualBonusStr] = useState(''); 

  const [totalDays, setTotalDays] = useState(0); 
  const [avgWage, setAvgWage] = useState(0); 
  const [severancePay, setSeverancePay] = useState(0); 
  const [loadingAuto, setLoadingAuto] = useState(false);
  
  const [isEmpSelectorOpen, setIsEmpSelectorOpen] = useState(false);
  const [showMobileChoice, setShowMobileChoice] = useState(false); // 모바일 공유 팝업

  // 캡처 영역 참조
  const resultRef = useRef<HTMLDivElement>(null);

  // 직원 선택 핸들러
  const handleSelectEmployee = (empId: string) => {
    setSelectedEmpId(empId);
    const emp = employees.find(ep => ep.id === empId);
    setHireDate(emp?.hire_date || '');
    setIsEmpSelectorOpen(false);
  };

  const selectedEmpName = employees.find(e => e.id === selectedEmpId)?.name || '';

  // 숫자 콤마 포맷팅 함수
  const formatNumber = (val: string) => {
    const num = Number(val.replace(/,/g, ''));
    if (isNaN(num) || num === 0) return '';
    return num.toLocaleString();
  };

  const handlePayChange = (val: string) => {
    setPay3MonthsStr(formatNumber(val));
  };

  useEffect(() => {
    if (hireDate && resignDate) {
      const start = new Date(hireDate);
      const end = new Date(resignDate);
      const diff = differenceInCalendarDays(end, start) + 1; 
      setTotalDays(diff > 0 ? diff : 0);
    } else { setTotalDays(0); }
  }, [hireDate, resignDate]);

  const fetchAutoData = useCallback(async () => {
    if (!currentStoreId || !selectedEmpId || !resignDate) return;
    setLoadingAuto(true);
    try {
      const rDate = new Date(resignDate);
      const startDateStr = format(subMonths(rDate, 3), 'yyyy-MM-dd');
      const { data: schedules } = await supabase.from('schedules').select('*').eq('store_id', currentStoreId).eq('employee_id', selectedEmpId).gte('date', startDateStr).lte('date', resignDate);
      const { data: emp } = await supabase.from('employees').select('hourly_wage').eq('id', selectedEmpId).single();
      
      if (schedules && emp) {
        let totalPay = 0;
        schedules.forEach((s: any) => {
            const [sH, sM] = s.start_time.split(':').map(Number);
            const [eH, eM] = s.end_time.split(':').map(Number);
            let rawMins = (eH * 60 + eM) - (sH * 60 + sM);
            if (rawMins < 0) rawMins += 24 * 60;
            const basePay = Math.floor((rawMins / 60) * emp.hourly_wage);
            totalPay += basePay;
        });
        setPay3MonthsStr(totalPay.toLocaleString());
      }
    } catch (e) { console.error(e); } finally { setLoadingAuto(false); }
  }, [currentStoreId, selectedEmpId, resignDate, supabase]);

  useEffect(() => { if (selectedEmpId) { setPay3MonthsStr(''); fetchAutoData(); } }, [selectedEmpId, fetchAutoData]);

  const calculateResult = () => {
    if (!hireDate || !resignDate || totalDays < 365) { alert('재직 기간이 1년 이상이어야 합니다.'); return; }
    const rDate = new Date(resignDate);
    const daysIn3Months = differenceInCalendarDays(rDate, subMonths(rDate, 3));
    
    const payVal = Number(pay3MonthsStr.replace(/,/g, '')) || 0;
    const bonusVal = Number(annualBonusStr.replace(/,/g, '')) || 0;

    const total3MonthPay = payVal + (bonusVal * (3/12));
    const dailyWage = total3MonthPay / daysIn3Months; 
    const result = dailyWage * 30 * (totalDays / 365);
    setAvgWage(Math.floor(dailyWage));
    setSeverancePay(Math.floor(result / 10) * 10); 
  };

  // ✅ [신규] 이미지 저장/공유 기능
  const handleCapture = async (isShare = false) => {
    setShowMobileChoice(false);
    if (!resultRef.current) return;

    try {
      const canvas = await html2canvas(resultRef.current, { scale: 2, backgroundColor: '#ffffff' });
      
      if (isShare) {
        canvas.toBlob(async (blob) => {
          if (!blob) return alert('이미지 생성 실패');
          const file = new File([blob], `${selectedEmpName}_퇴직금계산.png`, { type: 'image/png' });
          if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: '퇴직금 계산 결과', text: `${selectedEmpName}님 퇴직금 계산 내역입니다.` });
          } else {
            alert('공유 기능을 사용할 수 없습니다.');
          }
        }, 'image/png');
      } else {
        const link = document.createElement('a');
        link.download = `${selectedEmpName}_퇴직금계산.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    } catch (e) {
      console.error(e);
      alert('저장/공유 중 오류가 발생했습니다.');
    }
  };

  // 메인 버튼 클릭 (PC/모바일 분기)
  const handleDownloadClick = () => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);
    if (isMobile) {
      setShowMobileChoice(true);
    } else {
      handleCapture(false); // PC는 바로 저장
    }
  };

  return (
    <div style={cardStyle}>
      {/* ✅ [수정] 헤더 클릭 시 열림/닫힘 토글 */}
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        style={{ 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
            cursor: 'pointer', paddingBottom: isOpen ? 20 : 0, 
            borderBottom: isOpen ? '2px solid #eee' : 'none' 
        }}
      >
        <h3 style={{ margin: 0, color: '#333', fontSize: '18px' }}>💼 퇴직금 계산기</h3>
        <span style={{ fontSize: '14px', color: '#666' }}>{isOpen ? '▲ 접기' : '▼ 펼치기'}</span>
      </div>
      
      {/* ✅ [수정] 열렸을 때만 내용 표시 */}
      {isOpen && (
        <div style={{ marginTop: 20, animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 20 }}>
                <div>
                    <label style={labelStyle}>직원 선택</label>
                    <div onClick={() => setIsEmpSelectorOpen(true)} style={{ ...inputStyle, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{selectedEmpName || '직원을 선택하세요'}</span>
                        <span style={{ fontSize: 12, color: '#999' }}>▼</span>
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={labelStyle}>퇴사일 (마지막 근무일)</label>
                    <DateSelector value={resignDate} onChange={setResignDate} />
                </div>
            </div>

            <div style={{ background: '#f9f9f9', padding: '16px', borderRadius: 8, marginBottom: 20, fontSize: 14, color: '#555' }}>
                <div style={{ marginBottom: 8 }}>
                    📅 재직 기간: 
                    <span className="date-range-text" style={{ fontWeight: 'bold', color: '#333', marginLeft: 4 }}>
                        {hireDate || '-'} ~ {resignDate}
                    </span>
                </div>
                <div>
                    ⏳ 총 재직일수: <strong style={{ color: totalDays >= 365 ? 'green' : 'crimson', fontSize: 16 }}>{totalDays}일</strong>
                </div>
            </div>

            <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>퇴사 전 3개월 급여 총액 {loadingAuto && '(계산 중...)'}</label>
                <input 
                    type="text" 
                    value={pay3MonthsStr} 
                    onChange={e => handlePayChange(e.target.value)} 
                    placeholder="0" 
                    style={inputStyle} 
                    inputMode="numeric"
                />
            </div>

            <button onClick={calculateResult} style={btnStyle}>퇴직금 계산하기</button>

            {/* ✅ [신규] 결과 표시 및 캡처 영역 */}
            {severancePay > 0 && (
                <div style={{ marginTop: 24 }}>
                    <div ref={resultRef} style={{ padding: 24, borderRadius: 12, backgroundColor: '#f0f8ff', border: '1px solid #b3d7ff' }}>
                        <h4 style={{ margin: '0 0 16px 0', textAlign: 'center', color: '#0056b3' }}>퇴직금 계산 결과</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, color: '#555' }}>
                            <span>직원명</span>
                            <span style={{ fontWeight: 'bold' }}>{selectedEmpName}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, color: '#555' }}>
                            <span>재직 기간</span>
                            <span>{totalDays}일</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 14, color: '#555' }}>
                            <span>평균 일급</span>
                            <span>{avgWage.toLocaleString()}원</span>
                        </div>
                        <hr style={{ border: 'none', borderTop: '1px dashed #b3d7ff', margin: '10px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 16, fontWeight: 'bold', color: '#333' }}>예상 퇴직금</span>
                            <span style={{ fontSize: 24, fontWeight: 'bold', color: '#0056b3' }}>{severancePay.toLocaleString()}원</span>
                        </div>
                        <div style={{ textAlign: 'center', fontSize: 11, color: '#999', marginTop: 16 }}>* 실제 지급액은 세금 공제 등에 따라 달라질 수 있습니다.</div>
                    </div>
                    
                    <button onClick={handleDownloadClick} style={{ ...btnStyle, marginTop: 12, background: '#fff', border: '1px solid #ccc', color: '#333' }}>
                        📥 결과 저장 / 공유
                    </button>
                </div>
            )}
        </div>
      )}

      {/* 직원 선택 모달 */}
      {isEmpSelectorOpen && (
        <div style={modalOverlayStyle} onClick={() => setIsEmpSelectorOpen(false)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <h4 style={{ margin: '0 0 16px 0', textAlign: 'center', color:'#333' }}>직원 선택</h4>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {employees.map(emp => (
                <div 
                  key={emp.id} 
                  onClick={() => handleSelectEmployee(emp.id)}
                  style={{ 
                    padding: '12px', borderBottom: '1px solid #eee', cursor: 'pointer', 
                    color: selectedEmpId === emp.id ? 'dodgerblue' : '#333',
                    fontWeight: selectedEmpId === emp.id ? 'bold' : 'normal',
                    backgroundColor: selectedEmpId === emp.id ? '#f0f9ff' : 'transparent'
                  }}
                >
                  {emp.name}
                </div>
              ))}
            </div>
            <button onClick={() => setIsEmpSelectorOpen(false)} style={{ width: '100%', padding: '12px', marginTop: '16px', background: '#f5f5f5', border: 'none', borderRadius: '8px', fontWeight: 'bold', color: '#666' }}>닫기</button>
          </div>
        </div>
      )}

      {/* 모바일 공유 선택 팝업 */}
      {showMobileChoice && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setShowMobileChoice(false)}>
            <div style={{ width: '100%', background: '#fff', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', padding: '24px 20px 40px 20px', animation: 'slideUp 0.3s ease-out' }} onClick={e => e.stopPropagation()}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', textAlign: 'center', color: '#333', fontWeight: 'bold' }}>결과를 어떻게 할까요?</h3>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => handleCapture(false)} style={{ flex: 1, padding: '16px', borderRadius: '12px', border: '1px solid #ddd', background: '#fff', fontSize: '15px', fontWeight: 'bold', color: '#333', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        <span style={{fontSize: '24px'}}>📥</span> 갤러리에 저장
                    </button>
                    <button onClick={() => handleCapture(true)} style={{ flex: 1, padding: '16px', borderRadius: '12px', border: 'none', background: '#FEE500', fontSize: '15px', fontWeight: 'bold', color: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        <span style={{fontSize: '24px'}}>💬</span> 카톡/공유하기
                    </button>
                </div>
            </div>
            <style jsx>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
        </div>
      )}
    </div>
  );
}

// 스타일
const cardStyle = { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #ddd', marginBottom: '24px', transition: 'all 0.3s' };
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#555' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', boxSizing: 'border-box' as const, backgroundColor: '#fff', color: '#333' };
const btnStyle = { width: '100%', padding: '12px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' };

const modalOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' };
const modalContentStyle: React.CSSProperties = { width: '80%', maxWidth: '320px', backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' };