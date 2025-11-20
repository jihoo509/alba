import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // 인증 코드를 세션으로 교환
    await supabase.auth.exchangeCodeForSession(code);
  }

  // ✅ 여기가 핵심: 접속한 주소(origin)에 맞춰서 대시보드로 이동
  // 로컬이면 localhost로, 배포판이면 vercel.app으로 자동 연결됨
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
}