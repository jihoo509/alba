// components/UserBar.tsx
'use client';

import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';

export default function UserBar({ email }: { email: string }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  return (
    <div>
      <span>{email}</span>
      <button
        onClick={async () => {
          await supabase.auth.signOut();
          router.replace('/');
        }}
        style={{ marginLeft: 12, padding: '8px 12px' }}
      >
        로그아웃
      </button>
    </div>
  );
}
