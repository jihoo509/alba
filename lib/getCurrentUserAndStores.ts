// lib/getCurrentUserAndStores.ts
import { createSupabaseServerClient } from './supabaseServer';

export async function getCurrentUserAndStores() {
  // ✅ async 함수이므로 반드시 await
  const supabase = await createSupabaseServerClient();

  // 현재 로그인 유저 가져오기
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      user: null,
      stores: [] as any[],
      error: userError ?? new Error('로그인 정보가 없습니다.'),
    };
  }

  // RLS 때문에, 단순 select * from stores 해도
  // owner 이거나 store_members 에 속한 매장만 자동으로 필터링됨
  const { data: stores, error: storesError } = await supabase
    .from('stores')
    .select('*')
    .order('created_at', { ascending: true });

  return {
    user,
    stores: stores ?? [],
    error: storesError ?? null,
  };
}
