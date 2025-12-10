import './globals.css';
import React from 'react';
import Script from 'next/script'; 
import InstallPrompt from './InstallPrompt'; 
import VisitTracker from '@/components/VisitTracker'; 

// ✅ [수정] 메타데이터에 구글 애드센스 소유권 확인 코드 추가
export const metadata = {
  title: "Alba Manager",
  description: "매장과 직원을 효율적으로 관리하세요.",
  other: {
    "google-adsense-account": "ca-pub-7536814024124909",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {/* 구글 애드센스 스크립트 (이건 유지) */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7536814024124909"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />

        {/* 방문자 감지기 */}
        <VisitTracker />

        {/* 메인 콘텐츠 */}
        {children}
        
        {/* 설치 버튼 컴포넌트 */}
        <InstallPrompt />
      </body>
    </html>
  );
}