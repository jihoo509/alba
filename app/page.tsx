// app/page.tsx
'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';

// 우리가 화면에서 쓸 소셜 로그인 문자열 타입
type OAuthProvider = 'google' | 'kakao' | 'naver';

export default function AuthPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 이메일 + 비밀번호 로그인
  async function handleLogin() {
    try {
      setMsg(null);
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      setLoading(false);

      if (error) {
        setMsg(error.message);
        alert('로그인 실패: ' + error.message);
        return;
      }

      router.push('/dashboard');
    } catch (e: any) {
      setLoading(false);
      setMsg(e?.message || String(e));
      alert('오류: ' + (e?.message || String(e)));
    }
  }

  // 이메일 + 비밀번호 회원가입
  async function handleSignup() {
    try {
      setMsg(null);
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      setLoading(false);

      if (error) {
        setMsg(error.message);
        alert('회원가입 실패: ' + error.message);
        return;
      }

      // 개발용: 이메일 인증 끈 상태라면 바로 로그인 가능
      if (!data.session) {
        setMsg('회원가입이 완료되었습니다. 이제 로그인 버튼으로 접속하세요.');
        alert('가입 완료! 이제 이메일/비밀번호로 로그인해주세요.');
      }
    } catch (e: any) {
      setLoading(false);
      setMsg(e?.message || String(e));
      alert('오류: ' + (e?.message || String(e)));
    }
  }

  // Google / Kakao / Naver OAuth 로그인
  async function handleOAuthLogin(provider: OAuthProvider) {
    try {
      setMsg(null);

      const { error } = await supabase.auth.signInWithOAuth({
        // Supabase 타입은 Provider인데, 우리가 kakao/naver를 쓰기 위해 any 캐스팅
        provider: provider as any,
        options: {
          // 로그인 이후 돌아올 주소 (대시보드로 바로 보내기)
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        setMsg(error.message);
        alert('소셜 로그인 실패: ' + error.message);
      }
      // 성공 시에는 Supabase가 자동으로 리다이렉트
    } catch (e: any) {
      setMsg(e?.message || String(e));
      alert('오류: ' + (e?.message || String(e)));
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#111',
        color: '#fff',
        display: 'flex',
        justifyContent: 'center',
        paddingTop: 80,
      }}
    >
      <div style={{ maxWidth: 420, width: '100%' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 24 }}>
          알바 관리 – 로그인
        </h1>

        {/* 이메일 */}
        <input
          style={{
            width: '100%',
            padding: 10,
            marginTop: 12,
            color: '#000',
          }}
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
        />

        {/* 비밀번호 */}
        <input
          style={{
            width: '100%',
            padding: 10,
            marginTop: 12,
            color: '#000',
          }}
          placeholder="비밀번호(6자 이상)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
        />

        {/* 에러/메시지 */}
        {msg && (
          <div style={{ marginTop: 12, color: 'salmon', fontSize: 14 }}>
            {msg}
          </div>
        )}

        {/* 이메일 로그인 / 회원가입 버튼 */}
        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: 12,
            marginTop: 12,
            background: 'royalblue',
            color: '#fff',
            border: 0,
            cursor: 'pointer',
          }}
        >
          {loading ? '처리 중...' : '로그인'}
        </button>

        <button
          type="button"
          onClick={handleSignup}
          disabled={loading}
          style={{
            width: '100%',
            padding: 12,
            marginTop: 8,
            background: 'seagreen',
            color: '#fff',
            border: 0,
            cursor: 'pointer',
          }}
        >
          회원가입
        </button>

        {/* 구분선 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: 24,
            marginBottom: 12,
            color: '#aaa',
            fontSize: 13,
          }}
        >
          <div style={{ flex: 1, height: 1, backgroundColor: '#444' }} />
          <span style={{ padding: '0 8px' }}>또는 소셜 계정으로 로그인</span>
          <div style={{ flex: 1, height: 1, backgroundColor: '#444' }} />
        </div>

        {/* 소셜 로그인 버튼들 */}
        <button
          type="button"
          onClick={() => handleOAuthLogin('google')}
          style={{
            width: '100%',
            padding: 10,
            marginTop: 4,
            background: '#fff',
            color: '#222',
            border: '1px solid #ddd',
            cursor: 'pointer',
          }}
        >
          Google 계정으로 로그인
        </button>

        <button
          type="button"
          onClick={() => handleOAuthLogin('kakao')}
          style={{
            width: '100%',
            padding: 10,
            marginTop: 8,
            background: '#FEE500',
            color: '#222',
            border: 0,
            cursor: 'pointer',
          }}
        >
          Kakao 계정으로 로그인
        </button>

        <button
          type="button"
          onClick={() => handleOAuthLogin('naver')}
          style={{
            width: '100%',
            padding: 10,
            marginTop: 8,
            background: '#03C75A',
            color: '#fff',
            border: 0,
            cursor: 'pointer',
          }}
        >
          Naver 계정으로 로그인
        </button>
      </div>
    </div>
  );
}
