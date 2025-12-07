import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  // 1. 관리자 권한 클라이언트 생성 (서비스롤 키 필요)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // 환경변수에 이 키가 꼭 있어야 합니다!
  );

  // 2. 전체 회원 리스트 가져오기
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 3. 필요한 정보만 추려서 반환
  const cleanUsers = users.map((u) => ({
    id: u.id,
    email: u.email,
    phone: u.user_metadata?.phone || '-', // 메타데이터에서 전화번호 추출
    created_at: u.created_at,
    last_sign_in: u.last_sign_in_at,
    provider: u.app_metadata?.provider || 'email'
  }));

  return NextResponse.json({ users: cleanUsers }, { status: 200 });
}