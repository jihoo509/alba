'use client';

import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';

type Props = {
  email?: string | null;
  onOpenSettings: () => void; // ✅ 설정 모달 여는 함수 추가
};

export default function UserBar({ email, onOpenSettings }: Props) {
  const router = useRouter();

  const onLogout = async () => {
    if (!confirm('로그아웃 하시겠습니까?')) return;
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace('/');
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {/* ✅ 이메일 텍스트 삭제함 */}

      {/* ✅ 계정 설정 버튼 */}
      <button 
        onClick={onOpenSettings}
        style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '6px 12px', 
          backgroundColor: 'rgba(255, 255, 255, 0.15)', 
          border: '1px solid rgba(255, 255, 255, 0.5)', 
          borderRadius: 6,
          color: '#fff', 
          cursor: 'pointer',
          fontWeight: 'bold', 
          fontSize: 13,
          whiteSpace: 'nowrap',
          transition: 'all 0.2s'
        }}
      >
        <span>⚙️</span> 계정 설정
      </button>

      {/* ✅ 로그아웃 버튼 */}
      <button 
        onClick={onLogout} 
        style={{ 
          padding: '6px 12px', 
          backgroundColor: 'transparent', // 투명 배경으로 설정해 구분감 줌
          border: '1px solid rgba(255, 255, 255, 0.3)', 
          borderRadius: 6,
          color: 'rgba(255, 255, 255, 0.9)', 
          cursor: 'pointer',
          fontSize: 13,
          whiteSpace: 'nowrap',
          transition: 'all 0.2s'
        }}
      >
        로그아웃
      </button>
    </div>
  );
}