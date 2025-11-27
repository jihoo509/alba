'use client';

import { useMemo, useState, useEffect } from 'react';
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
  
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [rememberId, setRememberId] = useState(false); // ✅ 아이디 기억하기 상태

  // 1. 초기 로딩 시: 자동 로그인 체크 & 아이디 기억하기 불러오기
  useEffect(() => {
    const checkSession = async () => {
      // (1) 이미 로그인 되어 있는지 확인
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace('/dashboard'); // 로그인 되어있으면 바로 대시보드로
        return;
      }

      // (2) 저장된 아이디가 있는지 확인
      const savedEmail = localStorage.getItem('savedEmail');
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberId(true);
      }
    };
    checkSession();
  }, [supabase, router]);

  // 통합 인증 핸들러
  async function handleAuth() {
    try {
      setMsg(null);
      setLoading(true);

      // ✅ 로그인 성공 시 아이디 저장 처리
      if (rememberId) {
        localStorage.setItem('savedEmail', email);
      } else {
        localStorage.removeItem('savedEmail');
      }

      if (isSignUpMode) {
        // 회원가입
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        if (!data.session) {
          setMsg('가입 확인 메일을 보냈습니다. 이메일을 확인해주세요.');
          alert('가입 확인 메일을 보냈습니다. 확인 후 로그인해주세요.');
          setIsSignUpMode(false);
        }
      } else {
        // 로그인
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
        alignItems: 'center', // 세로 중앙 정렬
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' }}></div>

      <div
        style={{
          position: 'relative',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '32px 28px', // ✅ 패딩을 조금 줄임
          borderRadius: '16px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          width: '90%',      // 모바일 대응
          maxWidth: '360px', // ✅ 크기를 420px -> 360px로 줄임
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          marginBottom: '15vh', // ✅ 화면 중앙보다 15% 정도 위로 올림 (일러스트 확보)
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
            placeholder="비밀번호 (6자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
            style={inputStyle}
          />
        </div>
        
        {/* ✅ 아이디 기억하기 체크박스 */}
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
          onClick={handleAuth}
          disabled={loading}
          style={{
            padding: '12px',
            // ✅ 회원가입 모드일 때는 초록색, 로그인일 때는 파란색
            backgroundColor: isSignUpMode ? '#28a745' : '#0052cc', 
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
          {loading ? '처리 중...' : (isSignUpMode ? '회원가입 완료' : '로그인')}
        </button>

        <div style={{ textAlign: 'center', fontSize: '12px', color: '#666' }}>
          {isSignUpMode ? '이미 계정이 있으신가요?' : '아직 계정이 없으신가요?'}
          <span 
            onClick={() => { setIsSignUpMode(!isSignUpMode); setMsg(null); }}
            style={{ color: '#0052cc', fontWeight: 'bold', cursor: 'pointer', marginLeft: '6px', textDecoration: 'underline' }}
          >
            {isSignUpMode ? '로그인하기' : '회원가입하기'}
          </span>
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
          <button onClick={() => handleOAuthLogin('kakao')} style={{ ...socialBtnStyle, background: '#FEE500', color: '#333' }}>
            <span style={{ marginRight: '8px', fontWeight: 'bold', color: '#3c1e1e' }}>K</span> Kakao 계정으로 계속
          </button>
          <button onClick={() => handleOAuthLogin('naver')} style={{ ...socialBtnStyle, background: '#03C75A', color: '#fff' }}>
            <span style={{ marginRight: '8px', fontWeight: 'bold' }}>N</span> Naver 계정으로 계속
          </button>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '10px', color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
        © 2025 Easy Alba. All rights reserved.
      </div>
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