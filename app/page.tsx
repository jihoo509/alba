'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import SignupModal from '@/components/SignupModal';

type OAuthProvider = 'google' | 'kakao';

// ✅ 홍보 이미지 파일명 배열 (public 폴더에 이 이름대로 파일이 있어야 합니다)
// 보내주신 파일명: 1.jpg, 2.png, 3.jpg, 4.jpg, 5.jpg, 6.png (확장자 주의!)
const PROMO_IMAGES = [
  '1.png',
  '2.png',
  '3.png',
  '4.png',
  '5.png',
  '6.png'
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

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        // ✅ 배경 이미지 고정 (Parallax 효과 핵심)
        backgroundImage: "url('/login-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed', // 스크롤 내려도 배경은 고정됨
        fontFamily: 'sans-serif',
        overflowY: 'auto', // 세로 스크롤 허용
        position: 'relative'
      }}
    >
      {/* 배경 어둡게 까는 오버레이 (fixed로 고정하여 스크롤 내려도 계속 어둡게 유지) */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 0 }}></div>

      {/* 실제 콘텐츠 영역 (로그인창 + 이미지들) */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
{/* 1. 로그인 박스 영역 수정됨 */}
        <div style={{ 
            // ❌ minHeight: '100vh' 삭제! -> 이제 박스가 화면 전체를 차지하지 않음
            width: '100%', 
            display: 'flex', 
            justifyContent: 'center', 
            
            // ✅ 위쪽 정렬
            alignItems: 'flex-start', 
            
            // ✅ 위에서 떨어지는 거리 (PC/모바일 공통 적용)
            // 100px ~ 120px 정도가 적당합니다. (기존 130px보다 약간 줄임)
            paddingTop: '60px', 
            
            // ✅ 로그인 박스와 아래 홍보 이미지 사이의 간격
            // 이 값을 줄이면 이미지가 더 위로 붙습니다.
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

        {/* 2. 홍보 이미지 리스트 영역 (스크롤 내리면 보임) */}
        <div style={{ width: '100%', maxWidth: '800px', padding: '0 20px 100px 20px', display: 'flex', flexDirection: 'column', gap: '0' }}>
            {/* 스크롤 유도를 위한 안내 문구 (선택 사항) */}
            <div style={{ color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginBottom: '20px', fontSize: '14px', animation: 'bounce 2s infinite' }}>
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
                        // 이미지가 서로 딱 붙게 하려면 marginBottom을 없애거나 조정
                        marginBottom: '-1px' 
                    }} 
                />
            ))}
        </div>

        {/* 저작권 문구 - 맨 아래로 이동 */}
        <div 
            style={{ 
            width: '100%', 
            textAlign: 'center',
            color: 'rgba(255,255,255,0.5)', 
            fontSize: '11px',
            lineHeight: '1.5',
            paddingBottom: '40px'
            }}
        >
            © 2025 Easy Alba. All rights reserved.<br />
        </div>

      </div>

      <SignupModal 
        isOpen={isSignupOpen} 
        onClose={() => setIsSignupOpen(false)} 
        onSignup={handleSignup}
        loading={loading}
      />
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