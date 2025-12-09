'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';

export default function InitialStoreSetup({ userId, onComplete }: { userId: string, onComplete: () => void }) {
  const supabase = createSupabaseBrowserClient();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [isFivePlus, setIsFivePlus] = useState(false);
  
  const [payWeekly, setPayWeekly] = useState(true); 
  const [payNight, setPayNight] = useState(false);   
  const [payHoliday, setPayHoliday] = useState(false); 
  const [payOvertime, setPayOvertime] = useState(false); 

  const handle5PlusChange = (checked: boolean) => {
    setIsFivePlus(checked);
    setPayNight(checked);
    setPayHoliday(checked);
    setPayOvertime(checked);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('매장 이름을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.from('stores').insert({
        owner_id: userId,
        name: name,
        is_five_plus: isFivePlus,      
        pay_weekly: payWeekly,
        pay_night: payNight,
        pay_holiday: payHoliday,
        pay_overtime: payOvertime,
        auto_deduct_break: true, 
        no_tax_deduction: false
      });

      if (error) throw error;

      alert('첫 매장이 등록되었습니다!');
      onComplete(); 
      
    } catch (e: any) {
      console.error(e);
      alert('매장 등록 중 오류가 발생했습니다.\n' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      {/* ✅ [수정] 메인 카드를 margin: 0 auto 로 확실하게 가운데 정렬 */}
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>🎉</div>
          <h2 style={{ color: '#111', margin: 0, fontSize: '22px', fontWeight: '800' }}>환영합니다, 사장님!</h2>
          <p style={{ color: '#666', marginTop: '6px', fontSize: '14px', lineHeight: '1.5' }}>
            관리할 첫 매장을 등록하고<br />
            쉽고 편한 알바 관리를 시작해보세요.
          </p>
        </div>

        <div style={sectionStyle}>
          <label style={labelStyle}>매장 이름</label>
          <input
            type="text"
            placeholder="예: 이지알바 강남점"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div 
          onClick={() => handle5PlusChange(!isFivePlus)}
          style={{ 
            ...checkboxRowStyle, 
            backgroundColor: isFivePlus ? '#eef6ff' : '#f9f9f9', 
            border: isFivePlus ? '1px solid #0052cc' : '1px solid #eee',
            padding: '16px',
            marginBottom: '20px',
            transition: 'all 0.2s',
            cursor: 'pointer'
          }}
        >
          <div style={{ marginTop: '2px' }}>
            <input
              type="checkbox"
              checked={isFivePlus}
              onChange={() => {}} 
              style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#0052cc' }}
            />
          </div>
          <div>
            <span style={{ fontSize: '15px', fontWeight: 'bold', color: isFivePlus ? '#0052cc' : '#333' }}>
              5인 이상 사업장입니다.
            </span>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#666', lineHeight: '1.4' }}>
              체크 시 가산수당(야간/휴일/연장 1.5배)이 자동으로 선택됩니다.
            </p>
          </div>
        </div>

        <label style={{ ...labelStyle, marginBottom: '10px', display: 'block' }}>수당 설정</label>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <CheckboxItem 
            label="주휴수당 지급" 
            subLabel="(주 15시간↑)" 
            checked={payWeekly} 
            onChange={setPayWeekly} 
          />
          <CheckboxItem 
            label="야간수당 지급" 
            subLabel="(1.5배)" 
            checked={payNight} 
            onChange={setPayNight} 
          />
          <CheckboxItem 
            label="휴일수당 지급" 
            subLabel="(1.5배)" 
            checked={payHoliday} 
            onChange={setPayHoliday} 
          />
          <CheckboxItem 
            label="연장수당 지급" 
            subLabel="(1.5배)" 
            checked={payOvertime} 
            onChange={setPayOvertime} 
          />
        </div>

        <button onClick={handleSave} disabled={loading} style={buttonStyle}>
          {loading ? '등록 중...' : '시작하기'}
        </button>
      </div>
    </div>
  );
}

function CheckboxItem({ label, subLabel, checked, onChange }: any) {
  return (
    <div 
      onClick={() => onChange(!checked)} 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px',
        padding: '12px 14px',
        borderRadius: '10px',
        backgroundColor: '#fff',
        border: checked ? '1px solid #0052cc' : '1px solid #eee',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={() => {}}
        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#0052cc' }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '15px', fontWeight: checked ? '600' : '400', color: '#333' }}>{label}</span>
        {subLabel && <span style={{ fontSize: '13px', color: '#888' }}>{subLabel}</span>}
      </div>
    </div>
  );
}

// --- 스타일 ---
const containerStyle = {
  display: 'flex', 
  justifyContent: 'center', 
  alignItems: 'flex-start', // ✅ [수정] 상단 정렬로 변경
  paddingTop: '10px',       // ✅ [수정] 위쪽 여백 60px 추가 (기존보다 위로 올라감)
  minHeight: '80vh',      
  width: '100%', 
  paddingLeft: '20px',      // 좌우 패딩 추가
  paddingRight: '20px',
  boxSizing: 'border-box' as const,
  backgroundColor: 'transparent'
};

const cardStyle = {
  backgroundColor: 'white', 
  padding: '32px 24px', 
  borderRadius: '20px',
  boxShadow: '0 10px 40px rgba(0,0,0,0.1)', 
  width: '100%', 
  maxWidth: '420px',
  margin: '0 auto' // ✅ [수정] 좌우 마진 자동 (가운데 정렬)
};

const sectionStyle = { marginBottom: '20px', display: 'flex', flexDirection: 'column' as const, gap: '8px' };
const labelStyle = { fontSize: '14px', fontWeight: 'bold', color: '#333' };
const inputStyle = { 
  padding: '14px', borderRadius: '10px', border: '1px solid #ddd', 
  fontSize: '16px', width: '100%', boxSizing: 'border-box' as const,
  outline: 'none', transition: 'border 0.2s'
};
const checkboxRowStyle = { display: 'flex', alignItems: 'flex-start', gap: '12px', borderRadius: '12px' };

const buttonStyle = {
  marginTop: '28px', width: '100%', padding: '16px', backgroundColor: '#0052cc', color: 'white',
  border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(0, 82, 204, 0.2)'
};