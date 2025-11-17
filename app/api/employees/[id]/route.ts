// app/api/employees/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

// 직원 수정 (PUT)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  try {
    const supabase = await createSupabaseServerClient();
    const body = await req.json();

    const {
      name,
      hourly_wage,
      employment_type,
      is_active,
    }: {
      name?: string;
      hourly_wage?: number;
      employment_type?: string;
      is_active?: boolean;
    } = body;

    // 업데이트할 객체 구성 (넘어온 값만 반영)
    const updateData: Record<string, any> = {};
    if (typeof name === 'string') updateData.name = name;
    if (typeof hourly_wage === 'number') updateData.hourly_wage = hourly_wage;
    if (typeof employment_type === 'string')
      updateData.employment_type = employment_type;
    if (typeof is_active === 'boolean') updateData.is_active = is_active;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '업데이트할 값이 없습니다.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('employees')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('PUT /api/employees/[id] error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ employee: data }, { status: 200 });
  } catch (err: any) {
    console.error('PUT /api/employees/[id] exception:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// 직원 삭제 (DELETE)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  try {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('DELETE /api/employees/[id] error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error('DELETE /api/employees/[id] exception:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
