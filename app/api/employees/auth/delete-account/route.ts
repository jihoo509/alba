import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request) {
  // 🚨 [수정 포인트] Next.js 15부터는 cookies() 앞에 await가 필수입니다!
  const cookieStore = await cookies();

  // 1. 현재 로그인한 유저 확인 (보안)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // API Route에서는 쿠키 수정 권한이 없으므로 set/remove는 비워둡니다.
        set(name: string, value: string, options: CookieOptions) {
          try {
            // cookieStore.set({ name, value, ...options });
          } catch (error) {
            // 무시
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            // cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // 무시
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. 관리자 권한으로 유저 삭제 (Service Role Key 사용)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // .env.local에 저장된 키
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  // auth.users 테이블에서 유저 삭제
  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 3. 로그아웃 처리
  await supabase.auth.signOut();

  return NextResponse.json({ message: 'Success' }, { status: 200 });
}