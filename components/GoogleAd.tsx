'use client';

import React, { useEffect } from 'react';

type Props = {
  slot: string; // 광고 단위 ID (구글에서 발급받은 숫자)
  format?: string; // auto, rectangle, vertical 등
  responsive?: string; // true/false
  style?: React.CSSProperties;
};

export default function GoogleAd({ slot, format = 'auto', responsive = 'true', style }: Props) {
  useEffect(() => {
    try {
      // 광고 로드 (Next.js 페이지 이동 시에도 작동하도록)
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', ...style }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: '100%' }}
        data-ad-client="ca-pub-7536814024124909" // ✅ 사장님 ID
        data-ad-slot={slot} // ❗ 이 번호는 자리마다 다르게 넣어야 함
        data-ad-format={format}
        data-full-width-responsive={responsive}
      />
    </div>
  );
}

// 타입스크립트 에러 방지용
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}