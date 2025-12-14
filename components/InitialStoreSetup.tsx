'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';

// ✅ 이미지 확장자 png 유지
const PROMO_IMAGES = [
  '1.png',
  '2.png',
  '3.png',
  '4.png',
  '5.png',
  '6.png'
];

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
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        // ✅ 배경 설정 (Parallax 고정, 밝은 톤 유지)
        backgroundImage: "url('/login-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed', 
        fontFamily: 'sans-serif',
        overflowY: 'auto',
        position: 'relative'
      }}
    >
      {/* 콘텐츠 영역 */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* 1. 매장 등록 카드 영역 */}
        <div style={{ 
            minHeight: '100vh', 
            width: '100%', 
            display: 'flex', 
            justifyContent: 'center',
            // ✅ [수정] center(중앙) 대신 flex-start(위쪽)로 변경하고 패딩으로 위치를 잡음
            alignItems: 'flex-start', 
            paddingTop: '-20px', // 이 숫자로 높이 조절 (기존 위치 고려하여 140px 설정)
            paddingBottom: '50px' 
        }}>
            <div style={cardStyle}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '32px', marginBottom: '4px' }}>🎉</div>
                <h2 style={{ color: '#111', margin: 0, fontSize: '20px', fontWeight: '800' }}>환영합니다, 사장님!</h2>
                <p style={{ color: '#666', marginTop: '4px', fontSize: '13px', lineHeight: '1.4' }}>
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
                    padding: '12px 14px',
                    marginBottom: '16px',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                }}
                >
                <div style={{ marginTop: '2px' }}>
                    <input
                    type="checkbox"
                    checked={isFivePlus}
                    onChange={() => {}} 
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#0052cc' }}
                    />
                </div>
                <div>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: isFivePlus ? '#0052cc' : '#333' }}>
                    5인 이상 사업장입니다.
                    </span>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#666', lineHeight: '1.3' }}>
                    체크 시 가산수당(야간/휴일/연장 1.5배)이 자동으로 선택됩니다.
                    </p>
                </div>
                </div>

                <label style={{ ...labelStyle, marginBottom: '8px', display: 'block' }}>수당 설정</label>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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

        {/* 2. 홍보 이미지 리스트 (스크롤 내리면 보임) */}
        <div style={{ width: '100%', maxWidth: '800px', padding: '0 20px 100px 20px', display: 'flex', flexDirection: 'column', gap: '0' }}>
            <div style={{ color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginBottom: '20px', fontSize: '14px', fontWeight: 'bold', animation: 'bounce 2s infinite' }}>
             ▼ 서비스 소개 자세히 보기
            </div>

            {PROMO_IMAGES.map((src, index) => (
                <img 
                    key={index}
                    src={`/${src}`} 
                    alt={`Easy Alba 소개 ${index + 1}`}
                    style={{ 
                        width: '100%', 
                        height: 'auto', 
                        display: 'block',
                        marginBottom: '-1px' 
                    }} 
                />
            ))}
        </div>

        <div 
            style={{ 
            width: '100%', 
            textAlign: 'center',
            color: 'rgba(255,255,255,0.6)', 
            fontSize: '11px',
            lineHeight: '1.5',
            paddingBottom: '40px'
            }}
        >
            © 2025 Easy Alba. All rights reserved.<br />
        </div>

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
        gap: '10px',
        padding: '10px 12px',
        borderRadius: '8px',
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
        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#0052cc' }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '14px', fontWeight: checked ? '600' : '400', color: '#333' }}>{label}</span>
        {subLabel && <span style={{ fontSize: '12px', color: '#888' }}>{subLabel}</span>}
      </div>
    </div>
  );
}

// --- 스타일 ---
const cardStyle = {
  backgroundColor: 'white', 
  padding: '24px 20px', 
  borderRadius: '16px',
  boxShadow: '0 10px 40px rgba(0,0,0,0.1)', 
  width: '90%', 
  maxWidth: '400px', 
  margin: '0 auto',
};

const sectionStyle = { marginBottom: '16px', display: 'flex', flexDirection: 'column' as const, gap: '6px' };
const labelStyle = { fontSize: '13px', fontWeight: 'bold', color: '#333' };
const inputStyle = { 
  padding: '12px', borderRadius: '8px', border: '1px solid #ddd', 
  fontSize: '15px', width: '100%', boxSizing: 'border-box' as const,
  outline: 'none', transition: 'border 0.2s'
};
const checkboxRowStyle = { display: 'flex', alignItems: 'flex-start', gap: '10px', borderRadius: '10px' };

const buttonStyle = {
  marginTop: '24px', width: '100%', padding: '14px', backgroundColor: '#0052cc', color: 'white',
  border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(0, 82, 204, 0.2)'
};