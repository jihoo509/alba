// lib/supabaseServer.ts
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export function createSupabaseServerClient() {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // ✅ 쿠키 "읽기"만 사용 – 매번 cookies()를 바로 호출
        get(name: string) {
          try {
            return cookies().get(name)?.value;
          } catch {
            // 서버 액션/라우트 핸들러가 아닌 환경 등에서 문제가 나면
            // 그냥 undefined 리턴
            return undefined;
          }
        },
        // ✅ 서버 컴포넌트에서는 쿠키 "쓰기" 금지 – 아무 것도 안 함
        set(_name: string, _value: string, _options?: CookieOptions) {
          // intentionally empty
        },
        remove(_name: string, _options?: CookieOptions) {
          // intentionally empty
        },
      },
    }
  );

  return supabase;
}
