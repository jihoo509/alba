'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import StoreSettings from './StoreSettings';
import { calculateMonthlyPayroll, calculateTaxAmounts } from '@/lib/payroll';
import * as XLSX from 'xlsx-js-style';
import PayStubModal, { PayStubPaper } from './PayStubModal';
import PayrollEditModal from './PayrollEditModal';
import SeveranceCalculator from './SeveranceCalculator';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

type Props = { currentStoreId: string; };

export default function PayrollSection({ currentStoreId }: Props) {
  const supabase = createSupabaseBrowserClient();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [payrollData, setPayrollData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);

  const [stubModalState, setStubModalState] = useState<{ isOpen: boolean; data: any; mode: 'full' | 'settings' | 'download' }>({
    isOpen: false, data: null, mode: 'full'
  });

  const [editModalState, setEditModalState] = useState<{ 
    isOpen: boolean; empId: number | null; name: string; originalPay: number; currentOverride: number | null; currentAdjustment: number; 
  }>({
    isOpen: false, empId: null, name: '', originalPay: 0, currentOverride: null, currentAdjustment: 0
  });

  const [isDownloading, setIsDownloading] = useState(false);

  const handlePrevMonth = () => { if (month === 1) { setYear(y => y - 1); setMonth(12); } else { setMonth(m => m - 1); } };
  const handleNextMonth = () => { if (month === 12) { setYear(y => y + 1); setMonth(1); } else { setMonth(m => m + 1); } };

  const loadAndCalculate = useCallback(async () => {
    if (!currentStoreId) return;
    setLoading(true);

    const { data: storeData } = await supabase.from('stores').select('*').eq('id', currentStoreId).single();
    const { data: empData } = await supabase.from('employees').select('*').eq('store_id', currentStoreId);
    if (empData) setEmployees(empData);
    
    const { data: overData } = await supabase.from('employee_settings').select('*');

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

      let result = calculateMonthlyPayroll(year, month, activeEmps, schedules, storeData, overData || []);

      result = result.map((item: any) => {
        const setting = overData ? overData.find((s: any) => s.employee_id === item.empId) : null;
        
        const override = setting?.monthly_override ? Number(setting.monthly_override) : null;
        const adjustment = setting?.monthly_adjustment ? Number(setting.monthly_adjustment) : 0;

        if (override === null && adjustment === 0) {
          return { ...item, basePay: item.totalPay, adjustment: 0, originalCalcPay: item.totalPay, isModified: false };
        }

        const originalPay = item.totalPay;
        const basePay = override !== null ? override : item.totalPay; 
        const newTotalPay = basePay + adjustment;
        
        const isFourIns = item.type && item.type.includes('four');
        const noTax = (setting?.no_tax_deduction !== null && setting?.no_tax_deduction !== undefined) 
                      ? setting.no_tax_deduction 
                      : (item.storeSettingsSnapshot?.no_tax_deduction || false);
        
        const newTax = calculateTaxAmounts(newTotalPay, isFourIns, noTax);
        const newFinalPay = newTotalPay - newTax.total;

        return { 
            ...item, 
            totalPay: newTotalPay, 
            finalPay: newFinalPay, 
            basePay: basePay, 
            adjustment: adjustment, 
            taxDetails: newTax, 
            originalCalcPay: originalPay, 
            isModified: true 
        };
      });
      setPayrollData(result);
    }
    setLoading(false);
  }, [currentStoreId, year, month, supabase]);

  useEffect(() => { loadAndCalculate(); }, [loadAndCalculate]);

  const handleSaveEdit = async (override: number | null, adjustment: number) => {
    if (!editModalState.empId) return;
    const updates = {
      employee_id: editModalState.empId,
      monthly_override: override,
      monthly_adjustment: adjustment,
    };
    const { error } = await supabase.from('employee_settings').upsert(updates, { onConflict: 'employee_id' });
    if (error) { alert('저장 오류: ' + error.message); } 
    else { 
        setEditModalState(prev => ({ ...prev, isOpen: false })); 
        await loadAndCalculate(); 
    }
  };

  const handleSaveStubSettings = async (settings: any) => {
    const { error } = await supabase.from('employee_settings').upsert(settings, { onConflict: 'employee_id' });
    if (error) {
        alert('설정 저장 실패: ' + error.message);
    } else {
        await loadAndCalculate(); 
    }
  };

  const handleResetStubSettings = async (employeeId: number) => {
    if (!confirm('개별 설정을 초기화하고 매장 기본 설정을 따르시겠습니까?\n(확정 급여 및 모든 개별 설정이 초기화됩니다)')) return;
    
    const { error } = await supabase.from('employee_settings').upsert({
        employee_id: employeeId,
        pay_weekly: null,
        pay_night: null,
        pay_overtime: null,
        pay_holiday: null,
        auto_deduct_break: null,
        no_tax_deduction: null,
        monthly_override: null, 
        monthly_adjustment: 0
    }, { onConflict: 'employee_id' });

    if (error) {
        alert('초기화 실패 (DB권한 확인): ' + error.message);
    } else {
        await loadAndCalculate(); 
    }
  };

  const totalMonthlyCost = useMemo(() => payrollData.reduce((acc, curr) => (acc + (curr.totalPay || 0)), 0), [payrollData]);

  const handleDownloadExcel = () => {
    if (payrollData.length === 0) return;
    const fmt = (num: number) => num ? num.toLocaleString() : '0';

    const excelRows = payrollData.map(p => {
      const empInfo = employees.find(e => e.id === p.empId);
      
      const incomeTax = p.taxDetails.incomeTax || 0;
      const localTax = p.taxDetails.localTax || 0;
      const pension = p.taxDetails.pension || 0;
      const health = p.taxDetails.health || 0;
      const employment = p.taxDetails.employment || 0;
      const care = p.taxDetails.care || 0;

      // ✅ [확인 완료] 모든 공제 항목 합산
      const totalDeductions = incomeTax + localTax + pension + health + employment + care;

      return {
        '이름': p.name, 
        '전화번호': empInfo?.phone_number || '-', 
        '은행': empInfo?.bank_name || '-', 
        '계좌번호': empInfo?.account_number || '-', 
        '생년월일': empInfo?.birth_date || '-', 
        
        '총 지급 급여': fmt(p.totalPay), 
        '세후 지급 급여': fmt(p.finalPay), 
        
        '총 공제액': fmt(totalDeductions), 

        '소득세': fmt(incomeTax), 
        '지방소득세': fmt(localTax), 
        '국민연금': fmt(pension), 
        '건강보험': fmt(health), 
        '고용보험': fmt(employment), 
        '장기요양보험': fmt(care),
      };
    });

    const ws = XLSX.utils.json_to_sheet(excelRows);

    // ✅ [수정 4] 엑셀 가운데 정렬 스타일 적용하기
    // 시트의 모든 셀(A1, B1 ...)을 돌면서 스타일 객체(.s)를 넣어줍니다.
    const range = XLSX.utils.decode_range(ws['!ref'] || "A1:A1");
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cell_address]) continue;
        
        // 스타일 객체 추가 (가운데 정렬)
        ws[cell_address].s = {
          alignment: { horizontal: "center", vertical: "center" },
          font: { name: "맑은 고딕" } // 폰트도 깔끔하게
        };
        
        // 헤더(첫 줄)는 굵게 처리하고 배경색 넣기 (옵션)
        if (R === 0) {
            ws[cell_address].s = {
                alignment: { horizontal: "center", vertical: "center" },
                font: { name: "맑은 고딕", bold: true },
                fill: { fgColor: { rgb: "EEEEEE" } }
            };
        }
      }
    }

    // 컬럼 너비 설정 (기존 코드)
    ws['!cols'] = [
      { wch: 10 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 12 }, 
      { wch: 12 }, { wch: 12 }, 
      { wch: 12 }, 
      { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 } 
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "급여대장");
    XLSX.writeFile(wb, `${year}년_${month}월_급여대장.xlsx`);
  };

  const handleDownloadAllStubs = async () => { 
    if (payrollData.length === 0) return;
    if (!confirm(`${payrollData.length}명의 명세서를 압축(ZIP)하여 다운로드합니다.`)) return;
    setIsDownloading(true);
    const zip = new JSZip();
    try {
      for (let i = 0; i < payrollData.length; i++) {
        const p = payrollData[i];
        const elementId = `hidden-stub-${p.empId}`;
        const element = document.getElementById(elementId);
        if (element) {
          const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
          const base64Data = canvas.toDataURL('image/png').replace(/^data:image\/(png|jpg);base64,/, "");
          zip.file(`${p.name}_${month}월_명세서.png`, base64Data, { base64: true });
        }
        await new Promise(r => setTimeout(r, 50)); 
      }
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${year}년_${month}월_급여명세서_모음.zip`);
    } catch (e) { console.error(e); alert('오류 발생'); } finally { setIsDownloading(false); }
  };

  const openEditModal = (p: any) => {
    setEditModalState({
      isOpen: true, empId: p.empId, name: p.name,
      originalPay: p.originalCalcPay || p.totalPay,
      currentOverride: p.basePay !== p.originalCalcPay && p.isModified ? p.basePay : null,
      currentAdjustment: p.adjustment || 0
    });
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      <style jsx>{`
        .header-container { display: flex; justify-content: space-between; align-items: center; background-color: #f8f9fa; padding: 16px; border-radius: 12px; border: 1px solid #eee; }
        @media (max-width: 768px) {
          .header-container { flex-direction: column; gap: 12px; text-align: center; padding: 20px 16px; }
          .header-total-area { width: 100%; text-align: right; border-top: 1px dashed #ddd; padding-top: 12px; margin-top: 4px; }
          .desktop-cell { display: none !important; }
          .mobile-cell { display: table-cell !important; }
          .col-name { width: 25% !important; }
          .col-total { width: 35% !important; }
          .col-settings { width: 20% !important; }
          .col-download { width: 20% !important; }
          .compact-btn { padding: 6px 4px !important; font-size: 11px !important; width: 100%; }
        }
        @media (min-width: 769px) { .mobile-cell { display: none !important; } .desktop-cell { display: table-cell !important; } .header-total-area { text-align: right; } }
      `}</style>

      <div style={cardStyle}>
        <StoreSettings storeId={currentStoreId} onUpdate={loadAndCalculate} />
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 20, margin: 0, color: '#333', fontWeight: 'bold' }}>💰 월 급여 대장</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleDownloadExcel} style={{ ...btnStyle, background: '#27ae60', color: '#fff', border: 'none', fontSize: 13 }}>
                <span className="mobile-text">엑셀</span><span className="desktop-text">엑셀 다운로드</span>
              </button>
              <button onClick={handleDownloadAllStubs} disabled={isDownloading} style={{ ...btnStyle, background: '#333', color: '#fff', border: 'none', fontSize: 13 }}>
                {isDownloading ? `생성 중...` : <><span className="mobile-text">전체다운</span><span className="desktop-text">명세서 전체 다운</span></>}
              </button>
            </div>
          </div>
          <div className="header-container">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'center' }}>
              <button onClick={handlePrevMonth} style={navIconBtnStyle}>◀</button>
              <span style={{ fontSize: 20, fontWeight: '800', color: '#333' }}>{year}년 {month}월</span>
              <button onClick={handleNextMonth} style={navIconBtnStyle}>▶</button>
            </div>
            <div className="header-total-area">
              <div style={{ fontSize: 13, color: '#666', marginBottom: 2 }}>이번 달 총 지급액</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: 'dodgerblue', letterSpacing: '-0.5px' }}>{totalMonthlyCost.toLocaleString()}원</div>
            </div>
          </div>
        </div>

        {loading ? <p style={{ color: '#666', textAlign: 'center', padding: 20 }}>로딩 중...</p> : (
          <div className="table-wrapper" style={{ boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '100%' }}>
              <thead>
                <tr style={{ background: '#f5f5f5', color: '#555', fontSize: '13px', borderBottom: '1px solid #ddd', height: 42 }}>
                  <th className="col-name" style={{ ...thStyle, width: 80, position: 'sticky', left: 0, zIndex: 10, background: '#f5f5f5' }}>이름</th>
                  <th className="col-total" style={{ ...thStyle, width: 100 }}>총 지급</th>
                  <th className="mobile-cell col-settings" style={{ ...thStyle, width: 60, color: '#e67e22' }}>설정</th>
                  <th className="mobile-cell col-download" style={{ ...thStyle, width: 60 }}>명세서</th>
                  <th className="desktop-cell" style={{ ...thStyle, color: 'dodgerblue', width: 90 }}>세후 지급</th>
                  <th className="desktop-cell" style={{ ...thStyle, width: 80 }}>기본급</th>
                  <th className="desktop-cell" style={{ ...thStyle, width: 60 }}>주휴</th>
                  <th className="desktop-cell" style={{ ...thStyle, width: 60 }}>야간</th>
                  <th className="desktop-cell" style={{ ...thStyle, width: 60 }}>연장</th>
                  <th className="desktop-cell" style={{ ...thStyle, width: 60 }}>휴일</th>
                  <th className="desktop-cell" style={{ ...thStyle, width: 70 }}>소득세</th>
                  <th className="desktop-cell" style={{ ...thStyle, width: 70 }}>4대보험</th>
                  <th className="desktop-cell" style={{ ...thStyle, width: 50 }}>수정</th>
                  <th className="desktop-cell" style={{ ...thStyle, width: 50 }}>보기</th>
                </tr>
              </thead>
              <tbody>
                {payrollData.map(p => (
                  <tr key={p.empId} style={{ borderBottom: '1px solid #eee', fontSize: '13px', backgroundColor: '#fff', height: 48 }}>
                    <td className="col-name" style={{ ...tdStyle, fontWeight: 'bold', position: 'sticky', left: 0, background: '#fff', zIndex: 5 }}>{p.name}</td>
                    <td className="col-total" style={{ ...tdStyle }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span className="mobile-text" onClick={() => openEditModal(p)} style={{ fontWeight: 'bold', borderBottom: '1px dashed #aaa', cursor: 'pointer' }}>
                            {(p.totalPay || 0).toLocaleString()}
                          </span>
                          <span className="desktop-text" style={{ fontWeight: 'bold' }}>
                            {(p.totalPay || 0).toLocaleString()}
                          </span>
                          {(p.adjustment || 0) !== 0 && (
                            <div style={{ fontSize: 10, color: (p.adjustment || 0) > 0 ? 'blue' : 'red' }}>
                              {(p.adjustment || 0) > 0 ? '+' : ''}{(p.adjustment || 0).toLocaleString()}
                            </div>
                          )}
                      </div>
                    </td>
                    <td className="mobile-cell col-settings" style={tdStyle}>
                      <button onClick={() => setStubModalState({ isOpen: true, data: p, mode: 'settings' })} className="compact-btn" style={{ ...detailBtnStyle, borderColor: '#e67e22', color: '#e67e22' }}>설정</button>
                    </td>
                    <td className="mobile-cell col-download" style={tdStyle}>
                      <button onClick={() => setStubModalState({ isOpen: true, data: p, mode: 'download' })} className="compact-btn" style={detailBtnStyle}>다운</button>
                    </td>
                    <td className="desktop-cell" style={{ ...tdStyle, color: 'dodgerblue', fontWeight: 'bold' }}>{(p.finalPay || 0).toLocaleString()}</td>
                    <td className="desktop-cell" style={tdStyle}>{(p.basePay || 0).toLocaleString()}</td>
                    <td className="desktop-cell" style={tdStyle}>{(p.weeklyHolidayPay || 0).toLocaleString()}</td>
                    <td className="desktop-cell" style={tdStyle}>{(p.nightPay || 0).toLocaleString()}</td>
                    <td className="desktop-cell" style={tdStyle}>{(p.overtimePay || 0).toLocaleString()}</td>
                    <td className="desktop-cell" style={tdStyle}>{(p.holidayWorkPay || 0).toLocaleString()}</td>
                    <td className="desktop-cell" style={tdStyle}>{((p.taxDetails?.incomeTax || 0) + (p.taxDetails?.localTax || 0)).toLocaleString()}</td>
                    <td className="desktop-cell" style={tdStyle}>
                      {((p.taxDetails?.pension || 0) + (p.taxDetails?.health || 0) + (p.taxDetails?.employment || 0) + (p.taxDetails?.care || 0)).toLocaleString()}
                    </td>
                    <td className="desktop-cell" style={tdStyle}>
                      <button onClick={() => openEditModal(p)} style={{ ...detailBtnStyle, background: '#fff3cd', borderColor: '#ffc107', color: '#856404' }}>수정</button>
                    </td>
                    <td className="desktop-cell" style={tdStyle}>
                      <button onClick={() => setStubModalState({ isOpen: true, data: p, mode: 'full' })} style={detailBtnStyle}>보기</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SeveranceCalculator currentStoreId={currentStoreId} employees={employees} />

      <div style={{ position: 'fixed', top: '-10000px', left: '-10000px' }}>
        {payrollData.map(p => (
          <div key={p.empId} id={`hidden-stub-${p.empId}`}>
             <PayStubPaper data={p} year={year} month={month} />
          </div>
        ))}
      </div>

      <PayStubModal
        isOpen={stubModalState.isOpen}
        onClose={() => setStubModalState({ ...stubModalState, isOpen: false })}
        data={stubModalState.data}
        year={year} month={month}
        onSave={handleSaveStubSettings}
        onReset={handleResetStubSettings} 
        mode={stubModalState.mode}
      />

      <PayrollEditModal
        isOpen={editModalState.isOpen}
        onClose={() => setEditModalState(prev => ({ ...prev, isOpen: false }))}
        employeeName={editModalState.name}
        originalPay={editModalState.originalPay}
        currentOverride={editModalState.currentOverride}
        currentAdjustment={editModalState.currentAdjustment}
        onSave={handleSaveEdit}
      />
    </div>
  );
}

const cardStyle = { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #ddd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '24px' };
const btnStyle = { padding: '8px 12px', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' };
const navIconBtnStyle = { background: '#fff', border: '1px solid #ddd', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#555', fontSize: '14px' };
const thStyle = { padding: '10px 4px', textAlign: 'center' as const, fontWeight: 'bold', borderRight: '1px solid #ddd', fontSize: '13px' };
const tdStyle = { padding: '10px 4px', textAlign: 'center' as const, borderRight: '1px solid #ddd', whiteSpace: 'nowrap' as const, fontSize: '13px' };
const detailBtnStyle = { padding: '4px 8px', fontSize: 12, cursor: 'pointer', borderRadius: 4, border: '1px solid #ccc', background: '#fff', color: '#333' };