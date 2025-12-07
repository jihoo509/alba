import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. 총 회원 수 (auth.users 테이블은 admin API로만 접근 가능)
    const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    // 2. 총 매장 수 (count 옵션 사용)
    const { count: storeCount, error: storeError } = await supabaseAdmin
      .from('stores')
      .select('*', { count: 'exact', head: true }); // head: true는 데이터 없이 숫자만 가져옴 (빠름)

    // 3. 총 방문자 수 (조회수)
    const { count: visitCount, error: visitError } = await supabaseAdmin
      .from('site_visits')
      .select('*', { count: 'exact', head: true });

    if (userError || storeError || visitError) throw new Error('데이터 집계 실패');

    return NextResponse.json({
      userCount: users?.length || 0,
      storeCount: storeCount || 0,
      visitCount: visitCount || 0,
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}