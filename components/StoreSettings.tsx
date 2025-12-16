'use client';

import React, { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';

type Props = {
  storeId: string;
  onUpdate?: () => void;
};

export default function StoreSettings({ storeId, onUpdate }: Props) {
  const supabase = createSupabaseBrowserClient();
  const [loading, setLoading] = useState(false);

  // 기존 설정
  const [isFivePlus, setIsFivePlus] = useState(false);
  const [payWeekly, setPayWeekly] = useState(true);
  const [payNight, setPayNight] = useState(false);
  const [payHoliday, setPayHoliday] = useState(false);
  const [payOvertime, setPayOvertime] = useState(false);
  const [autoDeductBreak, setAutoDeductBreak] = useState(true);
  const [noTaxDeduction, setNoTaxDeduction] = useState(false);

  // ✅ 신규 설정: 급여 형태 및 기준일
  const [payRuleType, setPayRuleType] = useState('month'); // 'month' | 'week'
  const [payRuleStartDay, setPayRuleStartDay] = useState(1); // 1~28

  useEffect(() => {
    const loadSettings = async () => {
      const { data, error } = await supabase.from('stores').select('*').eq('id', storeId).single();
      if (data && !error) {
        setIsFivePlus(data.is_five_plus);
        setPayWeekly(data.pay_weekly);
        setPayNight(data.pay_night);
        setPayHoliday(data.pay_holiday);
        setPayOvertime(data.pay_overtime);
        setAutoDeductBreak(data.auto_deduct_break ?? true);
        setNoTaxDeduction(data.no_tax_deduction || false);
        
        // 신규 컬럼 로드 (없으면 기본값)
        setPayRuleType(data.pay_rule_type || 'month');
        setPayRuleStartDay(data.pay_rule_start_day || 1);
      }
    };
    loadSettings();
  }, [storeId, supabase]);

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase.from('stores').update({
      is_five_plus: isFivePlus, pay_weekly: payWeekly, pay_night: payNight,
      pay_holiday: payHoliday, pay_overtime: payOvertime, auto_deduct_break: autoDeductBreak,
      no_tax_deduction: noTaxDeduction,
      // 신규 컬럼 저장
      pay_rule_type: payRuleType,
      pay_rule_start_day: payRuleStartDay
    }).eq('id', storeId);

    setLoading(false);
    if (error) alert('저장 실패: ' + error.message);
    else {
      alert('설정이 저장되었습니다!');
      if (onUpdate) onUpdate();
    }
  };

  const handleFivePlusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsFivePlus(checked);
    if (checked) { setPayNight(true); setPayHoliday(true); setPayOvertime(true); } 
    else { setPayNight(false); setPayHoliday(false); setPayOvertime(false); }
  };

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 18, color: '#333' }}>⚙️ 매장 급여/수당 설정</h3>
        <button onClick={handleSave} disabled={loading} style={saveBtnStyle}>
          {loading ? '저장 중...' : '저장'}
        </button>
      </div>
      
      {/* 1. 급여 정산 기준 (New) */}
      <div style={{ marginBottom: 16, padding: '12px', background: '#eef2ff', borderRadius: 8, border: '1px solid #dae1ff' }}>
        <div style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 8, color: '#333' }}>📅 급여 정산 기준일 설정</div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{color:'#555'}}>정산 형태:</span>
                <select 
                    value={payRuleType} 
                    onChange={(e) => setPayRuleType(e.target.value)}
                    style={selectStyle}
                >
                    <option value="month">월급제 (매월 지정일 시작)</option>
                    <option value="week">주급제 (주 단위 정산)</option>
                </select>
            </label>

            {payRuleType === 'month' && (
                <label style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{color:'#555'}}>시작일: 매월</span>
                    <select 
                        value={payRuleStartDay} 
                        onChange={(e) => setPayRuleStartDay(Number(e.target.value))}
                        style={selectStyle}
                    >
                        {Array.from({length: 28}, (_, i) => i + 1).map(d => (
                            <option key={d} value={d}>{d}일</option>
                        ))}
                    </select>
                    <span style={{color:'#555'}}>부터 ~ 익월 {payRuleStartDay - 1 === 0 ? '말일' : payRuleStartDay - 1 + '일'}까지</span>
                </label>
            )}
             {payRuleType === 'week' && (
                <span style={{ fontSize: 12, color: '#666' }}>※ 주급제는 월요일~일요일 단위로 계산합니다.</span>
            )}
        </div>
      </div>

      {/* 5인 이상 사업장 체크 */}
      <div style={{ padding: '12px 16px', backgroundColor: '#f9f9f9', borderRadius: 8, border: '1px solid #eee', marginBottom: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 'bold', cursor: 'pointer', color: '#000' }}>
          <input type="checkbox" checked={isFivePlus} onChange={handleFivePlusChange} style={{ width: 18, height: 18, cursor: 'pointer' }} />
          5인 이상 사업장입니다.
        </label>
        <p style={{ margin: '4px 0 0 26px', fontSize: 12, color: '#666' }}>
          체크 시 가산수당(야간/휴일/연장 1.5배)이 자동으로 선택됩니다.
        </p>
      </div>

      {/* 설정 그리드 */}
      <div style={gridStyle}>
        <label style={checkboxLabelStyle}>
          <input type="checkbox" checked={payWeekly} onChange={(e) => setPayWeekly(e.target.checked)} style={checkboxStyle} />
          주휴수당 지급 (주 15시간↑)
        </label>
        <label style={checkboxLabelStyle}>
          <input type="checkbox" checked={autoDeductBreak} onChange={(e) => setAutoDeductBreak(e.target.checked)} style={checkboxStyle} />
          휴게시간 자동 차감 (4h/30m)
        </label>
        <label style={checkboxLabelStyle}>
          <input type="checkbox" checked={payNight} onChange={(e) => setPayNight(e.target.checked)} style={checkboxStyle} />
          야간수당 지급 (1.5배)
        </label>
        <label style={checkboxLabelStyle}>
          <input type="checkbox" checked={payHoliday} onChange={(e) => setPayHoliday(e.target.checked)} style={checkboxStyle} />
          휴일수당 지급 (1.5배)
        </label>
        <label style={checkboxLabelStyle}>
          <input type="checkbox" checked={payOvertime} onChange={(e) => setPayOvertime(e.target.checked)} style={checkboxStyle} />
          연장수당 지급 (1.5배)
        </label>
        <label style={{ ...checkboxLabelStyle, color: 'crimson', fontWeight: 'bold' }}>
          <input type="checkbox" checked={noTaxDeduction} onChange={(e) => setNoTaxDeduction(e.target.checked)} style={checkboxStyle} />
          세금(4대보험/소득세) 공제 안 함
        </label>
      </div>
    </div>
  );
}

const checkboxLabelStyle = { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#333', fontSize: '14px', padding: '8px 0' };
const checkboxStyle = { transform: 'scale(1.2)', cursor: 'pointer' };
const saveBtnStyle = { padding: '8px 20px', background: 'dodgerblue', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 'bold' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '8px 24px' };
const selectStyle = { padding: '4px 8px', borderRadius: 4, border: '1px solid #ccc', fontSize: 14 };