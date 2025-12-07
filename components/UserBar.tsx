'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';

type Props = {
  email?: string | null; // (이제 화면엔 안 뿌리지만, 호환성을 위해 남겨둠)
  onOpenSettings: () => void; // ✅ 설정 모달 여는 함수 (필수)
};

export default function UserBar({ email, onOpenSettings }: Props) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const onLogout = async () => {
    if (!confirm('로그아웃 하시겠습니까?')) return;
    await supabase.auth.signOut();
    router.replace('/');
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {/* ✅ 계정 설정 버튼 (이메일 텍스트 대신 추가) */}
      <button 
        onClick={onOpenSettings}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '6px 10px',
          backgroundColor: 'rgba(255, 255, 255, 0.15)', // 반투명 배경
          border: '1px solid rgba(255, 255, 255, 0.5)', // 반투명 테두리
          borderRadius: 6,
          color: '#fff', 
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: 13,
          whiteSpace: 'nowrap', // 줄바꿈 방지
          transition: 'all 0.2s'
        }}
      >
        <span>⚙️</span> 계정 설정
      </button>

      {/* ✅ 로그아웃 버튼 (스타일 유지하되 크기 살짝 조정) */}
      <button 
        onClick={onLogout} 
        style={{ 
          padding: '6px 10px', 
          backgroundColor: 'transparent', // 배경 투명하게 변경하여 계정 설정 버튼과 구분 (선택 사항)
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