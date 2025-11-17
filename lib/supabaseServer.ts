// lib/supabaseServer.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createSupabaseServerClient() {
  // ✅ Next.js 15+ / 16: cookies() 는 이제 Promise
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // 서버에서 Supabase가 세션 쿠키들을 읽을 때 사용
        getAll() {
          return cookieStore.getAll();
        },
        // Supabase가 세션 갱신하면서 쿠키를 다시 써줄 때 사용
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Component에서 호출될 때 set이 막혀 있어도 무시
          }
        },
      },
    }
  );

  return supabase;
}
