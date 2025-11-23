'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import StoreSettings from './StoreSettings';
import { calculateMonthlyPayroll } from '@/lib/payroll'; // 방금 만든 계산 엔진
import * as XLSX from 'xlsx'; // 엑셀 라이브러리

type Props = {
  currentStoreId: string;
};

export default function PayrollSection({ currentStoreId }: Props) {
  const supabase = createSupabaseBrowserClient();
  
  // 날짜 상태 (기본: 이번 달)
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const [payrollData, setPayrollData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [storeSettings, setStoreSettings] = useState<any>(null);

  // 1. 데이터 가져오기 및 계산
  const loadAndCalculate = useCallback(async () => {
    if (!currentStoreId) return;
    setLoading(true);

    // (1) 매장 설정 가져오기 (5인 이상 여부 등)
    const { data: storeData } = await supabase
      .from('stores')
      .select('*')
      .eq('id', currentStoreId)
      .single();
    setStoreSettings(storeData);

    // (2) 직원 목록 가져오기
    const { data: employees } = await supabase
      .from('employees')
      .select('*')
      .eq('store_id', currentStoreId);

    // (3) 스케줄 가져오기 (앞뒤로 7일 여유 두고 가져옴 - 주휴 계산용)
    // 정확히는 해당 월의 1일이 포함된 주의 월요일 ~ 말일이 포함된 주의 일요일
    // 편의상 전월 말 ~ 익월 초까지 넉넉히 가져옵니다.
    const startStr = `${year}-${String(month).padStart(2,'0')}-01`;
    const endStr = `${year}-${String(month).padStart(2,'0')}-31`; // 대략
    
    // 실제로는 DB에서 넉넉하게 가져와서 JS에서 필터링하는 게 주휴 계산에 안전함
    const { data: schedules } = await supabase
      .from('schedules')
      .select('*')
      .eq('store_id', currentStoreId)
      .gte('date', `${year}-${String(month - 1).padStart(2,'0')}-20`) // 전월 20일부터
      .lte('date', `${year}-${String(month + 1).padStart(2,'0')}-10`); // 익월 10일까지

    if (employees && schedules && storeData) {
      // ⚡ 계산 엔진 가동!
      const result = calculateMonthlyPayroll(year, month, employees, schedules, storeData);
      setPayrollData(result);
    }

    setLoading(false);
  }, [currentStoreId, year, month, supabase]);

  useEffect(() => {
    loadAndCalculate();
  }, [loadAndCalculate]);

  // 엑셀 다운로드 기능
  const handleDownloadExcel = () => {
    if (payrollData.length === 0) return;

    // 엑셀용 데이터 변환
    const excelRows = payrollData.map(p => ({
      '이름': p.name,
      '시급': p.wage,
      '고용형태': p.type === 'freelancer_33' ? '3.3%' : '4대보험',
      '총근무(시간)': p.totalHours,
      '기본급': p.basePay,
      '주휴수당': p.weeklyHolidayPay,
      '야간수당': p.nightPay,
      '세전총액': p.basePay + p.weeklyHolidayPay + p.nightPay,
      '공제(세금)': p.tax,
      '실수령액': p.finalPay,
      '은행': p.details.bank,
      '계좌번호': p.details.account
    }));

    const ws = XLSX.utils.json_to_sheet(excelRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "급여대장");
    XLSX.writeFile(wb, `${year}년_${month}월_급여대장.xlsx`);
  };

  return (
    <div>
      {/* 상단: 매장 설정 (기존 컴포넌트 재활용) */}
      <StoreSettings storeId={currentStoreId} />
      
      <hr style={{ margin: '32px 0', borderColor: '#333' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 22, margin: 0 }}>💰 {year}년 {month}월 급여 대장</h2>
        
        <div style={{ display: 'flex', gap: 8 }}>
          {/* 월 이동 버튼 */}
          <button onClick={() => setMonth(m => m === 1 ? 12 : m - 1)} style={btnStyle}>◀ 전월</button>
          <span style={{ fontSize: 18, fontWeight: 'bold', alignSelf: 'center', minWidth: 80, textAlign: 'center' }}>{month}월</span>
          <button onClick={() => setMonth(m => m === 12 ? 1 : m + 1)} style={btnStyle}>익월 ▶</button>
          
          <div style={{ width: 20 }}></div>
          
          {/* 엑셀 다운로드 */}
          <button onClick={handleDownloadExcel} style={{ ...btnStyle, background: 'seagreen', color: '#fff', border: 'none' }}>
            📊 엑셀 다운로드
          </button>
        </div>
      </div>

      {/* 급여 테이블 */}
      {loading ? (
        <p>급여 계산 중...</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 1000 }}>
            <thead>
              <tr style={{ background: '#333', color: '#fff' }}>
                <th style={thStyle}>이름</th>
                <th style={thStyle}>시급</th>
                <th style={thStyle}>총 시간</th>
                <th style={thStyle}>기본급</th>
                <th style={thStyle}>주휴수당</th>
                <th style={thStyle}>야간수당</th>
                <th style={thStyle}>세전 급여</th>
                <th style={thStyle}>공제(세금)</th>
                <th style={{ ...thStyle, background: '#444', color: '#ffcc00' }}>실수령액</th>
                <th style={thStyle}>계좌정보</th>
              </tr>
            </thead>
            <tbody>
              {payrollData.map(p => (
                <tr key={p.empId} style={{ borderBottom: '1px solid #444' }}>
                  <td style={{ ...tdStyle, fontWeight: 'bold' }}>{p.name}</td>
                  <td style={tdStyle}>{p.wage.toLocaleString()}</td>
                  <td style={tdStyle}>{p.totalHours}</td>
                  <td style={tdStyle}>{p.basePay.toLocaleString()}</td>
                  <td style={{ ...tdStyle, color: '#81ecec' }}>{p.weeklyHolidayPay.toLocaleString()}</td>
                  <td style={{ ...tdStyle, color: '#fab1a0' }}>{p.nightPay.toLocaleString()}</td>
                  <td style={{ ...tdStyle, fontWeight: 'bold' }}>{(p.basePay + p.weeklyHolidayPay + p.nightPay).toLocaleString()}</td>
                  <td style={{ ...tdStyle, color: 'salmon' }}>- {p.tax.toLocaleString()}</td>
                  <td style={{ ...tdStyle, fontWeight: 'bold', color: '#ffeaa7', fontSize: 16 }}>{p.finalPay.toLocaleString()}</td>
                  <td style={{ ...tdStyle, fontSize: 12, color: '#aaa' }}>
                    {p.details.bank} {p.details.account}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <p style={{ fontSize: 13, color: '#777', marginTop: 12 }}>
        * 주휴수당은 주 15시간 이상 근무 시 자동 계산됩니다. (해당 주의 일요일이 포함된 월에 지급) <br/>
        * 야간수당(22:00~06:00)은 '5인 이상 사업장' 설정 시 1.5배 적용됩니다.
      </p>
    </div>
  );
}

const btnStyle = { padding: '8px 12px', background: '#333', border: '1px solid #555', color: '#fff', borderRadius: 4, cursor: 'pointer' };
const thStyle = { padding: '12px', border: '1px solid #555', textAlign: 'right' as const };
const tdStyle = { padding: '12px', border: '1px solid #555', textAlign: 'right' as const };