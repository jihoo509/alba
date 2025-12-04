import './globals.css';
import React from 'react';
import Script from 'next/script'; 
import InstallPrompt from './InstallPrompt'; // ✅ [수정됨] 점 하나(.)로 바뀝니다!

export const metadata = {
  title: "Alba Manager",
  description: "매장과 직원을 효율적으로 관리하세요.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7536814024124909"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body>
        {children}
        
        {/* 설치 버튼 컴포넌트 */}
        <InstallPrompt />
      </body>
    </html>
  );
}