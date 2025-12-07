'use client';

import { useEffect, useRef } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import { usePathname } from 'next/navigation';

export default function VisitTracker() {
  const pathname = usePathname();
  const supabase = createSupabaseBrowserClient();
  // 중복 카운트 방지용 (페이지 이동 시 한 번만 실행)
  const loggedRef = useRef('');

  useEffect(() => {
    // 관리자 페이지나 API 호출은 카운트 제외 (선택 사항)
    if (pathname.startsWith('/admin') || pathname.startsWith('/api')) return;

    // 같은 페이지에서 중복 기록 방지
    if (loggedRef.current === pathname) return;

    const logVisit = async () => {
      await supabase.from('site_visits').insert({
        path: pathname
      });
      loggedRef.current = pathname;
    };

    logVisit();
  }, [pathname, supabase]);

  return null; // 화면엔 아무것도 안 보여줌
}