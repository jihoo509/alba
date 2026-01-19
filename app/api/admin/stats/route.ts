import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. 총 회원 수
    const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    // 2. 총 매장 수
    const { count: storeCount, error: storeError } = await supabaseAdmin
      .from('stores')
      .select('*', { count: 'exact', head: true });

    // 3. 총 방문자 수 (전체)
    const { count: visitCount, error: visitError } = await supabaseAdmin
      .from('site_visits')
      .select('*', { count: 'exact', head: true });

    // 4. 급여 계산기 방문자 수 (주소: '/calculator/salary')
    const { count: salaryVisitCount } = await supabaseAdmin
      .from('site_visits')
      .select('*', { count: 'exact', head: true })
      .eq('path', '/calculator/salary'); 

    // 5. 주휴수당 계산기 방문자 수 (주소: '/calculator/holiday')
    const { count: holidayVisitCount } = await supabaseAdmin
      .from('site_visits')
      .select('*', { count: 'exact', head: true })
      .eq('path', '/calculator/holiday');

    if (userError || storeError || visitError) throw new Error('데이터 집계 실패');

    return NextResponse.json({
      userCount: users?.length || 0,
      storeCount: storeCount || 0,
      visitCount: visitCount || 0,
      salaryVisitCount: salaryVisitCount || 0,
      holidayVisitCount: holidayVisitCount || 0,
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}