import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ✅ 관리자 권한 클라이언트 생성 함수 (재사용을 위해 분리하거나, 각 함수 내에서 호출해도 됩니다)
const getAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing in environment variables.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// 1. 회원 목록 조회 (GET)
export async function GET(request: Request) {
  try {
    const supabaseAdmin = getAdminClient();

    // 전체 회원 리스트 가져오기
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 필요한 정보만 추려서 반환
    const cleanUsers = users.map((u) => ({
      id: u.id,
      email: u.email,
      phone: u.user_metadata?.phone || '-', // 메타데이터에서 전화번호 추출
      created_at: u.created_at,
      last_sign_in: u.last_sign_in_at,
      provider: u.app_metadata?.provider || 'email'
    }));

    return NextResponse.json({ users: cleanUsers }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. 회원 강제 탈퇴 (DELETE) - ✅ 새로 추가된 부분
export async function DELETE(request: Request) {
  try {
    const supabaseAdmin = getAdminClient();
    
    // 요청 본문에서 userId 추출
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Supabase Auth에서 유저 삭제
    // (DB의 public.users 테이블 등이 auth.users를 참조하고 있고, 
    // ON DELETE CASCADE가 걸려 있다면 연관 데이터도 함께 삭제됩니다.)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: '회원 삭제 성공' }, { status: 200 });

  } catch (error: any) {
    console.error('Delete User Error:', error);
    return NextResponse.json({ error: '서버 내부 오류 발생' }, { status: 500 });
  }
}