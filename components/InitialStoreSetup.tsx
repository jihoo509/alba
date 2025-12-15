'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';

const FEATURES = [
  {
    title: "직원 & 알바 관리, 평생 무료로 시작하세요",
    desc: "복잡한 직원 관리, 아직도 엑셀로 하시나요? 이지알바는 직원 등록부터 급여 명세서 생성까지 모든 기능을 무료로 제공합니다. PC와 모바일 어디서든 사장님의 매장을 효율적으로 관리해보세요.",
    img: "1.png"
  },
  {
    title: "이메일 & 카카오로 3초 간편 가입",
    desc: "복잡한 절차 없이 구글, 카카오 계정으로 3초 만에 시작할 수 있습니다. 별도의 설치가 필요 없는 웹 기반 서비스로, 언제 어디서나 즉시 접속하여 매장 현황을 파악할 수 있습니다.",
    img: "2.png"
  },
  {
    title: "복잡한 직원 정보, 한 페이지에서 끝",
    desc: "이름, 연락처, 시급, 입사일 등 흩어져 있는 직원 정보를 한눈에 관리하세요. 근로계약서 작성에 필요한 필수 정보들을 체계적으로 정리하여 보관할 수 있습니다.",
    img: "3.png"
  },
  {
    title: "근무 패턴 생성으로 스케줄 자동화",
    desc: "오픈조, 미들조, 마감조 등 매장의 고정된 근무 패턴을 미리 만들어두세요. 매번 새로 짤 필요 없이, 만들어둔 패턴을 직원에 할당하기만 하면 시간표가 완성됩니다.",
    img: "4.png"
  },
  {
    title: "클릭 한 번으로 월별 스케줄 완성",
    desc: "설정해둔 근무 패턴과 직원 데이터를 바탕으로 달력에 스케줄을 자동으로 생성합니다. 급하게 대타가 필요하거나 근무가 변경되어도 드래그 앤 드롭으로 손쉽게 수정할 수 있습니다.",
    img: "5.png"
  },
  {
    title: "급여 명세서 자동 생성 및 발송",
    desc: "가장 골치 아픈 급여 계산, 이제 자동으로 해결하세요. 주휴수당, 야간수당, 연장수당 등 복잡한 가산 수당이 법 기준에 맞춰 자동으로 계산되며, 급여 명세서까지 원클릭으로 생성됩니다.",
    img: "6.png"
  }
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

  // ✅ 타이틀 공통 스타일
  const titleStyle = {
    fontSize: '32px',          
    fontWeight: '900',         
    color: '#fff',             
    textAlign: 'center' as const,
    marginBottom: '60px',
    textShadow: '0 2px 10px rgba(0,0,0,0.5)', 
    letterSpacing: '-1px',
    lineHeight: '1.3',
    wordBreak: 'keep-all' as const // ✅ 타이틀도 단어 단위 줄바꿈
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        fontFamily: 'sans-serif',
        position: 'relative',
        // ✅ [수정] 스크롤바가 생기지 않도록 가로 넘침 방지
        overflowX: 'hidden', 
      }}
    >
      {/* ✅ [핵심 수정 1] 배경 이미지 분리 (모바일 울렁거림 해결)
        - position: fixed로 화면 뒤에 딱 고정시킵니다.
        - zIndex: -1로 모든 콘텐츠 뒤로 보냅니다.
      */}
      <div 
        style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: -1,
        }}
      >
        {/* 실제 배경 이미지 */}
        <img 
            src="/login-bg.jpg" 
            alt="background"
            style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover', // 비율 유지하면서 꽉 채우기
            }}
        />
        {/* ✅ [핵심 수정 2] 가독성을 위한 어두운 오버레이
          - 배경 이미지 위에 60% 투명도의 검은색을 덮습니다.
          - 이렇게 하면 흰색 글씨가 아주 선명하게 보입니다.
        */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' }}></div>
      </div>


      {/* 실제 콘텐츠 영역 */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* 1. 매장 등록 카드 */}
        <div style={{ 
            width: '100%', 
            display: 'flex', 
            justifyContent: 'center',
            alignItems: 'flex-start', 
            paddingTop: '10px', 
            paddingBottom: '40px' 
        }}>
            <div style={cardStyle}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '32px', marginBottom: '4px' }}>🎉</div>
                <h2 style={{ color: '#111', margin: 0, fontSize: '20px', fontWeight: '800' }}>환영합니다, 사장님!</h2>
                <p style={{ color: '#666', marginTop: '4px', fontSize: '13px', lineHeight: '1.4', wordBreak: 'keep-all' }}>
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
                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#666', lineHeight: '1.3', wordBreak: 'keep-all' }}>
                    체크 시 가산수당(야간/휴일/연장 1.5배)이 자동으로 선택됩니다.
                    </p>
                </div>
                </div>

                <label style={{ ...labelStyle, marginBottom: '8px', display: 'block' }}>수당 설정</label>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <CheckboxItem label="주휴수당 지급" subLabel="(주 15시간↑)" checked={payWeekly} onChange={setPayWeekly} />
                <CheckboxItem label="야간수당 지급" subLabel="(1.5배)" checked={payNight} onChange={setPayNight} />
                <CheckboxItem label="휴일수당 지급" subLabel="(1.5배)" checked={payHoliday} onChange={setPayHoliday} />
                <CheckboxItem label="연장수당 지급" subLabel="(1.5배)" checked={payOvertime} onChange={setPayOvertime} />
                </div>

                <button onClick={handleSave} disabled={loading} style={buttonStyle}>
                {loading ? '등록 중...' : '시작하기'}
                </button>
            </div>
        </div>

        {/* 2. 기능 소개 섹션 */}
        <div style={{ width: '100%', padding: '60px 0', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '80px', padding: '0 20px' }}>
                
                {/* ✅ [수정] 모바일에서만 줄바꿈이 일어나도록 <br> 처리 */}
                <h2 style={titleStyle}>
                    이지알바,<br className='mobile-only'/> 왜 써야 할까요?
                </h2>
                
                {FEATURES.map((feature, index) => (
                    <div key={index} style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        flexDirection: index % 2 === 0 ? 'row' : 'row-reverse',
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: '40px',
                        width: '100%',
                    }}>
                        {/* 텍스트 영역 */}
                        <div style={{ 
                            flex: '1 1 300px', 
                            maxWidth: '100%',
                            padding: '10px',
                            // ✅ 텍스트 가독성을 위해 살짝 그림자 추가
                            textShadow: '0 1px 4px rgba(0,0,0,0.8)' 
                        }}>
                            <h3 style={{ 
                                fontSize: '22px', 
                                fontWeight: '800', 
                                color: '#fff', // 흰색으로 변경 (어두운 배경 위)
                                marginBottom: '16px',
                                // ✅ [핵심 수정] 단어 중간에 끊기지 않게 함
                                wordBreak: 'keep-all',
                                lineHeight: '1.4'
                            }}>
                                {feature.title}
                            </h3>
                            <p style={{ 
                                fontSize: '16px', 
                                lineHeight: '1.7', 
                                color: '#eee', // 아주 밝은 회색
                                // ✅ [핵심 수정] 단어 중간에 끊기지 않게 함
                                wordBreak: 'keep-all', 
                                margin: 0,
                                opacity: 0.9 
                            }}>
                                {feature.desc}
                            </p>
                        </div>

                        {/* 이미지 영역 */}
                        <div style={{ 
                            flex: '1 1 300px', 
                            display: 'flex', 
                            justifyContent: 'center',
                            maxWidth: '100%' 
                        }}>
                            <img 
                                src={`/${feature.img}`} 
                                alt={feature.title}
                                style={{ 
                                    width: '100%', 
                                    maxWidth: '450px', 
                                    height: 'auto', 
                                    borderRadius: '12px',
                                    // ✅ 이미지가 배경에 묻히지 않게 그림자 강화
                                    boxShadow: '0 15px 35px rgba(0,0,0,0.5)' 
                                }} 
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* 3. 자주 묻는 질문 (FAQ) */}
        <div style={{ width: '100%', padding: '60px 0', display: 'flex', justifyContent: 'center' }}>
            <div style={{ maxWidth: '1000px', width: '100%', padding: '0 20px' }}>
                <h2 style={titleStyle}>자주 묻는 질문</h2>
                <FaqItem q="5인 미만 사업장도 사용할 수 있나요?" a="네, 가능합니다. 매장 설정에서 '5인 이상 사업장' 체크를 해제하시면 야간, 휴일, 연장 수당 가산 없이 시급과 주휴수당만 계산됩니다." />
                <FaqItem q="정말 무료인가요?" a="네, 이지알바의 모든 기능은 현재 무료로 제공되고 있습니다. 직원 등록 수나 스케줄 생성 횟수에 제한이 없습니다." />
                <FaqItem q="모바일에서도 되나요?" a="네, PC와 모바일, 태블릿 등 기기에 상관없이 웹 브라우저만 있으면 어디서든 접속하여 관리할 수 있습니다." />
                <FaqItem q="급여 명세서는 어떻게 보내나요?" a="자동 생성된 급여 명세서는 이미지로 저장이 가능하며, 카카오톡이나 문자로 직원에게 바로 공유할 수 있습니다." />
            </div>
        </div>

      </div>

      <style jsx global>{`
        /* 모바일에서만 줄바꿈 되도록 하는 유틸리티 클래스 */
        @media (min-width: 768px) {
            .mobile-only {
                display: none;
            }
        }
      `}</style>
    </div>
  );
}

