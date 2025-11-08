'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';

export default function AuthPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  async function handleLogin() {
    try {
      setMsg(null);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMsg(error.message);
        alert('로그인 실패: ' + error.message);
        return;
      }
      router.push('/dashboard');
    } catch (e: any) {
      setMsg(e?.message || String(e));
      alert('오류: ' + (e?.message || String(e)));
    }
  }

  async function handleSignup() {
    try {
      setMsg(null);
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMsg(error.message);
        alert('회원가입 실패: ' + error.message);
        return;
      }
      if (!data.session) {
        alert('가입 완료! (이메일 인증을 켰다면 메일 확인 필요)');
      }
    } catch (e: any) {
      setMsg(e?.message || String(e));
      alert('오류: ' + (e?.message || String(e)));
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '80px auto', color: '#fff' }}>
      <h1>알바 관리 – 로그인</h1>

      <input
        style={{ width: '100%', padding: 10, marginTop: 12, color: '#000' }}
        placeholder="이메일"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
      />
      <input
        style={{ width: '100%', padding: 10, marginTop: 12, color: '#000' }}
        placeholder="비밀번호(6자 이상)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
      />

      <button
        type="button"
        onClick={handleLogin}
        style={{ width: '100%', padding: 12, marginTop: 12, background: 'royalblue', color: '#fff', border: 0 }}
      >
        로그인
      </button>

      <button
        type="button"
        onClick={handleSignup}
        style={{ width: '100%', padding: 12, marginTop: 8, background: 'seagreen', color: '#fff', border: 0 }}
      >
        회원가입
      </button>

      {msg && <div style={{ marginTop: 12, color: 'salmon' }}>{msg}</div>}
    </div>
  );
}
