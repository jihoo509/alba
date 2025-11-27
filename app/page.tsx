'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';

type OAuthProvider = 'google' | 'kakao' | 'naver';

export default function AuthPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // ✅ [추가] 로그인/회원가입 모드 전환용 상태
  const [isSignUpMode, setIsSignUpMode] = useState(false);

  // 통합 인증 핸들러 (로그인/회원가입 분기 처리)
  async function handleAuth() {
    try {
      setMsg(null);
      setLoading(true);

      if (isSignUpMode) {
        // 회원가입 로직
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        if (!data.session) {
          setMsg('가입 확인 메일을 보냈습니다. 이메일을 확인해주세요.');
          alert('가입 확인 메일을 보냈습니다. 확인 후 로그인해주세요.');
          setIsSignUpMode(false); // 가입 후 로그인 모드로 전환
        }
      } else {
        // 로그인 로직
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/dashboard');
      }
    } catch (e: any) {
      setMsg(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  // 소셜 로그인 핸들러
  async function handleOAuthLogin(provider: OAuthProvider) {
    try {
      setMsg(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: {
          // ✅ 자동 주소 감지 (localhost, 도메인 모두 작동)
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
        backgroundImage: "url('/login-bg.jpg')", // public 폴더의 이미지 사용
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'sans-serif',
      }}
    >
      {/* 배경 어둡게 (오버레이) */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' }}></div>

      {/* 로그인 카드 */}
      <div
        style={{
          position: 'relative',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '40px 32px',
          borderRadius: '16px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          width: '100%',
          maxWidth: '400px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <h3 style={{ margin: 0, color: '#666', fontSize: '14px', fontWeight: 'normal' }}>직원 관리가 쉬워진다</h3>
          <h1 style={{ margin: '4px 0 0 0', color: '#0052cc', fontSize: '32px', fontWeight: '800', letterSpacing: '-1px' }}>
            Easy Alba
          </h1>
        </div>

        {/* 입력 폼 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="비밀번호 (6자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
            style={inputStyle}
          />
        </div>

        {msg && <div style={{ color: 'salmon', fontSize: '13px', textAlign: 'center' }}>{msg}</div>}

        {/* 메인 버튼 (로그인/가입 겸용) */}
        <button
          onClick={handleAuth}
          disabled={loading}
          style={{
            padding: '14px',
            backgroundColor: '#0052cc',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            marginTop: '4px',
            transition: 'background 0.2s',
          }}
        >
          {loading ? '처리 중...' : (isSignUpMode ? '회원가입' : '로그인')}
        </button>

        {/* 모드 전환 (로그인 <-> 회원가입) */}
        <div style={{ textAlign: 'center', fontSize: '13px', color: '#666' }}>
          {isSignUpMode ? '이미 계정이 있으신가요?' : '아직 계정이 없으신가요?'}
          <span 
            onClick={() => { setIsSignUpMode(!isSignUpMode); setMsg(null); }}
            style={{ color: '#0052cc', fontWeight: 'bold', cursor: 'pointer', marginLeft: '6px', textDecoration: 'underline' }}
          >
            {isSignUpMode ? '로그인하기' : '회원가입하기'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', margin: '12px 0' }}>
          <div style={{ flex: 1, height: '1px', background: '#ddd' }}></div>
          <span style={{ padding: '0 10px', color: '#999', fontSize: '12px' }}>간편 로그인</span>
          <div style={{ flex: 1, height: '1px', background: '#ddd' }}></div>
        </div>

        {/* 소셜 로그인 버튼들 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => handleOAuthLogin('google')} style={{ ...socialBtnStyle, background: '#fff', border: '1px solid #ddd', color: '#333' }}>
            <span style={{ marginRight: '8px', fontWeight: 'bold' }}>G</span> Google 계정으로 계속
          </button>
          <button onClick={() => handleOAuthLogin('kakao')} style={{ ...socialBtnStyle, background: '#FEE500', color: '#333' }}>
            <span style={{ marginRight: '8px', fontWeight: 'bold' }}>K</span> Kakao 계정으로 계속
          </button>
          <button onClick={() => handleOAuthLogin('naver')} style={{ ...socialBtnStyle, background: '#03C75A', color: '#fff' }}>
            <span style={{ marginRight: '8px', fontWeight: 'bold' }}>N</span> Naver 계정으로 계속
          </button>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '20px', color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
        © 2025 Easy Alba. All rights reserved.
      </div>
    </div>
  );
}

const inputStyle = {
  padding: '14px',
  borderRadius: '8px',
  border: '1px solid #ddd',
  fontSize: '15px',
  outline: 'none',
  backgroundColor: '#f9f9f9',
  color: '#333'
};

const socialBtnStyle = {
  padding: '12px',
  borderRadius: '8px',
  border: 'none',
  fontSize: '14px',
  fontWeight: '600' as const,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};