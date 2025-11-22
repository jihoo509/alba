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

  // 1. 처음 로딩 시 DB에서 설정 가져오기
  useEffect(() => {
    const loadSettings = async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('is_five_plus, pay_weekly, pay_night, pay_holiday, pay_overtime')
        .eq('id', storeId)
        .single();

      if (data && !error) {
        setIsFivePlus(data.is_five_plus);
        setPayWeekly(data.pay_weekly);
        setPayNight(data.pay_night);
        setPayHoliday(data.pay_holiday);
        setPayOvertime(data.pay_overtime);
      }
    };
    loadSettings();
  }, [storeId, supabase]);

  // 2. 저장하기 버튼 클릭
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
      })
      .eq('id', storeId);

    setLoading(false);
    if (error) {
      alert('설정 저장 실패: ' + error.message);
    } else {
      alert('매장 급여 설정이 저장되었습니다!');
    }
  };

  // 3. "5인 이상" 체크 시 자동 세팅 로직
  const handleFivePlusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsFivePlus(checked);

    if (checked) {
      // 5인 이상이면 법적으로 줘야 할 것들 자동 체크 (편의 기능)
      setPayNight(true);
      setPayHoliday(true);
      setPayOvertime(true);
    } else {
      // 5인 미만으로 바꾸면 일단 꺼줌 (원하면 다시 켤 수 있음)
      setPayNight(false);
      setPayHoliday(false);
      setPayOvertime(false);
    }
  };

  return (
    <div style={{ marginTop: 20, padding: 24, border: '1px solid #444', borderRadius: 8, background: '#1a1a1a' }}>
      <h3 style={{ marginTop: 0, marginBottom: 16 }}>매장 급여/수당 설정</h3>
      
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, fontWeight: 'bold', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={isFivePlus}
            onChange={handleFivePlusChange}
            style={{ width: 20, height: 20 }}
          />
          5인 이상 사업장입니다.
        </label>
        <p style={{ margin: '4px 0 0 28px', fontSize: 13, color: '#888' }}>
          체크 시 야간/휴일/연장 수당이 자동으로 선택됩니다. (근로기준법 기준)
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={payWeekly} onChange={(e) => setPayWeekly(e.target.checked)} />
          주휴수당 지급
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
            fontSize: 16,
            fontWeight: 'bold'
          }}
        >
          {loading ? '저장 중...' : '설정 저장하기'}
        </button>
      </div>
    </div>
  );
}