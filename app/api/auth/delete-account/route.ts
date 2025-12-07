import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request) {
  // 1. [중요] await를 꼭 붙여야 합니다.
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // 2. [중요] API Route에서는 쿠키를 수정할 수 없으므로 내용을 비워둡니다.
        // 괜히 cookieStore.set을 호출하면 서버가 에러를 뱉습니다.
        set(name: string, value: string, options: CookieOptions) {
          // 빈칸으로 둠
        },
        remove(name: string, options: CookieOptions) {
          // 빈칸으로 둠
        },
      },
    }
  );

  // --- 이후 로직은 동일 ---

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 관리자 권한으로 유저 삭제
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, 
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.auth.signOut();

  return NextResponse.json({ message: 'Success' }, { status: 200 });
}