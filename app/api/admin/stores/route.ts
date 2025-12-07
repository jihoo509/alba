import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 모든 매장 정보 가져오기 (최신순 정렬)
  const { data: stores, error } = await supabaseAdmin
    .from('stores')
    .select('*')
    .order('created_at', { ascending: false }); // created_at이 없으면 order 빼셔도 됩니다

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ stores }, { status: 200 });
}