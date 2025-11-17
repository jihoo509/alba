// app/api/employees/route.ts
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

// 직원 목록 조회 (storeId 기준)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get('storeId');

  if (!storeId) {
    return NextResponse.json(
      { error: 'storeId 가 필요합니다.' },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ employees: data ?? [] }, { status: 200 });
}

// 직원 신규 추가
export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();

  // 로그인 체크
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: '로그인이 필요합니다.' },
      { status: 401 }
    );
  }

  const body = await req.json();
  const {
    storeId,
    name,
    hourlyWage,
    employmentType,
    hireDate,
    endDate,
  }: {
    storeId: string;
    name: string;
    hourlyWage: number;
    employmentType: string; // 'freelancer' | 'insured'
    hireDate: string;       // 'YYYY-MM-DD'
    endDate?: string | null;
  } = body;

  if (!storeId || !name || !hourlyWage || !employmentType || !hireDate) {
    return NextResponse.json(
      { error: '필수 값이 누락되었습니다.' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('employees')
    .insert({
      store_id: storeId,
      name,
      hourly_wage: hourlyWage,
      employment_type: employmentType, // 'freelancer' | 'insured'
      is_active: true,
      hire_date: hireDate,
      end_date: endDate || null,
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ employee: data }, { status: 201 });
}
