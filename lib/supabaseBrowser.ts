// import { createClient } from '@supabase/supabase-js';

// ⚠️ 주의: 현재 환경에서 @supabase/supabase-js 패키지가 없으므로
// UI 미리보기를 위해 Mock(모의) 클라이언트를 반환합니다.
// 실제 사용 시에는 위 import 문 주석을 해제하고 아래 createMockClient 사용을 createClient로 변경하세요.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const createMockClient = () => {
  const successResponse = Promise.resolve({ data: [], error: null });
  const singleResponse = Promise.resolve({ data: null, error: null });
  
  // 체이닝을 위한 가짜 빌더
  const mockBuilder: any = {
    select: () => mockBuilder,
    insert: () => successResponse,
    update: () => mockBuilder,
    delete: () => mockBuilder,
    upsert: () => successResponse,
    eq: () => mockBuilder,
    gte: () => mockBuilder,
    lte: () => mockBuilder,
    in: () => mockBuilder,
    not: () => mockBuilder,
    match: () => mockBuilder,
    order: () => successResponse,
    single: () => singleResponse,
    // Promise 처럼 동작하게 하여 await에 응답
    then: (resolve: any) => resolve({ data: [], error: null }),
  };

  return {
    from: () => mockBuilder,
    auth: {
      getUser: () => Promise.resolve({ 
        data: { user: { id: 'mock-user-id', email: 'test@example.com' } }, 
        error: null 
      }),
      signOut: () => Promise.resolve({ error: null }),
      updateUser: () => Promise.resolve({ error: null }),
    }
  };
};

export const createSupabaseBrowserClient = () => {
  // 실제 코드: return createClient(supabaseUrl, supabaseAnonKey);
  console.log('Supabase Mock Client Active');
  return createMockClient() as any;
};