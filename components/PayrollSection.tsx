'use client';

import React, { useState, useEffect, useCallback } from 'react';
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

    // 직원 정보 (생년월일, 전화번호 등 포함)
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

  // 엑셀 다운로드
  const handleDownloadExcel = () => {
    if (payrollData.length === 0) return;

    // 천 단위 콤마 함수
    const fmt = (num: number) => num ? num.toLocaleString() : '0';

    const excelRows = payrollData.map(p => ({
      '이름': p.name,
      '생년월일': p.birthDate || '-',
      '전화번호': p.phoneNumber || '-',
      '은행': p.details.bank || '-',
      '계좌번호': p.details.account || '-',
      '총지급급여': fmt(p.totalPay),
      '세후지급급여': fmt(p.finalPay),
      '소득세': fmt(p.taxDetails.incomeTax),
      '지방소득세': fmt(p.taxDetails.localTax),
      '국민연금': fmt(p.taxDetails.pension),
      '건강보험': fmt(p.taxDetails.health),
      '장기요양': fmt(p.taxDetails.care),
      '고용보험': fmt(p.taxDetails.employment),
    }));

    const ws = XLSX.utils.json_to_sheet(excelRows);
    
    // 컬럼 너비 설정
    ws['!cols'] = [
      { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 10 }, { wch: 20 },
      { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, 
      { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "급여대장");
    XLSX.writeFile(wb, `${year}년_${month}월_세무용_급여대장.xlsx`);
  };

  return (
    <div>
      {/* ✅ [수정됨] onUpdate를 연결해야 저장 후 자동 계산됩니다! */}
      <StoreSettings storeId={currentStoreId} onUpdate={loadAndCalculate} />
      
      <hr style={{ margin: '32px 0', borderColor: '#333' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 22, margin: 0 }}>💰 {year}년 {month}월 급여 대장</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setMonth(m => m === 1 ? 12 : m - 1)} style={btnStyle}>◀ 전월</button>
          <span style={{ fontSize: 18, fontWeight: 'bold', alignSelf: 'center', minWidth: 60, textAlign: 'center' }}>{month}월</span>
          <button onClick={() => setMonth(m => m === 12 ? 1 : m + 1)} style={btnStyle}>익월 ▶</button>
          <div style={{ width: 10 }}></div>
          <button onClick={handleDownloadExcel} style={{ ...btnStyle, background: 'seagreen', color: '#fff', border: 'none' }}>
            📊 세무용 엑셀 다운
          </button>
        </div>
      </div>

      {loading ? (
        <p>계산 중...</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 1200 }}>
            <thead>
              <tr style={{ background: '#333', color: '#fff' }}>
                <th style={thStyle}>이름</th>
                <th style={thStyle}>총 지급</th>
                <th style={thStyle}>세후 지급</th>
                <th style={{...thStyle, background: '#444'}}>소득세</th>
                <th style={{...thStyle, background: '#444'}}>지방세</th>
                <th style={{...thStyle, background: '#222'}}>국민</th>
                <th style={{...thStyle, background: '#222'}}>건강</th>
                <th style={{...thStyle, background: '#222'}}>요양</th>
                <th style={{...thStyle, background: '#222'}}>고용</th>
                <th style={thStyle}>상세보기</th>
              </tr>
            </thead>
            <tbody>
              {payrollData.map(p => (
                <tr key={p.empId} style={{ borderBottom: '1px solid #444' }}>
                  <td style={{ ...tdStyle, fontWeight: 'bold' }}>{p.name}</td>
                  <td style={{ ...tdStyle, fontWeight: 'bold' }}>{p.totalPay.toLocaleString()}</td>
                  <td style={{ ...tdStyle, color: '#ffeaa7', fontWeight: 'bold' }}>{p.finalPay.toLocaleString()}</td>
                  
                  <td style={{...tdStyle, color: '#aaa'}}>{p.taxDetails.incomeTax > 0 ? p.taxDetails.incomeTax.toLocaleString() : '-'}</td>
                  <td style={{...tdStyle, color: '#aaa'}}>{p.taxDetails.localTax > 0 ? p.taxDetails.localTax.toLocaleString() : '-'}</td>
                  <td style={{...tdStyle, color: '#ccc'}}>{p.taxDetails.pension > 0 ? p.taxDetails.pension.toLocaleString() : '-'}</td>
                  <td style={{...tdStyle, color: '#ccc'}}>{p.taxDetails.health > 0 ? p.taxDetails.health.toLocaleString() : '-'}</td>
                  <td style={{...tdStyle, color: '#ccc'}}>{p.taxDetails.care > 0 ? p.taxDetails.care.toLocaleString() : '-'}</td>
                  <td style={{...tdStyle, color: '#ccc'}}>{p.taxDetails.employment > 0 ? p.taxDetails.employment.toLocaleString() : '-'}</td>

                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <button onClick={() => setSelectedPayStub(p)} style={{ padding: '4px 8px', fontSize: 12, cursor: 'pointer', borderRadius: 4, border: '1px solid #777', background: 'transparent', color: '#fff' }}>
                      명세서 보기
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <p style={{ fontSize: 13, color: '#777', marginTop: 12 }}>
        * 4대보험은 표준 요율(2024/25) 기준으로 자동 계산되었습니다.
      </p>

      <PayStubModal 
        isOpen={!!selectedPayStub} 
        onClose={() => setSelectedPayStub(null)} 
        data={selectedPayStub}
        year={year}
        month={month}
      />
    </div>
  );
}

const btnStyle = { padding: '8px 12px', background: '#333', border: '1px solid #555', color: '#fff', borderRadius: 4, cursor: 'pointer' };
const thStyle = { padding: '10px', border: '1px solid #555', textAlign: 'right' as const, whiteSpace: 'nowrap' as const };
const tdStyle = { padding: '10px', border: '1px solid #555', textAlign: 'right' as const };