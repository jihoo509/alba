'use client';

import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';

export default function UserBar({ email }: { email?: string | null }) {
  const router = useRouter();

  const onLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace('/');
  };

  return (
    <div>
      <span>{email ?? ''}</span>
      <button onClick={onLogout} style={{ marginLeft: 12, padding: '8px 12px' }}>
        로그아웃
      </button>
    </div>
  );
}
