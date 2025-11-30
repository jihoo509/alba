'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import StoreSettings from './StoreSettings';
import { calculateMonthlyPayroll } from '@/lib/payroll';
import * as XLSX from 'xlsx';
import PayStubModal from './PayStubModal';
import SeveranceCalculator from './SeveranceCalculator';
import { format } from 'date-fns';

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
  const [selectedPayStub, setSelectedPayStub] = useState<any>(null);

  const loadAndCalculate = useCallback(async () => {
    if (!currentStoreId) return;
    setLoading(true);
    
    // 1. 매장 정보
    const { data: storeData } = await supabase.from('stores').select('*').eq('id', currentStoreId).single();
    
    // 2. 직원 전체 목록
    const { data: empData } = await supabase.from('employees').select('*').eq('store_id', currentStoreId);
    if (empData) setEmployees(empData);
    
    // 3. 개별 설정
    const { data: overData } = await supabase.from('employee_settings').select('*');
    
    // 4. 스케줄
    const startStr = `${year}-${String(month - 1).padStart(2,'0')}-20`;
    const endStr = `${year}-${String(month + 1).padStart(2,'0')}-10`;
    const { data: schedules } = await supabase.from('schedules').select('*').eq('store_id', currentStoreId).gte('date', startStr).lte('date', endStr);

    if (empData && schedules && storeData) {
      // 해당 월 근무 자격 있는 직원 필터링 (퇴사자 제외 로직)
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
    const excelRows = payrollData.map(p => ({
      '이름': p.name, '총지급': fmt(p.totalPay), '세후지급': fmt(p.finalPay),
      '기본급': fmt(p.basePay), '주휴': fmt(p.weeklyHolidayPay), '야간': fmt(p.nightPay),
      '연장': fmt(p.overtimePay), '휴일': fmt(p.holidayWorkPay),
      '소득세': fmt(p.taxDetails.incomeTax), '지방세': fmt(p.taxDetails.localTax),
      '국민연금': fmt(p.taxDetails.pension), '건강보험': fmt(p.taxDetails.health),
      '장기요양': fmt(p.taxDetails.care), '고용보험': fmt(p.taxDetails.employment),
    }));
    const ws = XLSX.utils.json_to_sheet(excelRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "급여대장");
    XLSX.writeFile(wb, `${year}년_${month}월_급여대장.xlsx`);
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      
      <div style={cardStyle}>
          <StoreSettings storeId={currentStoreId} onUpdate={loadAndCalculate} />
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <h2 style={{ fontSize: 20, margin: 0, color: '#333', fontWeight: 'bold' }}>💰 월 급여 대장</h2>
             <button onClick={handleDownloadExcel} style={{ ...btnStyle, background: '#27ae60', color: '#fff', border: 'none', fontSize: 13 }}>
               📊 엑셀 다운
             </button>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f5f5f5', padding: '12px', borderRadius: 8 }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
               <button onClick={() => setMonth(m => m === 1 ? 12 : m - 1)} style={navBtnStyle}>◀</button>
               <span style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>{month}월</span>
               <button onClick={() => setMonth(m => m === 12 ? 1 : m + 1)} style={navBtnStyle}>▶</button>
             </div>
             <div style={{ textAlign: 'right' }}>
               <div style={{ fontSize: 12, color: '#666' }}>총 지급액</div>
               <div style={{ fontSize: 18, fontWeight: 'bold', color: 'dodgerblue' }}>{totalMonthlyCost.toLocaleString()}원</div>
             </div>
          </div>
        </div>

        {loading ? <p style={{color:'#666', textAlign:'center'}}>계산 중...</p> : (
          <div className="table-wrapper" style={{ boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '100%' }}>
              <thead>
                <tr style={{ background: '#f5f5f5', color: '#555', fontSize: '13px', borderBottom: '1px solid #ddd', height: 40 }}>
                  {/* 공통 */}
                  <th style={{ ...thStyle, width: 70, position: 'sticky', left: 0, zIndex: 10, background: '#f5f5f5' }}>이름</th>
                  <th style={{ ...thStyle, width: 90 }}>총 지급</th>

                  {/* 📱 모바일 전용: 설정 버튼 */}
                  <th className="mobile-cell" style={{ ...thStyle, width: 60, color: '#e67e22' }}>설정</th>

                  {/* 🖥️ PC 전용: 상세 내역 (세금, 보험, 수당) */}
                  <th className="desktop-cell" style={{ ...thStyle, width: 90, color: 'dodgerblue' }}>세후 지급</th>
                  <th className="desktop-cell" style={{ ...thStyle, width: 80 }}>기본급</th>
                  <th className="desktop-cell" style={{ ...thStyle, width: 70 }}>주휴</th>
                  <th className="desktop-cell" style={{ ...thStyle, width: 70 }}>야간</th>
                  <th className="desktop-cell" style={{ ...thStyle, width: 70 }}>연장</th>
                  <th className="desktop-cell" style={{ ...thStyle, width: 70 }}>휴일</th>
                  <th className="desktop-cell" style={{ ...thStyle, width: 70 }}>소득세</th>
                  <th className="desktop-cell" style={{ ...thStyle, width: 70 }}>지방세</th>
                  <th className="desktop-cell" style={{ ...thStyle, width: 70 }}>국민</th>
                  <th className="desktop-cell" style={{ ...thStyle, width: 70 }}>건강</th>
                  <th className="desktop-cell" style={{ ...thStyle, width: 70 }}>요양</th>
                  <th className="desktop-cell" style={{ ...thStyle, width: 70 }}>고용</th>

                  {/* 공통: 명세서 */}
                  <th style={{ ...thStyle, width: 80 }}>명세서</th>
                </tr>
              </thead>
              <tbody>
                {payrollData.map(p => (
                  <tr key={p.empId} style={{ borderBottom: '1px solid #eee', fontSize: '13px', backgroundColor: '#fff', height: 46 }}>
                    {/* 공통 */}
                    <td style={{ ...tdStyle, fontWeight: 'bold', position: 'sticky', left: 0, background: '#fff', zIndex: 5 }}>{p.name}</td>
                    <td style={{ ...tdStyle, fontWeight: 'bold' }}>{p.totalPay.toLocaleString()}</td>

                    {/* 📱 모바일 전용: 설정 버튼 */}
                    <td className="mobile-cell" style={tdStyle}>
                      <button onClick={() => setSelectedPayStub(p)} style={{ ...detailBtnStyle, borderColor: '#e67e22', color: '#e67e22' }}>설정</button>
                    </td>

                    {/* 🖥️ PC 전용: 상세 내역 */}
                    <td className="desktop-cell" style={{ ...tdStyle, color: 'dodgerblue', fontWeight: 'bold' }}>{p.finalPay.toLocaleString()}</td>
                    <td className="desktop-cell" style={tdStyle}>{p.basePay.toLocaleString()}</td>
                    <td className="desktop-cell" style={tdStyle}>{p.weeklyHolidayPay.toLocaleString()}</td>
                    <td className="desktop-cell" style={tdStyle}>{p.nightPay.toLocaleString()}</td>
                    <td className="desktop-cell" style={tdStyle}>{p.overtimePay.toLocaleString()}</td>
                    <td className="desktop-cell" style={tdStyle}>{p.holidayWorkPay.toLocaleString()}</td>
                    <td className="desktop-cell" style={tdStyle}>{p.taxDetails.incomeTax.toLocaleString()}</td>
                    <td className="desktop-cell" style={tdStyle}>{p.taxDetails.localTax.toLocaleString()}</td>
                    <td className="desktop-cell" style={tdStyle}>{p.taxDetails.pension.toLocaleString()}</td>
                    <td className="desktop-cell" style={tdStyle}>{p.taxDetails.health.toLocaleString()}</td>
                    <td className="desktop-cell" style={tdStyle}>{p.taxDetails.care.toLocaleString()}</td>
                    <td className="desktop-cell" style={tdStyle}>{p.taxDetails.employment.toLocaleString()}</td>

                    {/* 공통: 명세서 버튼 */}
                    <td style={tdStyle}>
                      <button onClick={() => setSelectedPayStub(p)} style={detailBtnStyle}>보기</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SeveranceCalculator currentStoreId={currentStoreId} employees={employees} />

      <PayStubModal 
        isOpen={!!selectedPayStub} 
        onClose={() => setSelectedPayStub(null)} 
        data={selectedPayStub} 
        year={year} month={month}
        onSave={handleSaveOverride}
      />
    </div>
  );
}

const cardStyle = { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #ddd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '24px' };
const btnStyle = { padding: '8px 12px', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' };
const navBtnStyle = { background: '#fff', border: '1px solid #ccc', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' };
const detailBtnStyle = { padding: '4px 10px', fontSize: 12, cursor: 'pointer', borderRadius: 4, border: '1px solid #ccc', background: '#fff', color: '#333' };
const thStyle = { padding: '0 8px', textAlign: 'center' as const, whiteSpace: 'nowrap' as const, fontWeight: 'bold' };
const tdStyle = { padding: '0 8px', textAlign: 'center' as const, color: '#333', whiteSpace: 'nowrap' as const };