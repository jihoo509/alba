'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import StoreSettings from './StoreSettings';
import { calculatePayrollByRange, calculateTaxAmounts } from '@/lib/payroll';
import * as XLSX from 'xlsx-js-style';
import PayStubModal, { PayStubPaper } from './PayStubModal';
import PayrollEditModal from './PayrollEditModal';
import SeveranceCalculator from './SeveranceCalculator';
import DateSelector from './DateSelector'; 
import { format, startOfMonth, endOfMonth, addMonths, subMonths, addWeeks, startOfWeek, endOfWeek, addDays, setDate, getWeekOfMonth, parseISO } from 'date-fns';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

type Props = { 
    currentStoreId: string; 
    refreshTrigger?: number; 
    onSettingsUpdate?: () => void;
};
type ViewMode = 'month' | 'week' | 'custom';

export default function PayrollSection({ currentStoreId, refreshTrigger = 0, onSettingsUpdate }: Props) {
  const supabase = createSupabaseBrowserClient();
  
  const [viewMode, setViewMode] = useState<ViewMode>('month'); 
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  
  const [payrollData, setPayrollData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);

  const [savedSettings, setSavedSettings] = useState<any>(null);

  const [stubModalState, setStubModalState] = useState<{ isOpen: boolean; data: any; mode: 'full' | 'settings' | 'download' }>({
    isOpen: false, data: null, mode: 'full'
  });

  const [editModalState, setEditModalState] = useState<{ 
    isOpen: boolean; empId: number | null; name: string; originalPay: number; currentOverride: number | null; currentAdjustment: number; 
  }>({
    isOpen: false, empId: null, name: '', originalPay: 0, currentOverride: null, currentAdjustment: 0
  });

  const [isDownloading, setIsDownloading] = useState(false);

  const calculateRangeBySettings = (mode: ViewMode, settings: any, refDate: Date = new Date()) => {
      let sDate, eDate;
      const startDay = settings?.pay_rule_start_day || 1;

      if (mode === 'week') {
          sDate = startOfWeek(refDate, { weekStartsOn: 1 });
          eDate = endOfWeek(refDate, { weekStartsOn: 1 });
      } else if (mode === 'month') {
          if (startDay === 1) {
              sDate = startOfMonth(refDate);
              eDate = endOfMonth(refDate);
          } else {
              if (refDate.getDate() >= startDay) {
                  sDate = setDate(refDate, startDay);
                  eDate = addDays(setDate(addMonths(refDate, 1), startDay), -1);
              } else {
                  sDate = setDate(subMonths(refDate, 1), startDay);
                  eDate = addDays(setDate(refDate, startDay), -1);
              }
          }
      } else {
          return null; 
      }
      return { s: format(sDate, 'yyyy-MM-dd'), e: format(eDate, 'yyyy-MM-dd') };
  };

  useEffect(() => {
    if(!currentStoreId) return;
    const fetchSettings = async () => {
        const { data } = await supabase.from('stores').select('*').eq('id', currentStoreId).single();
        if(data) {
            setSavedSettings(data);
            
            let targetMode: ViewMode = viewMode;
            if (viewMode !== 'custom') {
                if (data.pay_rule_type === 'week') targetMode = 'week';
                else targetMode = 'month';
            }
            if (refreshTrigger > 0) {
                 if (data.pay_rule_type === 'week') targetMode = 'week';
                 else targetMode = 'month';
            }

            setViewMode(targetMode); 

            const range = calculateRangeBySettings(targetMode, data, new Date());
            if (range) {
                setStartDate(range.s);
                setEndDate(range.e);
            }
        }
    };
    fetchSettings();
  }, [currentStoreId, supabase, refreshTrigger]);

  useEffect(() => {
      if (savedSettings) {
          if (viewMode === 'custom') {
              const todayStr = format(new Date(), 'yyyy-MM-dd');
              setStartDate(todayStr);
              setEndDate(todayStr);
          } else {
              const range = calculateRangeBySettings(viewMode, savedSettings, new Date());
              if (range) {
                  setStartDate(range.s);
                  setEndDate(range.e);
              }
          }
      }
  }, [viewMode, savedSettings]);

  const handleRangeMove = (direction: 'prev' | 'next') => {
    const s = new Date(startDate);
    if (viewMode === 'month') {
        const moveAmount = direction === 'prev' ? -1 : 1;
        const newStart = addMonths(s, moveAmount);
        const range = calculateRangeBySettings('month', savedSettings, newStart);
        if (range) { setStartDate(range.s); setEndDate(range.e); }
    } else if (viewMode === 'week') {
        const moveAmount = direction === 'prev' ? -1 : 1;
        const newStart = addWeeks(s, moveAmount);
        const range = calculateRangeBySettings('week', savedSettings, newStart);
         if (range) { setStartDate(range.s); setEndDate(range.e); }
    }
  };

  const handleCustomStartDateChange = (newStart: string) => {
      setStartDate(newStart);
      if (newStart > endDate) setEndDate(newStart);
  };

  const renderDateDisplay = () => {
    const s = new Date(startDate);
    const e = new Date(endDate);

    if (viewMode === 'month') {
        return (
            <span style={{ fontSize: 20, fontWeight: '800', color: '#333', letterSpacing: '-0.5px' }}>
                {format(s, 'yyyy년 MM월')}
            </span>
        );
    }

    if (viewMode === 'week') {
        const weekNum = getWeekOfMonth(s, { weekStartsOn: 1 });
        const startFmt = format(s, 'MM.dd');
        const endFmt = format(e, 'MM.dd');
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.2 }}>
                <span style={{ fontSize: 18, fontWeight: '800', color: '#333' }}>
                    {format(s, 'M월')} {weekNum}주
                </span>
                <span style={{ fontSize: 12, color: '#888', fontWeight: '500' }}>
                    ({startFmt} ~ {endFmt})
                </span>
            </div>
        );
    }
    return <span>{startDate} ~ {endDate}</span>;
  };

  const loadAndCalculate = useCallback(async () => {
    if (!currentStoreId || !startDate || !endDate) return;
    setLoading(true);

    const { data: storeData } = await supabase.from('stores').select('*').eq('id', currentStoreId).single();
    const { data: empData } = await supabase.from('employees').select('*').eq('store_id', currentStoreId);
    if (empData) setEmployees(empData);
    
    const { data: overData } = await supabase.from('employee_settings').select('*');

    // ✅ [핵심 수정] DB 조회 시 날짜 범위를 '조회 시작일이 포함된 주의 월요일'까지 넓힘
    // 예: 2월 1일 조회 시 -> 1월 26일(월)부터 데이터를 가져옴
    const searchStart = parseISO(startDate);
    const contextStart = startOfWeek(searchStart, { weekStartsOn: 1 });
    const contextStartStr = format(contextStart, 'yyyy-MM-dd');

    const { data: schedules } = await supabase.from('schedules').select('*')
        .eq('store_id', currentStoreId)
        .gte('date', contextStartStr) // ✅ startDate가 아닌 contextStartStr 사용
        .lte('date', endDate);

    if (empData && schedules && storeData) {
      const activeEmps = empData.filter((emp: any) => {
        const joined = !emp.hire_date || emp.hire_date <= endDate;
        const notLeft = !emp.end_date || emp.end_date >= startDate;
        return joined && notLeft;
      });

      // 여기선 startDate 그대로 넘김 (lib/payroll.ts 내부에서 알아서 처리)
      let result = calculatePayrollByRange(startDate, endDate, activeEmps, schedules, storeData, overData || []);

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

        return { ...item, totalPay: newTotalPay, finalPay: newFinalPay, basePay: basePay, adjustment: adjustment, taxDetails: newTax, originalCalcPay: originalPay, isModified: true };
      });
      setPayrollData(result);
    }
    setLoading(false);
  }, [currentStoreId, startDate, endDate, supabase]);

  useEffect(() => { loadAndCalculate(); }, [loadAndCalculate]);

  const handleSaveEdit = async (override: number | null, adjustment: number) => {
    if (!editModalState.empId) return;
    const { error } = await supabase.from('employee_settings').upsert({
      employee_id: editModalState.empId, monthly_override: override, monthly_adjustment: adjustment,
    }, { onConflict: 'employee_id' });
    if (error) { alert('저장 오류: ' + error.message); } 
    else { setEditModalState(prev => ({ ...prev, isOpen: false })); await loadAndCalculate(); }
  };

  const handleSaveStubSettings = async (settings: any) => {
    const { error } = await supabase.from('employee_settings').upsert(settings, { onConflict: 'employee_id' });
    if (error) { alert('설정 저장 실패: ' + error.message); } else { await loadAndCalculate(); }
  };

  const handleResetStubSettings = async (employeeId: number) => {
    if (!confirm('초기화 하시겠습니까?')) return;
    const { error } = await supabase.from('employee_settings').upsert({
        employee_id: employeeId, pay_weekly: null, pay_night: null, pay_overtime: null, pay_holiday: null, auto_deduct_break: null, no_tax_deduction: null, monthly_override: null, monthly_adjustment: 0
    }, { onConflict: 'employee_id' });
    if (error) { alert('초기화 실패'); } else { await loadAndCalculate(); }
  };

  const totalMonthlyCost = useMemo(() => payrollData.reduce((acc, curr) => (acc + (curr.totalPay || 0)), 0), [payrollData]);

  const handleDownloadExcel = () => {
    if (payrollData.length === 0) return;
    const fmt = (num: number) => num ? num.toLocaleString() : '0';
    const excelRows = payrollData.map(p => {
      const empInfo = employees.find(e => e.id === p.empId);
      const { incomeTax, localTax, pension, health, employment, care } = p.taxDetails;
      const totalDeductions = incomeTax + localTax + pension + health + employment + care;
      return {
        '이름': p.name, '전화번호': empInfo?.phone_number || '-', '은행': empInfo?.bank_name || '-', '계좌번호': empInfo?.account_number || '-', '생년월일': empInfo?.birth_date || '-', 
        '총 지급 급여': fmt(p.totalPay), '세후 지급 급여': fmt(p.finalPay), '총 공제액': fmt(totalDeductions), 
        '소득세': fmt(incomeTax), '지방소득세': fmt(localTax), '국민연금': fmt(pension), '건강보험': fmt(health), '고용보험': fmt(employment), '장기요양보험': fmt(care),
      };
    });
    const ws = XLSX.utils.json_to_sheet(excelRows);
    const range = XLSX.utils.decode_range(ws['!ref'] || "A1:A1");
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cell_address]) continue;
        ws[cell_address].s = { alignment: { horizontal: "center", vertical: "center" }, font: { name: "맑은 고딕" } };
        if (R === 0) { ws[cell_address].s = { alignment: { horizontal: "center", vertical: "center" }, font: { name: "맑은 고딕", bold: true }, fill: { fgColor: { rgb: "EEEEEE" } } }; }
      }
    }
    ws['!cols'] = [ { wch: 10 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 } ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "급여대장");
    XLSX.writeFile(wb, `${startDate}~${endDate}_급여대장.xlsx`);
  };

  const handleDownloadAllStubs = async () => { 
    if (payrollData.length === 0) return;
    if (!confirm(`${payrollData.length}명의 명세서를 다운로드합니다.`)) return;
    setIsDownloading(true);
    const zip = new JSZip();
    try {
      for (let i = 0; i < payrollData.length; i++) {
        const p = payrollData[i];
        const element = document.getElementById(`hidden-stub-${p.empId}`);
        if (element) {
          const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
          const base64Data = canvas.toDataURL('image/png').replace(/^data:image\/(png|jpg);base64,/, "");
          zip.file(`${p.name}_급여명세서.png`, base64Data, { base64: true });
        }
        await new Promise(r => setTimeout(r, 50)); 
      }
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${startDate}~${endDate}_급여명세서_모음.zip`);
    } catch (e) { console.error(e); } finally { setIsDownloading(false); }
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
        .header-container { display: flex; justify-content: space-between; align-items: center; background-color: #f8f9fa; padding: 16px 24px; border-radius: 12px; border: 1px solid #eee; gap: 20px; }
        .controls-area { flex: 1; display: flex; flexDirection: column; alignItems: center; max-width: 450px; }
        .header-total-area { min-width: 200px; text-align: right; flex-shrink: 0; white-space: nowrap; }
        .view-tabs { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px; background: #eee; padding: 4px; border-radius: 8px; margin-bottom: 12px; width: 100%; max-width: 320px; }
        .view-tab { padding: 8px 0; border-radius: 6px; border: none; font-size: 13px; cursor: pointer; color: #555; background: transparent; width: 100%; text-align: center; }
        .view-tab.active { background: #fff; color: dodgerblue; font-weight: bold; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .nav-btn-group { display: flex; alignItems: center; gap: 12px; justify-content: center; width: 100%; }
        .tilde-separator { margin: 0 6px; color: #999; font-size: 13px; }
        @media (max-width: 768px) {
          .header-container { flexDirection: column; gap: 16px; text-align: center; padding: 20px 16px; }
          .controls-area { max-width: 100%; width: 100%; }
          .view-tabs { max-width: 100%; }
          .header-total-area { width: 100%; text-align: right; border-top: 1px dashed #ddd; padding-top: 12px; margin-top: 4px; }
          .tilde-separator { display: none; }
          .custom-date-group { gap: 2px !important; }
          .desktop-cell { display: none !important; }
          .mobile-cell { display: table-cell !important; }
          .col-name { width: 25% !important; }
          .col-total { width: 35% !important; }
          .col-settings { width: 20% !important; }
          .col-download { width: 20% !important; }
          .compact-btn { padding: 6px 4px !important; font-size: 11px !important; width: 100%; }
        }
        @media (min-width: 769px) { .mobile-cell { display: none !important; } .desktop-cell { display: table-cell !important; } }
      `}</style>

      <div style={cardStyle}>
        <StoreSettings storeId={currentStoreId} onUpdate={onSettingsUpdate} />
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap:'wrap', gap:8 }}>
            <h2 style={{ fontSize: 20, margin: 0, color: '#333', fontWeight: 'bold' }}>💰 급여 대장</h2>
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
            <div className="controls-area">
                <div className="view-tabs">
                    <button className={`view-tab ${viewMode==='month' ? 'active' : ''}`} onClick={()=>setViewMode('month')}>월별</button>
                    <button className={`view-tab ${viewMode==='week' ? 'active' : ''}`} onClick={()=>setViewMode('week')}>주별</button>
                    <button className={`view-tab ${viewMode==='custom' ? 'active' : ''}`} onClick={()=>setViewMode('custom')}>기간지정</button>
                </div>

                <div className="nav-btn-group">
                    {viewMode !== 'custom' && (
                        <button onClick={() => handleRangeMove('prev')} style={navIconBtnStyle}>◀</button>
                    )}
                    
                    {viewMode === 'custom' ? (
                        <div className="custom-date-group" style={{ display:'flex', alignItems:'center', gap: 8, width: '100%' }}>
                            <div style={{ flex: 1 }}>
                                <DateSelector value={startDate} onChange={handleCustomStartDateChange} />
                            </div>
                            <span className="tilde-separator">~</span>
                            <div style={{ flex: 1 }}>
                                <DateSelector value={endDate} onChange={setEndDate} />
                            </div>
                        </div>
                    ) : ( renderDateDisplay() )}

                    {viewMode !== 'custom' && (
                         <button onClick={() => handleRangeMove('next')} style={navIconBtnStyle}>▶</button>
                    )}
                </div>
            </div>

            <div className="header-total-area">
              <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>조회 기간 총 지급액</div>
              <div style={{ fontSize: 26, fontWeight: 'bold', color: 'dodgerblue', letterSpacing: '-0.5px' }}>
                {totalMonthlyCost.toLocaleString()}
                <span style={{ fontSize: 16, color: '#888', marginLeft: 2 }}>원</span>
              </div>
            </div>
          </div>
        </div>

        {loading ? <p style={{ color: '#666', textAlign: 'center', padding: 20 }}>데이터 불러오는 중...</p> : (
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
                {payrollData.length === 0 ? (
                    <tr><td colSpan={14} style={{padding:20, textAlign:'center', color:'#999'}}>해당 기간에 근무 기록이 없습니다.</td></tr>
                ) : payrollData.map(p => (
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
             <PayStubPaper data={p} year={parseInt(startDate.split('-')[0])} month={parseInt(startDate.split('-')[1])} />
          </div>
        ))}
      </div>

      <PayStubModal
        isOpen={stubModalState.isOpen}
        onClose={() => setStubModalState({ ...stubModalState, isOpen: false })}
        data={stubModalState.data}
        year={parseInt(startDate.split('-')[0])} 
        month={parseInt(startDate.split('-')[1])}
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