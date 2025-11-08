// lib/supabaseServer.ts
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // 서버 컴포넌트에선 읽기만 확실히 가능
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options?: any) {
          // Server Component에서는 set/remove가 안 될 수 있으므로 try/catch로 무시
          try {
            cookieStore.set({ name, value, ...options });
          } catch {}
        },
        remove(name: string, options?: any) {
          try {
            cookieStore.set({ name, value: '', ...options, maxAge: 0 });
          } catch {}
        },
      },
    }
  );
}
