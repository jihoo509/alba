'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';

type Props = {
  email?: string | null;
  onOpenSettings: () => void;
};

export default function UserBar({ email, onOpenSettings }: Props) {
  // ✅ 로딩 상태 관리
  const [loading, setLoading] = useState(false);
  const supabase = createSupabaseBrowserClient();

  const onLogout = async () => {
    // 1. 확인 창
    if (!confirm('로그아웃 하시겠습니까?')) return;

    try {
      setLoading(true); // 로딩 시작

      // 2. 수퍼베이스 로그아웃
      await supabase.auth.signOut();

      // 3. [핵심] 브라우저 강제 새로고침으로 로그인 페이지 이동
      // (Next.js 라우터 대신 window.location을 써야 세션이 확실히 비워집니다)
      window.location.href = '/'; 

    } catch (error) {
      console.error('Logout failed', error);
      // 에러 나도 일단 이동
      window.location.href = '/';
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      
      {/* 계정 설정 버튼 */}
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
          fontSize: 13,
          whiteSpace: 'nowrap',
          transition: 'all 0.2s',
          opacity: loading ? 0.7 : 1
        }}
      >
        {loading ? '...' : '로그아웃'}
      </button>
    </div>
  );
}