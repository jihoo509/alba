'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';


export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);

// app/dashboard/page.tsx
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import UserBar from "@/components/UserBar";

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 로그인 안 되어 있으면 홈으로 리디렉션
  if (!user) {
    return (
      <main style={{ padding: 40, color: "#fff" }}>
        <p>로그인이 필요합니다.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 40, color: "#fff" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h1>사장님 대시보드</h1>
        {/* 클라이언트 컴포넌트로 이메일/로그아웃 표시 */}
        <UserBar />
      </header>

      <p>로그인 성공!</p>
      {/* 여기에 직원/템플릿/스케줄/급여 탭 등 추가 예정 */}
    </main>
  );
}
