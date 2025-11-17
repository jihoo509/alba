// lib/getCurrentUserAndStores.ts
import { createSupabaseServerClient } from './supabaseServer';

export async function getCurrentUserAndStores() {
  // 서버용 Supabase 클라이언트 생성
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { user: null, stores: [], currentStore: null };
  }

  const { data: storeMembers, error: storeError } = await supabase
    .from('store_members')
    .select('store_id, stores(*)')
    .eq('user_id', user.id);

  if (storeError) throw storeError;

  // store_members 결과에서 실제 store 객체만 뽑아내기
  const stores =
    storeMembers?.map((m: any) => (m as any).stores).filter(Boolean) ?? [];

  // TODO: currentStore는
  // - 첫 번째 매장
  // - 또는 사용자가 선택한 매장 ID(cookie)에서 읽어오기
  const currentStore = stores[0] ?? null;

  return { user, stores, currentStore };
}
