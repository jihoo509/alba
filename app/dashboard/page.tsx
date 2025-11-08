// app/dashboard/page.tsx  (서버 컴포넌트)
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import UserBar from '@/components/UserBar'; // 아래 3번 파일

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/'); // 로그인 안 됨 → 홈으로
  }

  return (
    <main style={{ padding: 40, color: '#fff' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>사장님 대시보드</h1>
        <UserBar email={user.email ?? ''} />
      </header>
      <p>로그인 성공!</p>
    </main>
  );
}
