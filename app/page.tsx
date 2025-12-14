'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import SignupModal from '@/components/SignupModal';

type OAuthProvider = 'google' | 'kakao';

export default function AuthPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [rememberId, setRememberId] = useState(false);

  // ✅ [확인 필요] public 폴더에 있는 이미지 파일명과 정확히 일치해야 합니다! (대소문자 구분)
  // 예: 파일명이 Image.JPG라면 아래에도 '/Image.JPG'로 써야 합니다.
  const introImages = [
    '/1.jpg',
    '/2.png',
    '/3.jpg',
    '/4.jpg',
    '/5.jpg',
    '/6.png'
  ];

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
        options: { data: { phone: signupPhone } }
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
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (e: any) {
      setMsg(e?.message || String(e));
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh' }}>
      
      {/* ✅ [수정] 배경화면 고정 (Fixed) */}
      <div 
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          zIndex: -1, // 맨 뒤로
          backgroundImage: "url('/login-bg.jpg')", // 배경 이미지 확인 필요
          backgroundSize: 'cover', 
          backgroundPosition: 'center', 
          backgroundRepeat: 'no-repeat'
        }} 
      >
        {/* 배경 어둡게 (Overlay) */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' }}></div>
      </div>

      {/* ✅ [수정] 스크롤되는 콘텐츠 영역 */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        
        {/* 1. 로그인 폼 섹션 (화면 전체 높이 100vh 사용) */}
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          
          {/* 로그인 박스 */}
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              padding: '32px 28px',
              borderRadius: '16px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
              width: '100%',
              maxWidth: '380px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              marginBottom: '60px' // 하단 화살표 공간 확보
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 4 }}>
              <h3 style={{ margin: 0, color: '#666', fontSize: '13px', fontWeight: 'normal' }}>직원 관리가 쉬워진다</h3>
              <h1 style={{ margin: '2px 0 0 0', color: '#0052cc', fontSize: '28px', fontWeight: '800', letterSpacing: '-1px' }}>
                Easy Alba
              </h1>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
              <input type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} style={inputStyle} />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input type="checkbox" id="rememberId" checked={rememberId} onChange={(e) => setRememberId(e.target.checked)} style={{ cursor: 'pointer' }} />
              <label htmlFor="rememberId" style={{ fontSize: '13px', color: '#555', cursor: 'pointer' }}>아이디 기억하기</label>
            </div>

            {msg && <div style={{ color: 'salmon', fontSize: '12px', textAlign: 'center' }}>{msg}</div>}

            <button onClick={handleLogin} disabled={loading} style={loginBtnStyle}>
              {loading ? '처리 중...' : '로그인'}
            </button>

            <div style={{ textAlign: 'center', fontSize: '12px', color: '#666' }}>
              아직 계정이 없으신가요?
              <span onClick={() => { setIsSignupOpen(true); setMsg(null); }} style={{ color: '#0052cc', fontWeight: 'bold', cursor: 'pointer', marginLeft: '6px', textDecoration: 'underline' }}>회원가입하기</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', margin: '10px 0' }}>
              <div style={{ flex: 1, height: '1px', background: '#ddd' }}></div>
              <span style={{ padding: '0 10px', color: '#999', fontSize: '11px' }}>간편 로그인</span>
              <div style={{ flex: 1, height: '1px', background: '#ddd' }}></div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={() => handleOAuthLogin('google')} style={{ ...socialBtnStyle, background: '#fff', border: '1px solid #ddd', color: '#333' }}>
                <span style={{ marginRight: '8px', fontWeight: 'bold', color: '#ea4335' }}>G</span> Google 계정으로 계속
              </button>
              <button onClick={() => handleOAuthLogin('kakao')} style={{ ...socialBtnStyle, background: '#FEE500', color: '#3c1e1e' }}>
                <span style={{ marginRight: '8px', fontWeight: 'bold', color: '#3c1e1e' }}>K</span> Kakao 계정으로 계속
              </button>
            </div>
          </div>

          {/* 스크롤 유도 화살표 */}
          <div 
             onClick={() => window.scrollTo({top: window.innerHeight, behavior: 'smooth'})}
             style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', color: '#fff', fontSize: '30px', animation: 'bounce 2s infinite', cursor:'pointer', opacity: 0.8 }}
          >
             ⌄
          </div>
        </div>

        {/* 2. 서비스 소개 이미지 (흰색 배경) */}
        <div style={{ backgroundColor: '#fff', width: '100%', paddingBottom: '0' }}>
           <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
             {introImages.map((src, idx) => (
                // ✅ [수정] 이미지 사이 틈 제거 (display: block)
                <img 
                    key={idx} 
                    src={src} 
                    alt={`서비스 소개 ${idx + 1}`} 
                    style={{ width: '100%', height: 'auto', display: 'block' }} 
                    // 이미지가 깨질 경우를 대비한 대체 텍스트 표시
                    onError={(e) => { e.currentTarget.style.display='none'; console.log('이미지 로드 실패:', src); }}
                />
             ))}
           </div>
        </div>

        {/* 3. 푸터 */}
        <div style={{ backgroundColor: '#1a1a1a', color: '#888', padding: '40px 20px', textAlign: 'center', fontSize: '12px' }}>
            <p style={{ marginBottom: 8, fontSize: '15px', fontWeight: 'bold', color: '#fff' }}>Easy Alba</p>
            <p>직원 관리의 시작, 이지알바</p>
            <p style={{ marginTop: 20 }}>© 2025 Easy Alba. All rights reserved.</p>
        </div>

      </div>

      <SignupModal isOpen={isSignupOpen} onClose={() => setIsSignupOpen(false)} onSignup={handleSignup} loading={loading} />
      
      <style jsx global>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {transform: translateX(-50%) translateY(0);}
          40% {transform: translateX(-50%) translateY(-10px);}
          60% {transform: translateX(-50%) translateY(-5px);}
        }
      `}</style>
    </div>
  );
}

// 스타일 객체
const inputStyle = {
  padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none', backgroundColor: '#f9f9f9', color: '#333', width: '100%', boxSizing: 'border-box' as const
};

const loginBtnStyle = {
  padding: '14px', backgroundColor: '#0052cc', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', marginTop: '4px', transition: 'background-color 0.2s', width: '100%'
};

const socialBtnStyle = {
  padding: '12px', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: '600' as const, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%'
};