// FAQ 아이템 컴포넌트
function FaqItem({ q, a }: { q: string, a: string }) {
    return (
        <div style={{ marginBottom: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.3)', paddingBottom: '20px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#fff', wordBreak: 'keep-all', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>Q. {q}</h4>
            <p style={{ margin: 0, fontSize: '14px', color: '#ddd', lineHeight: '1.5', wordBreak: 'keep-all', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>A. {a}</p>
        </div>
    );
}

function CheckboxItem({ label, subLabel, checked, onChange }: any) {
  return (
    <div 
      onClick={() => onChange(!checked)} 
      style={{ 
        display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
        borderRadius: '8px', backgroundColor: '#fff',
        border: checked ? '1px solid #0052cc' : '1px solid #eee',
        cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
      }}
    >
      <input type="checkbox" checked={checked} onChange={() => {}} style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#0052cc' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '14px', fontWeight: checked ? '600' : '400', color: '#333' }}>{label}</span>
        {subLabel && <span style={{ fontSize: '12px', color: '#888' }}>{subLabel}</span>}
      </div>
    </div>
  );
}

const cardStyle = {
  backgroundColor: 'white', padding: '24px 20px', borderRadius: '16px',
  boxShadow: '0 10px 40px rgba(0,0,0,0.3)', width: '90%', maxWidth: '400px', margin: '0 auto',
};
const sectionStyle = { marginBottom: '16px', display: 'flex', flexDirection: 'column' as const, gap: '6px' };
const labelStyle = { fontSize: '13px', fontWeight: 'bold', color: '#333' };
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px', width: '100%', boxSizing: 'border-box' as const, outline: 'none', transition: 'border 0.2s' };
const checkboxRowStyle = { display: 'flex', alignItems: 'flex-start', gap: '10px', borderRadius: '10px' };
const buttonStyle = { marginTop: '24px', width: '100%', padding: '14px', backgroundColor: '#0052cc', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0, 82, 204, 0.2)' };