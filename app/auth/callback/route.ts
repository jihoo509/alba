import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  // ✅ requestUrl.origin을 사용하여 로컬/배포 환경 자동 감지
  const origin = requestUrl.origin;

  if (code) {
    // ✅ Next.js 15/16 핵심: cookies() 앞에 await 필수!
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Server Component 등에서 set이 무시되는 경우 처리
            }
          },
        },
      }
    );

    // 인증 코드를 세션으로 교환 (이때 쿠키가 세팅됨)
    await supabase.auth.exchangeCodeForSession(code);
  }

  // 로그인 성공 후 대시보드로 이동
  return NextResponse.redirect(`${origin}/dashboard`);
}