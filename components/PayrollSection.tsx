'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import StoreSettings from './StoreSettings';
import { calculateMonthlyPayroll } from '@/lib/payroll';
import * as XLSX from 'xlsx';
import PayStubModal from './PayStubModal';

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
  const [storeSettings, setStoreSettings] = useState<any>(null);
  const [selectedPayStub, setSelectedPayStub] = useState<any>(null);

  const loadAndCalculate = useCallback(async () => {
    if (!currentStoreId) return;
    setLoading(true);

    const { data: storeData } = await supabase.from('stores').select('*').eq('id', currentStoreId).single();
    setStoreSettings(storeData);

    const { data: employees } = await supabase.from('employees').select('*').eq('store_id', currentStoreId);

    const startStr = `${year}-${String(month - 1).padStart(2,'0')}-20`;
    const endStr = `${year}-${String(month + 1).padStart(2,'0')}-10`;
    
    const { data: schedules } = await supabase
      .from('schedules')
      .select('*')
      .eq('store_id', currentStoreId)
      .gte('date', startStr)
      .lte('date', endStr);

    if (employees && schedules && storeData) {
      const result = calculateMonthlyPayroll(year, month, employees, schedules, storeData);
      setPayrollData(result);
    }
    setLoading(false);
  }, [currentStoreId, year, month, supabase]);

  useEffect(() => {
    loadAndCalculate();
  }, [loadAndCalculate]);

  const totalMonthlyCost = useMemo(() => {
    return payrollData.reduce((acc, curr) => acc + curr.totalPay, 0);
  }, [payrollData]);

  const handleDownloadExcel = () => {
    if (payrollData.length === 0) return;
    const fmt = (num: number) => num ? num.toLocaleString() : '0';

    const excelRows = payrollData.map(p => ({
      '이름': p.name,
      '생년월일': p.birthDate || '-',
      '전화번호': p.phoneNumber || '-',
      '은행': p.details.bank || '-',
      '계좌번호': p.details.account || '-',
      '총지급급여': fmt(p.totalPay),
      '세후지급급여': fmt(p.finalPay),
      '기본급': fmt(p.basePay),
      '주휴수당': fmt(p.weeklyHolidayPay),
      '야간수당': fmt(p.nightPay),
      '연장수당': fmt(p.overtimePay),
      '휴일수당': fmt(p.holidayWorkPay),
      '소득세': fmt(p.taxDetails.incomeTax),
      '지방소득세': fmt(p.taxDetails.localTax),
      '국민연금': fmt(p.taxDetails.pension),
      '건강보험': fmt(p.taxDetails.health),
      '장기요양': fmt(p.taxDetails.care),
      '고용보험': fmt(p.taxDetails.employment),
    }));

    const ws = XLSX.utils.json_to_sheet(excelRows);
    ws['!cols'] = [{ wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 10 }, { wch: 20 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "급여대장");
    XLSX.writeFile(wb, `${year}년_${month}월_세무용_급여대장.xlsx`);
  };

  return (
    // ✅ [수정] 전체 너비를 1000px로 제한하여 컴팩트하게 만듦
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      
      {/* 설정 박스 (너비 제한에 맞춰 자동으로 줄어듦) */}
      <div style={cardStyle}>
          <StoreSettings storeId={currentStoreId} onUpdate={loadAndCalculate} />
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <h2 style={{ fontSize: 24, margin: 0, color: '#333' }}>💰 {year}년 {month}월 급여 대장</h2>
            <span style={{ fontSize: 16, color: '#666' }}>
              총 지급액: <strong style={{ color: 'dodgerblue', fontSize: 20 }}>{totalMonthlyCost.toLocaleString()}원</strong>
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setMonth(m => m === 1 ? 12 : m - 1)} style={btnStyle}>◀ 전월</button>
            <span style={{ fontSize: 18, fontWeight: 'bold', alignSelf: 'center', minWidth: 60, textAlign: 'center', color: '#333' }}>{month}월</span>
            <button onClick={() => setMonth(m => m === 12 ? 1 : m + 1)} style={btnStyle}>익월 ▶</button>
            <div style={{ width: 10 }}></div>
            <button onClick={handleDownloadExcel} style={{ ...btnStyle, background: '#27ae60', color: '#fff', border: 'none' }}>
              📊 세무용 엑셀 다운
            </button>
          </div>
        </div>

        {loading ? <p style={{color:'#333'}}>계산 중...</p> : (
          // ✅ [수정] 테이블 컨테이너에 가로 스크롤 적용
          <div style={{ overflowX: 'auto', position: 'relative' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1200, tableLayout: 'fixed' }}>
              <thead>
                <tr style={{ background: '#f5f5f5', color: '#333', fontSize: '15px', borderBottom: '2px solid #ddd', height: 50 }}>
                  {/* ✅ 고정 열: 이름 (Left 0) */}
                  <th style={{ ...thStyle, ...stickyLeftStyle, left: 0, width: 80, zIndex: 10 }}>이름</th>
                  {/* ✅ 고정 열: 총 지급 (Left 80) */}
                  <th style={{ ...thStyle, ...stickyLeftStyle, left: 80, width: 100, zIndex: 10, borderRight: '2px solid #ddd' }}>총 지급</th>
                  
                  <th style={{ ...thStyle, width: 100 }}>세후 지급</th>
                  <th style={{ ...thStyle, background: '#f0f0f0', width: 80 }}>소득세</th>
                  <th style={{ ...thStyle, background: '#f0f0f0', width: 80 }}>지방세</th>
                  <th style={{ ...thStyle, background: '#e9e9e9', width: 80 }}>국민</th>
                  <th style={{ ...thStyle, background: '#e9e9e9', width: 80 }}>건강</th>
                  <th style={{ ...thStyle, background: '#e9e9e9', width: 80 }}>요양</th>
                  <th style={{ ...thStyle, background: '#e9e9e9', width: 80 }}>고용</th>
                  <th style={{ ...thStyle, width: 90 }}>기본급</th>
                  <th style={{ ...thStyle, width: 90 }}>주휴수당</th>
                  
                  {/* ✅ 고정 열: 상세보기 (Right 0) */}
                  <th style={{ ...thStyle, ...stickyRightStyle, right: 0, width: 100, zIndex: 10, borderLeft: '2px solid #ddd' }}>상세보기</th>
                </tr>
              </thead>
              <tbody>
                {payrollData.map(p => (
                  <tr key={p.empId} style={{ borderBottom: '1px solid #eee', fontSize: '15px', backgroundColor: '#fff', height: 50 }}>
                    {/* ✅ 고정 셀: 이름 */}
                    <td style={{ ...tdStyle, ...stickyLeftStyle, left: 0, fontWeight: 'bold', zIndex: 5 }}>{p.name}</td>
                    {/* ✅ 고정 셀: 총 지급 */}
                    <td style={{ ...tdStyle, ...stickyLeftStyle, left: 80, fontWeight: 'bold', zIndex: 5, borderRight: '2px solid #eee' }}>{p.totalPay.toLocaleString()}</td>
                    
                    <td style={{ ...tdStyle, color: 'dodgerblue', fontWeight: 'bold' }}>{p.finalPay.toLocaleString()}</td>
                    <td style={{...tdStyle, color: '#666'}}>{p.taxDetails.incomeTax > 0 ? p.taxDetails.incomeTax.toLocaleString() : '-'}</td>
                    <td style={{...tdStyle, color: '#666'}}>{p.taxDetails.localTax > 0 ? p.taxDetails.localTax.toLocaleString() : '-'}</td>
                    <td style={{...tdStyle, color: '#888'}}>{p.taxDetails.pension > 0 ? p.taxDetails.pension.toLocaleString() : '-'}</td>
                    <td style={{...tdStyle, color: '#888'}}>{p.taxDetails.health > 0 ? p.taxDetails.health.toLocaleString() : '-'}</td>
                    <td style={{...tdStyle, color: '#888'}}>{p.taxDetails.care > 0 ? p.taxDetails.care.toLocaleString() : '-'}</td>
                    <td style={{...tdStyle, color: '#888'}}>{p.taxDetails.employment > 0 ? p.taxDetails.employment.toLocaleString() : '-'}</td>
                    <td style={{...tdStyle, color: '#aaa'}}>{p.basePay.toLocaleString()}</td>
                    <td style={{...tdStyle, color: '#aaa'}}>{p.weeklyHolidayPay.toLocaleString()}</td>

                    {/* ✅ 고정 셀: 상세보기 */}
                    <td style={{ ...tdStyle, ...stickyRightStyle, right: 0, zIndex: 5, borderLeft: '2px solid #eee' }}>
                      <button onClick={() => setSelectedPayStub(p)} style={{ padding: '6px 12px', fontSize: 13, cursor: 'pointer', borderRadius: 4, border: '1px solid #ccc', background: '#fff', color: '#333', whiteSpace: 'nowrap' }}>명세서</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p style={{ fontSize: 13, color: '#888', marginTop: 12 }}>
          * 4대보험은 표준 요율(2024/25) 기준으로 자동 계산되었습니다.
        </p>
      </div>

      <PayStubModal isOpen={!!selectedPayStub} onClose={() => setSelectedPayStub(null)} data={selectedPayStub} year={year} month={month} />
    </div>
  );
}

const cardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '24px',
  border: '1px solid #ddd',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  marginBottom: '24px'
};

const btnStyle = { 
  padding: '8px 12px', 
  background: '#fff', 
  border: '1px solid #ccc', 
  color: '#333', 
  borderRadius: 4, 
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 'bold'
};

const thStyle = { 
  padding: '0 10px', 
  textAlign: 'center' as const, 
  whiteSpace: 'nowrap' as const, 
  fontWeight: 'bold',
  color: '#333',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
};

const tdStyle = { 
  padding: '0 10px', 
  textAlign: 'center' as const,
  color: '#333',
  whiteSpace: 'nowrap' as const
};

// ✅ 고정 열 스타일 (왼쪽)
const stickyLeftStyle = {
  position: 'sticky' as const,
  backgroundColor: '#fff', // 스크롤 시 뒤 내용 가림
};

// ✅ 고정 열 스타일 (오른쪽)
const stickyRightStyle = {
  position: 'sticky' as const,
  backgroundColor: '#fff',
};