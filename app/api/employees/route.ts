// app/api/employees/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export async function GET(req: NextRequest) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get('storeId');

  if (!storeId) {
    return NextResponse.json({ error: 'storeId is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('store_id', storeId)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }

  return NextResponse.json({ employees: data });
}

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const {
    store_id,
    name,
    birth_date,
    phone,
    hourly_wage,
    employment_type,
    join_date,
    bank_name,
    bank_account,
    memo,
  } = body;

  if (!store_id || !name || !hourly_wage) {
    return NextResponse.json(
      { error: 'store_id, name, hourly_wage are required' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('employees')
    .insert({
      store_id,
      name,
      birth_date,
      phone,
      hourly_wage,
      employment_type,
      join_date,
      bank_name,
      bank_account,
      memo,
    })
    .select()
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    );
  }

  return NextResponse.json({ employee: data }, { status: 201 });
}
