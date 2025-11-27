'use client';

import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';

export default function UserBar({ email }: { email?: string | null }) {
  const router = useRouter();

  const onLogout = async () => {
    if (!confirm('로그아웃 하시겠습니까?')) return;
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace('/');
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {/* ✅ 이메일: 흰색, 굵게, 크기 키움 */}
      <span style={{ color: '#ffffff', fontSize: 16, fontWeight: '600', marginRight: 16 }}>
        {email ?? ''} 님
      </span>
      {/* ✅ 로그아웃 버튼: 굵게, 반투명 흰색 스타일 */}
      <button 
        onClick={onLogout} 
        style={{ 
          padding: '8px 16px', 
          backgroundColor: 'rgba(255, 255, 255, 0.15)', // 반투명 배경
          border: '1px solid rgba(255, 255, 255, 0.5)', // 반투명 테두리
          borderRadius: 6,
          color: '#fff', 
          cursor: 'pointer',
          fontWeight: 'bold', // 굵게
          fontSize: 14,
          transition: 'all 0.2s'
        }}
      >
        로그아웃
      </button>
    </div>
  );
}