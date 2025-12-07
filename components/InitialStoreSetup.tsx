'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';

export default function InitialStoreSetup({ userId, onComplete }: { userId: string, onComplete: () => void }) {
  const supabase = createSupabaseBrowserClient();
  const [loading, setLoading] = useState(false);

  // ✅ 입력 값 상태 (DB 컬럼 및 급여 로직과 일치시킴)
  const [name, setName] = useState('');
  const [isFivePlus, setIsFivePlus] = useState(false);
  
  // ✅ 수당 설정 (기본값)
  const [payWeekly, setPayWeekly] = useState(true); 
  const [payNight, setPayNight] = useState(true);   
  const [payHoliday, setPayHoliday] = useState(true); 
  const [payOvertime, setPayOvertime] = useState(true); 

  // 5인 이상 체크 시 자동 설정 로직
  const handle5PlusChange = (checked: boolean) => {
    setIsFivePlus(checked);
    if (checked) {
      setPayNight(true);
      setPayHoliday(true);
      setPayOvertime(true);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('매장 이름을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);

      // ✅ [중요] 컬럼명을 calculateMonthlyPayroll 코드와 일치시켜서 저장
      const { error } = await supabase.from('stores').insert({
        user_id: userId,
        name: name,
        
        // 급여 계산 함수가 바라보는 컬럼명들 👇
        is_five_plus: isFivePlus,      
        pay_weekly: payWeekly,
        pay_night: payNight,
        pay_holiday: payHoliday,
        pay_overtime: payOvertime,
        
        // 초기값 설정 (급여 계산 코드에 있는 것들)
        auto_deduct_break: true, // 기본적으로 휴게시간 차감 활성화
        no_tax_deduction: false  // 기본적으로 세금 공제 함
      });

      if (error) throw error;

      alert('첫 매장이 등록되었습니다!');
      onComplete(); 
      
    } catch (e: any) {
      alert('매장 등록 중 오류가 발생했습니다.\n' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ color: '#0052cc', margin: 0, fontSize: '24px' }}>환영합니다, 사장님! 🎉</h2>
          <p style={{ color: '#666', marginTop: '10px' }}>
            관리할 첫 매장을 등록하고<br />
            쉽고 편한 알바 관리를 시작해보세요.
          </p>
        </div>

        {/* 매장 이름 입력 */}
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

        {/* 5인 이상 체크박스 (강조) */}
        <div style={{ ...checkboxRowStyle, backgroundColor: '#f0f7ff', border: '1px solid #cce5ff', padding: '15px' }}>
          <input
            type="checkbox"
            id="isFivePlus"
            checked={isFivePlus}
            onChange={(e) => handle5PlusChange(e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <label htmlFor="isFivePlus" style={{ ...textStyle, fontWeight: 'bold', color: '#0052cc' }}>
            5인 이상 사업장입니다.
            <span style={{ display: 'block', fontSize: '12px', color: '#666', fontWeight: 'normal', marginTop: '4px' }}>
              체크 시 가산수당(야간/휴일/연장 1.5배)이 자동으로 선택됩니다.
            </span>
          </label>
        </div>

        {/* 수당 상세 설정 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px' }}>
          <CheckboxItem label="주휴수당 지급 (주 15시간↑)" checked={payWeekly} onChange={setPayWeekly} />
          <CheckboxItem label="야간수당 지급 (1.5배)" checked={payNight} onChange={setPayNight} />
          <CheckboxItem label="휴일수당 지급 (1.5배)" checked={payHoliday} onChange={setPayHoliday} />
          <CheckboxItem label="연장수당 지급 (1.5배)" checked={payOvertime} onChange={setPayOvertime} />
        </div>

        <button onClick={handleSave} disabled={loading} style={buttonStyle}>
          {loading ? '등록 중...' : '시작하기'}
        </button>
      </div>
    </div>
  );
}

// ✅ 작은 체크박스 컴포넌트 (파일 내부에 포함)
function CheckboxItem({ label, checked, onChange }: any) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ cursor: 'pointer' }}
      />
      <span style={{ fontSize: '14px', color: '#333' }}>{label}</span>
    </div>
  );
}

// --- 스타일 (인라인) ---
const containerStyle = {
  display: 'flex', justifyContent: 'center', alignItems: 'center',
  minHeight: '80vh', width: '100%', padding: '20px', boxSizing: 'border-box' as const
};

const cardStyle = {
  backgroundColor: 'white', padding: '40px', borderRadius: '16px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)', width: '100%', maxWidth: '500px'
};

const sectionStyle = { marginBottom: '20px', display: 'flex', flexDirection: 'column' as const, gap: '8px' };
const labelStyle = { fontSize: '14px', fontWeight: 'bold', color: '#333' };
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px', width: '100%', boxSizing: 'border-box' as const };
const checkboxRowStyle = { display: 'flex', alignItems: 'flex-start', gap: '10px', borderRadius: '8px' };
const textStyle = { fontSize: '15px', color: '#333', cursor: 'pointer', lineHeight: '1.4' };
const buttonStyle = {
  marginTop: '30px', width: '100%', padding: '14px', backgroundColor: '#0052cc', color: 'white',
  border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer'
};