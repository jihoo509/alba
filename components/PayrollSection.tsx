'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import StoreSettings from './StoreSettings';
import { calculateMonthlyPayroll } from '@/lib/payroll';
import * as XLSX from 'xlsx';
import PayStubModal from './PayStubModal';
import SeveranceCalculator from './SeveranceCalculator';
import { format } from 'date-fns';
import html2canvas from 'html2canvas'; 
import JSZip from 'jszip'; 
import { saveAs } from 'file-saver'; 

type Props = {
  currentStoreId: string;
};

export default function PayrollSection({ currentStoreId }: Props) {
  const supabase = createSupabaseBrowserClient();
  const today = new Date();
  
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const [payrollData, setPayrollData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  
  const [modalState, setModalState] = useState<{ isOpen: boolean; data: any; mode: 'full' | 'settings' | 'download' }>({
    isOpen: false, data: null, mode: 'full'
  });

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const handlePrevMonth = () => {
    if (month === 1) {
      setYear(y => y - 1);
      setMonth(12);
    } else {
      setMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setYear(y => y + 1);
      setMonth(1);
    } else {
      setMonth(m => m + 1);
    }
  };

  const loadAndCalculate = useCallback(async () => {
    if (!currentStoreId) return;
    setLoading(true);
    
    const { data: storeData } = await supabase.from('stores').select('*').eq('id', currentStoreId).single();
    const { data: empData } = await supabase.from('employees').select('*').eq('store_id', currentStoreId);
    if (empData) setEmployees(empData);
    const { data: overData } = await supabase.from('employee_settings').select('*');
    
    const safeStart = `${year}-${String(month).padStart(2,'0')}-01`;
    const safeEnd = format(new Date(year, month, 0), 'yyyy-MM-dd');

    const { data: schedules } = await supabase.from('schedules').select('*').eq('store_id', currentStoreId).gte('date', safeStart).lte('date', safeEnd);

    if (empData && schedules && storeData) {
      const targetMonthStart = new Date(year, month - 1, 1);
      const targetMonthEnd = new Date(year, month, 0);
      const targetMonthStartStr = format(targetMonthStart, 'yyyy-MM-dd');
      const targetMonthEndStr = format(targetMonthEnd, 'yyyy-MM-dd');

      const activeEmps = empData.filter((emp: any) => {
        const joined = !emp.hire_date || emp.hire_date <= targetMonthEndStr;
        const notLeft = !emp.end_date || emp.end_date >= targetMonthStartStr;
        return joined && notLeft;
      });

      const result = calculateMonthlyPayroll(year, month, activeEmps, schedules, storeData, overData || []);
      setPayrollData(result);
    }
    setLoading(false);
  }, [currentStoreId, year, month, supabase]);

  useEffect(() => { loadAndCalculate(); }, [loadAndCalculate]);

  const handleSaveOverride = async (settings: any) => {
    const { error } = await supabase.from('employee_settings').upsert(settings, { onConflict: 'employee_id' });
    if (!error) await loadAndCalculate();
  };

  const totalMonthlyCost = useMemo(() => payrollData.reduce((acc, curr) => acc + curr.totalPay, 0), [payrollData]);

  // 엑셀 다운로드
  const handleDownloadExcel = () => {
    if (payrollData.length === 0) return;
    const fmt = (num: number) => num ? num.toLocaleString() : '0';
    const excelRows = payrollData.map(p => {
        const empInfo = employees.find(e => e.id === p.empId);
        return {
            '이름': p.name,
            '전화번호': empInfo?.phone_number || '-',
            '은행': empInfo?.bank_name || '-',
            '계좌번호': empInfo?.account_number || '-',
            '총 지급 급여': fmt(p.totalPay),
            '세후 지급 급여': fmt(p.finalPay),
            '소득세': fmt(p.taxDetails.incomeTax),
            '지방소득세': fmt(p.taxDetails.localTax),
            '4대보험 합계': fmt(p.taxDetails.pension + p.taxDetails.health + p.taxDetails.employment + p.taxDetails.care),
        };
    });
    const ws = XLSX.utils.json_to_sheet(excelRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "급여대장");
    XLSX.writeFile(wb, `${year}년_${month}월_급여대장.xlsx`);
  };

  // 전체 다운로드
  const handleDownloadAllStubs = async () => {
    if (payrollData.length === 0) return;
    if (!confirm(`${payrollData.length}명의 명세서를 압축(ZIP)하여 다운로드합니다.`)) return;
    setIsDownloading(true);
    setDownloadProgress(0);
    const zip = new JSZip();
    try {
      for (let i = 0; i < payrollData.length; i++) {
        const p = payrollData[i];
        const elementId = `hidden-stub-${p.empId}`;
        const element = document.getElementById(elementId);
        if (element) {
          const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
          const dataUrl = canvas.toDataURL('image/png');
          const base64Data = dataUrl.replace(/^data:image\/(png|jpg);base64,/, "");
          zip.file(`${p.name}_${month}월_명세서.png`, base64Data, { base64: true });
        }
        setDownloadProgress(Math.round(((i + 1) / payrollData.length) * 100));
        await new Promise(r => setTimeout(r, 50));
      }
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${year}년_${month}월_급여명세서_모음.zip`);
      alert('다운로드 완료!');
    } catch (e) {
      console.error(e);
      alert('오류 발생');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      {/* ✅ CSS 스타일 추가: PC와 모바일의 스타일을 확실하게 분리합니다 */}
      <style jsx>{`
        /* --- PC 기본 스타일 (768px 이상) --- */
        .header-date-box {
          display: flex; justify-content: space-between; align-items: center;
          background-color: #f5f5f5; padding: 12px; border-radius: 8px;
        }
        .header-date-text { font-size: 18px; font-weight: bold; color: #333; }
        .header-total-label { font-size: 12px; color: #666; }
        .header-total-amount { font-size: 18px; font-weight: bold; color: dodgerblue; }
        .table-th { padding: 12px 8px; font-size: 13px; }
        .table-td { padding: 12px 8px; font-size: 13px; }
        .btn-action { padding: 6px 12px; font-size: 12px; } /* PC 버튼 */
        
        /* 모바일에서는 숨길 요소 */
        .mobile-only { display: none !important; }

        /* --- 모바일 스타일 (768px 이하) --- */
        @media (max-width: 768px) {
          /* PC용 헤더는 숨김 */
          .pc-only { display: none !important; }
          .mobile-only { display: flex !important; }
          .desktop-cell { display: none !important; }

          /* 모바일용 헤더 (심플 디자인) */
          .header-date-box-mobile {
            display: flex; justify-content: space-between; align-items: center;
            background-color: #f8f9fa; padding: 15px; border-radius: 12px; border: 1px solid #eee;
          }

          /* 테이블 다이어트 (패딩 축소 & 너비 강제) */
          .table-th { padding: 8px 2px !important; font-size: 12px !important; }
          .table-td { padding: 8px 2px !important; font-size: 13px !important; }
          
          /* 컬럼 비율 강제 (이름 25, 총지급 35, 설정 20, 명세서 20) */
          .col-name { width: 25% !important; }
          .col-total { width: 35% !important; }
          .col-settings { width: 20% !important; }
          .col-download { width: 20% !important; }
          
          /* 모바일 버튼 축소 */
          .btn-action { padding: 6px 2px !important; font-size: 11px !important; min-width: 36px; width: 100%; }
        }
      `}</style>
      
      <div style={cardStyle}>
          <StoreSettings storeId={currentStoreId} onUpdate={loadAndCalculate} />
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
          {/* 상단 제목 및 전체 버튼 (공통) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <h2 style={{ fontSize: 18, margin: 0, color: '#333', fontWeight: 'bold' }}>💰 월 급여 대장</h2>
             <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={handleDownloadExcel} style={{ ...btnStyle, background: '#27ae60', fontSize: 12 }}>
                  엑셀
                </button>
                <button onClick={handleDownloadAllStubs} disabled={isDownloading} style={{ ...btnStyle, background: '#333', fontSize: 12 }}>
                  {isDownloading ? `${downloadProgress}%` : '전체다운'}
                </button>
             </div>
          </div>
          
          {/* ✅ [PC용] 원래 쓰시던 넉넉한 디자인 */}
          <div className="pc-only header-date-box">
             <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
               <button onClick={handlePrevMonth} style={navBtnStyle}>◀</button>
               <span className="header-date-text">{year}년 {month}월</span>
               <button onClick={handleNextMonth} style={navBtnStyle}>▶</button>
             </div>
             <div style={{ textAlign: 'right' }}>
               <div className="header-total-label">총 지급액</div>
               <div className="header-total-amount">{totalMonthlyCost.toLocaleString()}원</div>
             </div>
          </div>

          {/* ✅ [모바일용] 아까 만족하신 심플 디자인 */}
          <div className="mobile-only header-date-box-mobile">
             <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
               <button onClick={handlePrevMonth} style={navIconBtnStyle}>◀</button>
               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                 <span style={{ fontSize: 18, fontWeight: '800', color: '#333', lineHeight: '1' }}>
                   {year}.{String(month).padStart(2, '0')}
                 </span>
               </div>
               <button onClick={handleNextMonth} style={navIconBtnStyle}>▶</button>
             </div>
             <div style={{ textAlign: 'right' }}>
               <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>총 지급액</div>
               <div style={{ fontSize: 18, fontWeight: 'bold', color: 'dodgerblue', letterSpacing: '-0.5px' }}>
                 {totalMonthlyCost.toLocaleString()}원
               </div>
             </div>
          </div>

        </div>

        {loading ? <p style={{color:'#666', textAlign:'center', padding: 20}}>계산 중...</p> : (
          <div className="table-wrapper" style={{ boxShadow: '0 0 0 1px #eee', borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa', color: '#555', borderBottom: '1px solid #eee', height: 40 }}>
                  
                  {/* CSS 클래스로 너비 제어 (모바일: 25/35/20/20, PC: 자동) */}
                  <th className="table-th col-name" style={thBaseStyle}>이름</th>
                  <th className="table-th col-total" style={thBaseStyle}>총 지급</th>
                  <th className="table-th col-settings mobile-cell" style={{ ...thBaseStyle, color: '#e67e22' }}>설정</th>
                  <th className="table-th col-download mobile-cell" style={thBaseStyle}>명세서</th>
                  
                  {/* PC 전용 컬럼들 (모바일에서 숨김) */}
                  <th className="table-th desktop-cell" style={{ ...thBaseStyle, color: 'dodgerblue' }}>세후 지급</th>
                  <th className="table-th desktop-cell" style={thBaseStyle}>기본급</th>
                  <th className="table-th desktop-cell" style={thBaseStyle}>수당합계</th>
                  <th className="table-th desktop-cell" style={thBaseStyle}>공제합계</th>
                  <th className="table-th desktop-cell" style={thBaseStyle}>상세</th>
                </tr>
              </thead>
              <tbody>
                {payrollData.map(p => (
                  <tr key={p.empId} style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: '#fff', height: 50 }}>
                    <td className="table-td" style={{ ...tdBaseStyle, fontWeight: 'bold' }}>{p.name}</td>
                    <td className="table-td" style={{ ...tdBaseStyle, fontWeight: 'bold' }}>{p.totalPay.toLocaleString()}</td>
                    
                    {/* 설정 버튼 */}
                    <td className="table-td mobile-cell" style={tdBaseStyle}>
                      <button onClick={() => setModalState({ isOpen: true, data: p, mode: 'settings' })} className="btn-action" style={compactBtnStyle}>
                        설정
                      </button>
                    </td>
                    
                    {/* 다운로드 버튼 */}
                    <td className="table-td mobile-cell" style={tdBaseStyle}>
                       <button onClick={() => setModalState({ isOpen: true, data: p, mode: 'download' })} className="btn-action" style={{...compactBtnStyle, borderColor: '#333', color: '#333'}}>
                        다운
                       </button>
                    </td>

                    {/* PC 전용 데이터 */}
                    <td className="table-td desktop-cell" style={{ ...tdBaseStyle, color: 'dodgerblue', fontWeight: 'bold' }}>{p.finalPay.toLocaleString()}</td>
                    <td className="table-td desktop-cell" style={tdBaseStyle}>{p.basePay.toLocaleString()}</td>
                    <td className="table-td desktop-cell" style={tdBaseStyle}>{(p.weeklyHolidayPay + p.nightPay + p.overtimePay + p.holidayWorkPay).toLocaleString()}</td>
                    <td className="table-td desktop-cell" style={tdBaseStyle}>{(p.taxDetails.incomeTax + p.taxDetails.localTax + p.taxDetails.pension + p.taxDetails.health).toLocaleString()}</td>
                    <td className="table-td desktop-cell" style={tdBaseStyle}>
                      <button onClick={() => setModalState({ isOpen: true, data: p, mode: 'full' })} style={detailBtnStyle}>보기</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 히든 영역 (이미지 생성용) - 변경 없음 */}
      <div style={{ position: 'fixed', top: '-10000px', left: '-10000px' }}>
        {payrollData.map(p => (
           <div key={p.empId} id={`hidden-stub-${p.empId}`} style={{ width: '800px', backgroundColor: '#fff', padding: '40px' }}>
               <h2 style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 15, marginBottom: 25, fontSize: 24 }}>
                 {year}년 {month}월 급여 명세서
               </h2>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, fontSize: 16 }}>
                 <span>성명: <strong>{p.name}</strong></span>
                 <span>지급일: {year}.{month}.{new Date().getDate()}</span>
               </div>
               <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 25, border: '1px solid #ddd' }}>
                 <thead>
                    <tr style={{ backgroundColor: '#f0f0f0', borderBottom: '1px solid #000', height: 30 }}>
                       <th style={printThStyle}>날짜</th><th style={printThStyle}>시간</th><th style={printThStyle}>근무</th>
                       <th style={printThStyle}>기본급</th><th style={printThStyle}>야간</th><th style={printThStyle}>연장</th><th style={{...printThStyle, color:'red'}}>휴일</th>
                    </tr>
                 </thead>
                 <tbody>
                    {(p.ledger || []).map((row: any, idx: number) => {
                       if (row.type === 'WEEKLY') {
                          return (
                             <tr key={idx} style={{ backgroundColor: '#fff8c4', borderBottom: '1px solid #ddd', height: 30 }}>
                                <td colSpan={3} style={{...printTdStyle, textAlign:'center', fontWeight:'bold', color:'#d68910'}}>⭐ {row.dayLabel} ({row.note})</td>
                                <td style={printTdStyle}>-</td>
                                <td colSpan={3} style={{...printTdStyle, textAlign:'right', fontWeight:'bold', color:'#d68910'}}>{(row.weeklyPay || 0).toLocaleString()}</td>
                             </tr>
                          );
                       }
                       if (row.type === 'WORK') {
                           return (
                             <tr key={idx} style={{ borderBottom: '1px solid #ddd', height: 30 }}>
                                <td style={printTdStyle}>{row.date.slice(5)} ({row.dayLabel})</td>
                                <td style={printTdStyle}>{row.timeRange}</td>
                                <td style={printTdStyle}>{row.hours}h</td>
                                <td style={{...printTdStyle, textAlign:'right'}}>{row.basePay.toLocaleString()}</td>
                                <td style={{...printTdStyle, textAlign:'right'}}>{row.nightPay.toLocaleString()}</td>
                                <td style={{...printTdStyle, textAlign:'right'}}>{row.overtimePay.toLocaleString()}</td>
                                <td style={{...printTdStyle, textAlign:'right', color:'red'}}>{row.holidayWorkPay.toLocaleString()}</td>
                             </tr>
                           );
                       }
                       return null;
                    })}
                 </tbody>
               </table>
               <div style={{ border: '2px solid #000', padding: 20, borderRadius: 4 }}>
                   <div style={rowStyle}><span>기본급</span> <span>{p.basePay.toLocaleString()}원</span></div>
                   <div style={rowStyle}><span>+ 주휴수당</span> <span>{p.weeklyHolidayPay.toLocaleString()}원</span></div>
                   <div style={rowStyle}><span>+ 수당합계</span> <span>{(p.nightPay + p.overtimePay + p.holidayWorkPay).toLocaleString()}원</span></div>
                   <hr style={{ margin: '12px 0', borderTop: '1px dashed #aaa' }} />
                   <div style={rowStyle}><span style={{fontWeight:'bold'}}>세전 총액</span> <span style={{fontWeight:'bold'}}>{p.totalPay.toLocaleString()}원</span></div>
                   <div style={{ ...rowStyle, color: 'red' }}>
                     <span>- 공제 합계</span> 
                     <span>{(p.taxDetails.incomeTax + p.taxDetails.localTax + p.taxDetails.pension + p.taxDetails.health).toLocaleString()}원</span>
                   </div>
                   <hr style={{ margin: '12px 0', borderTop: '2px solid #000' }} />
                   <div style={{ ...rowStyle, fontSize: 20, fontWeight: 'bold', color: 'blue', marginTop: 10 }}>
                     <span>실수령액</span> <span>{p.finalPay.toLocaleString()}원</span>
                   </div>
               </div>
           </div>
        ))}
      </div>

      <SeveranceCalculator currentStoreId={currentStoreId} employees={employees} />

      <PayStubModal 
        isOpen={modalState.isOpen} 
        onClose={() => setModalState({ ...modalState, isOpen: false })} 
        data={modalState.data} 
        year={year} month={month}
        onSave={handleSaveOverride}
        mode={modalState.mode} 
      />
    </div>
  );
}

// 스타일 정의
const cardStyle = { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #ddd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '24px' };
const btnStyle = { padding: '8px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', color: '#fff', border: 'none' };
const navBtnStyle = { background: '#fff', border: '1px solid #ccc', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' };
const navIconBtnStyle = { background: 'none', border: '1px solid #ddd', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#555', fontSize: '12px' };

// 테이블 기본 스타일 (padding은 CSS에서 덮어씌움)
const thBaseStyle = { textAlign: 'center' as const, fontWeight: 'bold', borderRight: '1px solid #f0f0f0', whiteSpace: 'nowrap' as const };
const tdBaseStyle = { textAlign: 'center' as const, borderRight: '1px solid #f0f0f0', whiteSpace: 'nowrap' as const };

// 모바일 버튼 스타일
const compactBtnStyle = { 
  cursor: 'pointer', borderRadius: 4, border: '1px solid #e67e22', background: '#fff', color: '#e67e22' 
};

// PC 상세 버튼
const detailBtnStyle = { padding: '4px 10px', fontSize: 12, cursor: 'pointer', borderRadius: 4, border: '1px solid #ccc', background: '#fff', color: '#333' };

// 프린트용 스타일
const printThStyle = { padding: '8px', textAlign: 'center' as const, fontWeight: 'bold', borderRight: '1px solid #ddd' };
const printTdStyle = { padding: '8px', textAlign: 'center' as const, borderRight: '1px solid #ddd', whiteSpace: 'nowrap' as const };
const rowStyle = { display: 'flex', justifyContent: 'space-between', marginBottom: 6 };