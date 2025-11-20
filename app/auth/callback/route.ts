import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    // 1. 쿠키 저장소 가져오기
    const cookieStore = cookies();
    
    // 2. 서버용 Supabase 클라이언트 생성
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // 3. 구글이 준 'code'를 진짜 '세션(로그인 정보)'으로 교환! (이게 핵심)
    await supabase.auth.exchangeCodeForSession(code);
  }

  // 4. 로그인 끝났으니 대시보드로 이동
  // requestUrl.origin: 현재 접속한 도메인 (localhost면 localhost, Vercel이면 Vercel)을 자동으로 잡음
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
}