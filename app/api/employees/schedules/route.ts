// app/api/schedules/route.ts
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

// 스케줄 목록 조회: /api/schedules?storeId=...&workDate=YYYY-MM-DD(옵션)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get('storeId');
  const workDate = searchParams.get('workDate'); // 선택

  if (!storeId) {
    return NextResponse.json(
      { error: 'storeId 가 필요합니다.' },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from('schedules')
    .select(
      `
      id,
      store_id,
      employee_id,
      work_date,
      start_time,
      end_time,
      break_minutes,
      employee:employees (
        id,
        name
      )
    `
    )
    .eq('store_id', storeId)
    .order('work_date', { ascending: true })
    .order('start_time', { ascending: true });

  if (workDate) {
    query = query.eq('work_date', workDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('GET /api/schedules error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  // 프론트에서 쓰기 쉬운 평탄화 형태로 변환
  const schedules = (data ?? []).map((row: any) => ({
    id: row.id,
    store_id: row.store_id,
    employee_id: row.employee_id,
    employee_name: row.employee?.name ?? '',
    work_date: row.work_date,
    start_time: row.start_time,
    end_time: row.end_time,
    break_minutes: row.break_minutes,
  }));

  return NextResponse.json({ schedules }, { status: 200 });
}

// 스케줄 신규 추가
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
    employeeId,
    workDate,
    startTime,
    endTime,
    breakMinutes,
  }: {
    storeId: string;
    employeeId: string;
    workDate: string; // 'YYYY-MM-DD'
    startTime: string; // 'HH:MM'
    endTime: string;   // 'HH:MM'
    breakMinutes?: number;
  } = body;

  if (!storeId || !employeeId || !workDate || !startTime || !endTime) {
    return NextResponse.json(
      { error: '필수 값이 누락되었습니다.' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('schedules')
    .insert({
      store_id: storeId,
      employee_id: employeeId,
      work_date: workDate,
      start_time: startTime,
      end_time: endTime,
      break_minutes: breakMinutes ?? 0,
    })
    .select('*')
    .single();

  if (error) {
    console.error('POST /api/schedules error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ schedule: data }, { status: 201 });
}
