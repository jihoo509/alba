'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';


export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createSupabaseBrowserClient();
const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/'); // 로그인 안 되어 있으면 홈으로
        return;
      }
      setEmail(user.email ?? null);
      setLoading(false);
    })();
  }, [router]);

  if (loading) {
    return <main style={{ padding: 40, color: '#fff' }}>로딩 중…</main>;
  }

  return (
    <main style={{ padding: 40, color: '#fff' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>사장님 대시보드</h1>
        <div>
          <span>{email ?? ''}</span>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.replace('/');
            }}
            style={{ marginLeft: 12, padding: '8px 12px' }}
          >
            로그아웃
          </button>
        </div>
      </header>

      <p>로그인 성공!</p>
      {/* 여기 아래에 직원/템플릿/스케줄/급여 탭을 점점 붙여가면 됩니다 */}
    </main>
  );
}
