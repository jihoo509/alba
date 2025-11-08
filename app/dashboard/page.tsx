// app/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import UserBar from '@/components/UserBar';

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // 로그인 안 되어 있으면 홈으로
    redirect('/');
  }

  return (
    <main style={{ padding: 40, color: '#fff' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <h1>사장님 대시보드</h1>
        <UserBar email={user.email ?? ''} />
      </header>

      <p>로그인 성공!</p>
    </main>
  );
}
