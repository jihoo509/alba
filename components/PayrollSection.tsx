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

  // ✅ 연도와 월 상태 관리
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

  // ✅ 월 이동 핸들러
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

    // 월 전체 기간 계산
    const safeStart = `${year}-${String(month).padStart(2, '0')}-01`;
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
      {/* ✅ CSS 스타일: PC와 모바일을 완벽하게 분리합니다 */}
      <style jsx>{`
        /* --- 기본 (PC 스타일) --- */
        .pc-header { display: flex; }
        .mobile-header { display: none; }
        .desktop-cell { display: table-cell; }
        
        /* 모바일에서는 숨김 */
        .mobile-cell { display: none; } 

        /* --- 모바일 화면 (768px 이하) --- */
        @media (max-width: 768px) {
          /* PC 헤더 숨기고 모바일 헤더 보임 */
          .pc-header { display: none !important; }
          .mobile-header { display: flex !important; }

          /* 데스크탑 컬럼 숨기고 모바일 컬럼 보임 */
          .desktop-cell { display: none !important; }
          .mobile-cell { display: table-cell !important; }

          /* 테이블 스타일 다이어트 */
          .col-name, .col-total, .col-settings, .col-download {
             padding: 8px 2px !important; 
             font-size: 13px !important;
          }
          
          /* ✅ 비율 강제 적용 (합 100%) */
          .col-name { width: 25% !important; }
          .col-total { width: 35% !important; }
          .col-settings { width: 20% !important; }
          .col-download { width: 20% !important; }

          /* 버튼 크기 축소 */
          .compact-btn {
            padding: 6px 4px !important;
            font-size: 11px !important;
            min-width: unset !important;
            width: 100%;
          }
        }
      `}</style>

      <div style={cardStyle}>
        <StoreSettings storeId={currentStoreId} onUpdate={loadAndCalculate} />
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
          {/* 상단 버튼 (공통) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 20, margin: 0, color: '#333', fontWeight: 'bold' }}>💰 월 급여 대장</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleDownloadExcel} style={{ ...btnStyle, background: '#27ae60', color: '#fff', border: 'none', fontSize: 13 }}>
                <span className="mobile-text">엑셀</span><span className="desktop-text">엑셀 다운로드</span>
              </button>
              <button onClick={handleDownloadAllStubs} disabled={isDownloading} style={{ ...btnStyle, background: '#333', color: '#fff', border: 'none', fontSize: 13 }}>
                {isDownloading ? `생성 중 ${downloadProgress}%` : (
                  <>
                    <span className="mobile-text">전체다운</span>
                    <span className="desktop-text">명세서 전체 다운(ZIP)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ✅ [PC용 헤더] 기존 회색 박스 디자인 (모바일에선 숨겨짐) */}
          <div className="pc-header" style={{ justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f5f5f5', padding: '12px', borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={handlePrevMonth} style={navBtnStyle}>◀</button>
              <span style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>
                {year}년 {month}월
              </span>
              <button onClick={handleNextMonth} style={navBtnStyle}>▶</button>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#666' }}>총 지급액</div>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: 'dodgerblue' }}>{totalMonthlyCost.toLocaleString()}원</div>
            </div>
          </div>

          {/* ✅ [모바일용 헤더] 심플한 흰색 디자인 (PC에선 숨겨짐) */}
          <div className="mobile-header" style={{ justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '15px', borderRadius: 12, border: '1px solid #eee' }}>
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

        {loading ? <p style={{ color: '#666', textAlign: 'center' }}>계산 중...</p> : (
          <div className="table-wrapper" style={{ boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '100%' }}>
              <thead>
                <tr style={{ background: '#f5f5f5', color: '#555', fontSize: '13px', borderBottom: '1px solid #ddd', height: 40 }}>
                  
                  {/* 이름 (공통 - 모바일 25%) */}
                  <th className="col-name" style={{ ...thStyle, width: 70, position: 'sticky', left: 0, zIndex: 10, background: '#f5f5f5' }}>이름</th>
                  
                  {/* 총지급 (공통 - 모바일 35%) */}
                  <th className="col-total" style={{ ...thStyle, width: 90 }}>총 지급</th>
                  
                  {/* 모바일 전용 컬럼 (PC 숨김 - 모바일 20%) */}
                  <th className="mobile-cell col-settings" style={{ ...thStyle, width: 60, color: '#e67e22' }}>설정</th>
                  <th className="mobile-cell col-download" style={{ ...thStyle, width: 60 }}>명세서</th>
                  
                  {/* PC 전용 컬럼 (모바일 숨김) */}
                  <th className="desktop-cell" style={{ ...thStyle, width: 90, color: 'dodgerblue' }}>세후 지급</th>
                  <th className="desktop-cell" style={{ ...thStyle, width: 80 }}>기본급</th>
                  <th className="desktop-cell" style={{ ...thStyle, width: 70 }}>주휴</th>
                  <th className="desktop-cell" style={{ ...thStyle, width: 70 }}>야간</th>
                  <th className="desktop-cell" style={{ ...thStyle, width: 70 }}>연장</th>
                  <th className="desktop-cell" style={{ ...thStyle, width: 70 }}>휴일</th>
                  <th className="desktop-cell" style={{ ...thStyle, width: 70 }}>소득세</th>
                  <th className="desktop-cell" style={{ ...thStyle, width: 70 }}>4대보험</th>
                  <th className="desktop-cell" style={{ ...thStyle, width: 80 }}>보기</th>
                </tr>
              </thead>
              <tbody>
                {payrollData.map(p => (
                  <tr key={p.empId} style={{ borderBottom: '1px solid #eee', fontSize: '13px', backgroundColor: '#fff', height: 46 }}>
                    <td className="col-name" style={{ ...tdStyle, fontWeight: 'bold', position: 'sticky', left: 0, background: '#fff', zIndex: 5 }}>{p.name}</td>
                    <td className="col-total" style={{ ...tdStyle, fontWeight: 'bold' }}>{p.totalPay.toLocaleString()}</td>
                    
                    {/* 모바일 버튼 */}
                    <td className="mobile-cell col-settings" style={tdStyle}>
                      <button onClick={() => setModalState({ isOpen: true, data: p, mode: 'settings' })} className="compact-btn" style={{ ...detailBtnStyle, borderColor: '#e67e22', color: '#e67e22' }}>설정</button>
                    </td>
                    <td className="mobile-cell col-download" style={tdStyle}>
                      <button onClick={() => setModalState({ isOpen: true, data: p, mode: 'download' })} className="compact-btn" style={detailBtnStyle}>다운</button>
                    </td>

                    {/* PC 데이터 */}
                    <td className="desktop-cell" style={{ ...tdStyle, color: 'dodgerblue', fontWeight: 'bold' }}>{p.finalPay.toLocaleString()}</td>
                    <td className="desktop-cell" style={tdStyle}>{p.basePay.toLocaleString()}</td>
                    <td className="desktop-cell" style={tdStyle}>{p.weeklyHolidayPay.toLocaleString()}</td>
                    <td className="desktop-cell" style={tdStyle}>{p.nightPay.toLocaleString()}</td>
                    <td className="desktop-cell" style={tdStyle}>{p.overtimePay.toLocaleString()}</td>
                    <td className="desktop-cell" style={tdStyle}>{p.holidayWorkPay.toLocaleString()}</td>
                    <td className="desktop-cell" style={tdStyle}>{p.taxDetails.incomeTax.toLocaleString()}</td>
                    <td className="desktop-cell" style={tdStyle}>{(p.taxDetails.pension + p.taxDetails.health + p.taxDetails.employment).toLocaleString()}</td>
                    <td className="desktop-cell" style={tdStyle}>
                      <button onClick={() => setModalState({ isOpen: true, data: p, mode: 'full' })} style={detailBtnStyle}>보기</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 숨겨진 명세서 (다운로드용) */}
      <div style={{ position: 'fixed', top: '-10000px', left: '-10000px' }}>
        {payrollData.map(p => (
          <div key={p.empId} id={`hidden-stub-${p.empId}`} style={{ width: '800px', backgroundColor: '#fff', padding: '40px', boxSizing: 'border-box', fontFamily: 'sans-serif' }}>
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
                  <th style={thStyle}>날짜</th><th style={thStyle}>시간</th><th style={thStyle}>근무</th>
                  <th style={thStyle}>기본급</th><th style={thStyle}>야간</th><th style={thStyle}>연장</th><th style={{ ...thStyle, color: 'red' }}>휴일</th>
                </tr>
              </thead>
              <tbody>
                {(p.ledger || []).map((row: any, idx: number) => {
                  if (row.type === 'WEEKLY') {
                    return (
                      <tr key={idx} style={{ backgroundColor: '#fff8c4', borderBottom: '1px solid #ddd', height: 30 }}>
                        <td colSpan={3} style={{ ...tdStyle, textAlign: 'center', fontWeight: 'bold', color: '#d68910' }}>⭐ {row.dayLabel} ({row.note})</td>
                        <td style={tdStyle}>-</td>
                        <td colSpan={3} style={{ ...tdStyle, textAlign: 'right', fontWeight: 'bold', color: '#d68910' }}>{(row.weeklyPay || 0).toLocaleString()}</td>
                      </tr>
                    );
                  }
                  if (row.type === 'WORK') {
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #ddd', height: 30 }}>
                        <td style={tdStyle}>{row.date.slice(5)} ({row.dayLabel})</td>
                        <td style={tdStyle}>{row.timeRange}</td>
                        <td style={tdStyle}>{row.hours}h</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{row.basePay.toLocaleString()}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{row.nightPay.toLocaleString()}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{row.overtimePay.toLocaleString()}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', color: 'red' }}>{row.holidayWorkPay.toLocaleString()}</td>
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
              <div style={rowStyle}><span>+ 야간수당</span> <span>{p.nightPay.toLocaleString()}원</span></div>
              <div style={rowStyle}><span>+ 연장수당</span> <span>{p.overtimePay.toLocaleString()}원</span></div>
              <div style={rowStyle}><span style={{ color: 'red' }}>+ 휴일근로수당</span> <span style={{ color: 'red' }}>{p.holidayWorkPay.toLocaleString()}원</span></div>
              <hr style={{ margin: '12px 0', borderTop: '1px dashed #aaa' }} />
              <div style={rowStyle}><span style={{ fontWeight: 'bold' }}>세전 총액</span> <span style={{ fontWeight: 'bold' }}>{p.totalPay.toLocaleString()}원</span></div>
              <div style={{ ...rowStyle, color: 'red' }}>
                <span>- 공제 (세금 등)</span>
                <span>{(p.taxDetails.incomeTax + p.taxDetails.localTax + p.taxDetails.pension + p.taxDetails.health + p.taxDetails.care + p.taxDetails.employment).toLocaleString()}원</span>
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

const cardStyle = { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #ddd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '24px' };
const btnStyle = { padding: '8px 12px', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' };
const navBtnStyle = { background: '#fff', border: '1px solid #ccc', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' };
const navIconBtnStyle = { background: 'none', border: '1px solid #ddd', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#555', fontSize: '12px' };

const thStyle = { padding: '8px', textAlign: 'center' as const, fontWeight: 'bold', borderRight: '1px solid #ddd' };
const tdStyle = { padding: '8px', textAlign: 'center' as const, borderRight: '1px solid #ddd', whiteSpace: 'nowrap' as const };
const detailBtnStyle = { padding: '4px 10px', fontSize: 12, cursor: 'pointer', borderRadius: 4, border: '1px solid #ccc', background: '#fff', color: '#333' };
const rowStyle = { display: 'flex', justifyContent: 'space-between', marginBottom: 6 };