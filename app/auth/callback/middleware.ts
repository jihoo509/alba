import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // 1. 세션 갱신 (가장 중요)
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 2. 주소 제어 로직
  // 로그인이 안 된 상태로 대시보드에 접근하면 -> 로그인 페이지로 쫓아냄
  if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/';
    return NextResponse.redirect(redirectUrl);
  }

  // 이미 로그인된 상태로 로그인 페이지에 오면 -> 대시보드로 보냄
  if (session && req.nextUrl.pathname === '/') {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

// 미들웨어가 감시할 경로 설정
export const config = {
  matcher: ['/', '/dashboard/:path*'],
};