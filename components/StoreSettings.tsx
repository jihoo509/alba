'use client';

import React, { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';

type Props = {
  storeId: string;
};

export default function StoreSettings({ storeId }: Props) {
  const supabase = createSupabaseBrowserClient();
  const [loading, setLoading] = useState(false);

  // 설정 상태값들
  const [isFivePlus, setIsFivePlus] = useState(false);
  const [payWeekly, setPayWeekly] = useState(true);
  const [payNight, setPayNight] = useState(false);
  const [payHoliday, setPayHoliday] = useState(false);
  const [payOvertime, setPayOvertime] = useState(false);
  // ✅ [추가] 휴게시간 자동 차감
  const [autoDeductBreak, setAutoDeductBreak] = useState(true);

  // 1. 설정 가져오기
  useEffect(() => {
    const loadSettings = async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('*') // 모든 컬럼 가져옴
        .eq('id', storeId)
        .single();

      if (data && !error) {
        setIsFivePlus(data.is_five_plus);
        setPayWeekly(data.pay_weekly);
        setPayNight(data.pay_night);
        setPayHoliday(data.pay_holiday);
        setPayOvertime(data.pay_overtime);
        // ✅ DB 값 적용 (없으면 true)
        setAutoDeductBreak(data.auto_deduct_break ?? true);
      }
    };
    loadSettings();
  }, [storeId, supabase]);

  // 2. 저장하기
  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('stores')
      .update({
        is_five_plus: isFivePlus,
        pay_weekly: payWeekly,
        pay_night: payNight,
        pay_holiday: payHoliday,
        pay_overtime: payOvertime,
        auto_deduct_break: autoDeductBreak, // ✅ 저장
      })
      .eq('id', storeId);

    setLoading(false);
    if (error) alert('저장 실패: ' + error.message);
    else alert('설정이 저장되었습니다!');
  };

  const handleFivePlusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsFivePlus(checked);
    if (checked) {
      setPayNight(true);
      setPayHoliday(true);
      setPayOvertime(true);
    } else {
      setPayNight(false);
      setPayHoliday(false);
      setPayOvertime(false);
    }
  };

  return (
    <div style={{ marginTop: 20, padding: 24, border: '1px solid #444', borderRadius: 8, background: '#1a1a1a' }}>
      <h3 style={{ marginTop: 0, marginBottom: 16 }}>매장 급여/수당 설정</h3>
      
      <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px dashed #444' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 'bold', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={isFivePlus}
            onChange={handleFivePlusChange}
            style={{ width: 18, height: 18 }}
          />
          5인 이상 사업장입니다.
        </label>
        <p style={{ margin: '4px 0 0 28px', fontSize: 13, color: '#888' }}>
          체크 시 가산수당(야간/휴일/연장 1.5배)이 자동으로 선택됩니다.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={payWeekly} onChange={(e) => setPayWeekly(e.target.checked)} />
          주휴수당 지급 (주 15시간↑)
        </label>

        {/* ✅ [추가] 휴게시간 설정 */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={autoDeductBreak} onChange={(e) => setAutoDeductBreak(e.target.checked)} />
          휴게시간 자동 차감 (4시간/30분, 8시간/1시간)
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={payNight} onChange={(e) => setPayNight(e.target.checked)} />
          야간수당 지급 (1.5배)
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={payHoliday} onChange={(e) => setPayHoliday(e.target.checked)} />
          휴일수당 지급 (1.5배)
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={payOvertime} onChange={(e) => setPayOvertime(e.target.checked)} />
          연장수당 지급 (1.5배)
        </label>
      </div>

      <div style={{ marginTop: 24, textAlign: 'right' }}>
        <button
          onClick={handleSave}
          disabled={loading}
          style={{
            padding: '10px 24px',
            background: 'royalblue',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 15,
            fontWeight: 'bold'
          }}
        >
          {loading ? '저장 중...' : '설정 저장하기'}
        </button>
      </div>
    </div>
  );
}