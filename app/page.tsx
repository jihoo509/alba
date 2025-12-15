'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import SignupModal from '@/components/SignupModal';

type OAuthProvider = 'google' | 'kakao';

// ✅ 새로 추가된 기능 소개 데이터 (이미지 + 텍스트)
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

export default function AuthPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [rememberId, setRememberId] = useState(false);

  // 초기 로딩 시 자동 로그인 로직
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('logout') === 'true') {
        window.history.replaceState(null, '', '/');
        const savedEmail = localStorage.getItem('savedEmail');
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberId(true);
        }
        return; 
    }

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace('/dashboard');
        return;
      }
      const savedEmail = localStorage.getItem('savedEmail');
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberId(true);
      }
    };
    checkSession();
  }, [supabase, router]);

  async function handleLogin() {
    try {
      setMsg(null);
      setLoading(true);

      if (rememberId) {
        localStorage.setItem('savedEmail', email);
      } else {
        localStorage.removeItem('savedEmail');
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.log('로그인 에러:', error.message);
        switch (error.message) {
          case 'Invalid login credentials':
            setMsg('아이디(이메일) 또는 비밀번호가 일치하지 않습니다.');
            break;
          case 'Email not confirmed':
            setMsg('이메일 인증이 완료되지 않았습니다. 메일함을 확인해주세요.');
            break;
          case 'User not found':
            setMsg('가입되지 않은 이메일입니다.');
            break;
          default:
            setMsg('로그인 중 오류가 발생했습니다. (' + error.message + ')');
        }
        return;
      }
      router.push('/dashboard');
    } catch (e: any) {
      setMsg(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(signupEmail: string, signupPw: string, signupPhone: string) {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPw,
        options: {
            data: {
                phone: signupPhone,
            }
        }
      });

      if (error) throw error;

      if (!data.session) {
        alert('가입 확인 메일을 보냈습니다. 이메일을 확인해주세요.');
        setIsSignupOpen(false);
      } else {
        router.push('/dashboard');
      }
    } catch (e: any) {
      alert(e?.message || '회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuthLogin(provider: OAuthProvider) {
    try {
      setMsg(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (e: any) {
      setMsg(e?.message || String(e));
    }
  }

  // ✅ 밝은 배경용 타이틀 스타일
  const titleStyle = {
    fontSize: '32px',          
    fontWeight: '900',         
    color: '#333', // 검은색 글씨            
    textAlign: 'center' as const,
    marginBottom: '60px',
    letterSpacing: '-1px',
    lineHeight: '1.3',
    wordBreak: 'keep-all' as const
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        fontFamily: 'sans-serif',
        position: 'relative',
        overflowX: 'hidden', // 가로 스크롤 방지
      }}
    >
      {/* ✅ [모바일 흔들림 방지] 배경 이미지 고정
         - background-attachment: fixed 대신 position: fixed 사용
         - 어두운 오버레이(black background)는 제거함
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
        <img 
            src="/login-bg.jpg" 
            alt="background"
            style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
            }}
        />
      </div>

      {/* 실제 콘텐츠 영역 */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* 1. 로그인 박스 영역 (기존 코드 유지) */}
        <div style={{ 
            width: '100%', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'flex-start', 
            paddingTop: '60px', 
            paddingBottom: '40px' 
        }}>
            <div
                style={{
                position: 'relative',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                padding: '32px 28px',
                borderRadius: '16px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                width: '90%',
                maxWidth: '360px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '4px' }}>
                <h3 style={{ margin: 0, color: '#666', fontSize: '13px', fontWeight: 'normal' }}>직원 관리가 쉬워진다</h3>
                <h1 style={{ margin: '2px 0 0 0', color: '#0052cc', fontSize: '28px', fontWeight: '800', letterSpacing: '-1px' }}>
                    Easy Alba
                </h1>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                    type="email"
                    placeholder="이메일"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle}
                />
                <input
                    type="password"
                    placeholder="비밀번호"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    style={inputStyle}
                />
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input 
                    type="checkbox" 
                    id="rememberId" 
                    checked={rememberId} 
                    onChange={(e) => setRememberId(e.target.checked)}
                    style={{ cursor: 'pointer' }} 
                />
                <label htmlFor="rememberId" style={{ fontSize: '13px', color: '#555', cursor: 'pointer' }}>아이디 기억하기</label>
                </div>

                {msg && <div style={{ color: 'salmon', fontSize: '12px', textAlign: 'center' }}>{msg}</div>}

                <button
                    onClick={handleLogin}
                    disabled={loading}
                    style={{
                        padding: '12px',
                        backgroundColor: '#0052cc', 
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '15px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        marginTop: '4px',
                        transition: 'background-color 0.2s',
                    }}
                >
                {loading ? '처리 중...' : '로그인'}
                </button>

                <div style={{ textAlign: 'center', fontSize: '12px', color: '#666' }}>
                아직 계정이 없으신가요?
                <span 
                    onClick={() => { setIsSignupOpen(true); setMsg(null); }}
                    style={{ color: '#0052cc', fontWeight: 'bold', cursor: 'pointer', marginLeft: '6px', textDecoration: 'underline' }}
                >
                    회원가입하기
                </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', margin: '10px 0' }}>
                <div style={{ flex: 1, height: '1px', background: '#ddd' }}></div>
                <span style={{ padding: '0 10px', color: '#999', fontSize: '11px' }}>간편 로그인</span>
                <div style={{ flex: 1, height: '1px', background: '#ddd' }}></div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button onClick={() => handleOAuthLogin('google')} style={{ ...socialBtnStyle, background: '#c0c0c0ff', border: '1px solid #ddd', color: '#333' }}>
                    <span style={{ marginRight: '8px', fontWeight: 'bold', color: '#ea4335' }}>G</span> Google 계정으로 계속
                </button>
                <button onClick={() => handleOAuthLogin('kakao')} style={{ ...socialBtnStyle, background: '#FEE500', color: '#333' }}>
                    <span style={{ marginRight: '8px', fontWeight: 'bold', color: '#3c1e1e' }}>K</span> Kakao 계정으로 계속
                </button>
                </div>
            </div>
        </div>

        {/* 2. 기능 소개 섹션 (흰색 배경) */}
        <div style={{ width: '100%', backgroundColor: '#fff', padding: '60px 0', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '80px', padding: '0 20px' }}>
                
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
                        }}>
                            <h3 style={{ 
                                fontSize: '22px', 
                                fontWeight: '800', 
                                color: '#0052cc', // 파란색 포인트
                                marginBottom: '16px',
                                wordBreak: 'keep-all',
                                lineHeight: '1.4'
                            }}>
                                {feature.title}
                            </h3>
                            <p style={{ 
                                fontSize: '16px', 
                                lineHeight: '1.7', 
                                color: '#555', // 진한 회색
                                wordBreak: 'keep-all', 
                                margin: 0,
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
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.15)' 
                                }} 
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* 3. 자주 묻는 질문 (FAQ, 회색 배경) */}
        <div style={{ width: '100%', backgroundColor: '#f9f9f9', padding: '60px 0', display: 'flex', justifyContent: 'center' }}>
            <div style={{ maxWidth: '1000px', width: '100%', padding: '0 20px' }}>
                <h2 style={titleStyle}>자주 묻는 질문</h2>
                <FaqItem q="5인 미만 사업장도 사용할 수 있나요?" a="네, 가능합니다. 매장 설정에서 '5인 이상 사업장' 체크를 해제하시면 야간, 휴일, 연장 수당 가산 없이 시급과 주휴수당만 계산됩니다." />
                <FaqItem q="정말 무료인가요?" a="네, 이지알바의 모든 기능은 현재 무료로 제공되고 있습니다. 직원 등록 수나 스케줄 생성 횟수에 제한이 없습니다." />
                <FaqItem q="모바일에서도 되나요?" a="네, PC와 모바일, 태블릿 등 기기에 상관없이 웹 브라우저만 있으면 어디서든 접속하여 관리할 수 있습니다." />
                <FaqItem q="급여 명세서는 어떻게 보내나요?" a="자동 생성된 급여 명세서는 이미지로 저장이 가능하며, 카카오톡이나 문자로 직원에게 바로 공유할 수 있습니다." />
                
                {/* 저작권 문구 */}
                <div 
                    style={{ 
                    width: '100%', 
                    textAlign: 'center',
                    color: '#999', 
                    fontSize: '12px',
                    lineHeight: '1.5',
                    marginTop: '60px'
                    }}
                >
                    © 2025 Easy Alba. All rights reserved.<br />
                </div>
            </div>
        </div>

      </div>

      <SignupModal 
        isOpen={isSignupOpen} 
        onClose={() => setIsSignupOpen(false)} 
        onSignup={handleSignup}
        loading={loading}
      />

      <style jsx global>{`
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
        <div style={{ marginBottom: '20px', borderBottom: '1px solid #e0e0e0', paddingBottom: '20px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#333', wordBreak: 'keep-all' }}>Q. {q}</h4>
            <p style={{ margin: 0, fontSize: '14px', color: '#666', lineHeight: '1.5', wordBreak: 'keep-all' }}>A. {a}</p>
        </div>
    );
}

const inputStyle = {
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid #ddd',
  fontSize: '14px',
  outline: 'none',
  backgroundColor: '#f9f9f9',
  color: '#333',
  width: '100%',
  boxSizing: 'border-box' as const
};

const socialBtnStyle = {
  padding: '10px',
  borderRadius: '8px',
  border: 'none',
  fontSize: '13px',
  fontWeight: '600' as const,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%'
};