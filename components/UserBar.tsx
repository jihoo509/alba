'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';

type Props = {
  email?: string | null;
  onOpenSettings: () => void;
};

export default function UserBar({ email, onOpenSettings }: Props) {
  const [loading, setLoading] = useState(false);
  const supabase = createSupabaseBrowserClient();

  const onLogout = async () => {
    if (!confirm('로그아웃 하시겠습니까?')) return;

    try {
      setLoading(true); 
      await supabase.auth.signOut();

      // ✅ [핵심 수정] 로그아웃 흔적(?logout=true)을 남기며 이동
      // 이렇게 해야 로그인 페이지가 "어? 로그아웃 했네?" 하고 자동 로그인을 안 시킵니다.
      window.location.href = '/?logout=true'; 

    } catch (error) {
      console.error('Logout failed', error);
      window.location.href = '/?logout=true';
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      
      {/* 계정 설정 버튼 */}
      <button 
        onClick={onOpenSettings}
        style={{ 
          display: 'flex', alignItems: 'center', gap: '4px',
          padding: '6px 12px', 
          backgroundColor: 'rgba(255, 255, 255, 0.15)', 
          border: '1px solid rgba(255, 255, 255, 0.5)', 
          borderRadius: 6,
          color: '#fff', 
          cursor: 'pointer', fontWeight: 'bold', fontSize: 13,
          whiteSpace: 'nowrap', transition: 'all 0.2s'
        }}
      >
        <span>⚙️</span> 계정 설정
      </button>

      {/* 로그아웃 버튼 */}
      <button 
        onClick={onLogout} 
        disabled={loading}
        style={{ 
          padding: '6px 12px', 
          backgroundColor: 'transparent', 
          border: '1px solid rgba(255, 255, 255, 0.3)', 
          borderRadius: 6,
          color: 'rgba(255, 255, 255, 0.9)', 
          cursor: loading ? 'wait' : 'pointer',
          fontSize: 13, whiteSpace: 'nowrap',
          transition: 'all 0.2s', opacity: loading ? 0.7 : 1
        }}
      >
        {loading ? '...' : '로그아웃'}
      </button>
    </div>
  );
}