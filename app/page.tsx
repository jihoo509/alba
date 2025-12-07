'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import SignupModal from '@/components/SignupModal'; // ✅ 모달 불러오기

type OAuthProvider = 'google' | 'kakao';

export default function AuthPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // ✅ 기존 isSignUpMode 제거 -> 모달 상태 추가
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  
  const [rememberId, setRememberId] = useState(false);

  // 초기 로딩 시 자동 로그인 & 아이디 불러오기
  useEffect(() => {
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

  // ✅ 로그인 처리 함수 (회원가입 로직 분리됨)
  async function handleLogin() {
    try {
      setMsg(null);
      setLoading(true);

      if (rememberId) {
        localStorage.setItem('savedEmail', email);
      } else {
        localStorage.removeItem('savedEmail');
      }

      // 오직 로그인만 수행
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      router.push('/dashboard');
      
    } catch (e: any) {
      setMsg(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  // ✅ 회원가입 처리 함수 (모달에서 호출)
  async function handleSignup(signupEmail: string, signupPw: string, signupPhone: string) {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPw,
        options: {
            // 전화번호를 메타데이터에 저장 (필요시 employees 테이블 연동은 별도 로직 필요)
            data: {
                phone: signupPhone,
            }
        }
      });

      if (error) throw error;

      if (!data.session) {
        alert('가입 확인 메일을 보냈습니다. 이메일을 확인해주세요.');
        setIsSignupOpen(false); // 모달 닫기
      } else {
        // 세션이 바로 생기는 설정이라면 바로 이동
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
        backgroundImage: "url('/login-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' }}></div>

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
          marginBottom: '15vh',
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

        {/* ✅ 로그인 버튼 (고정) */}
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
          {/* ✅ 모달 오픈 버튼으로 변경 */}
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

      <div 
        style={{ 
          position: 'absolute', 
          bottom: '20px',
          left: '0', 
          width: '100%', 
          textAlign: 'center',
          color: 'rgba(255,255,255,0.5)', 
          fontSize: '11px',
          lineHeight: '1.5'
        }}
      >
        © 2025 Easy Alba. All rights reserved.<br />
        © 사업자 바르게 담다<br />
        문의: inserr509@daum.net | 010-4554-5587
      </div>

      {/* ✅ 회원가입 모달 연결 */}
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