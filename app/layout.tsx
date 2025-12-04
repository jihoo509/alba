import './globals.css';
import React from 'react';
import Script from 'next/script'; 
import InstallPrompt from '@/components/InstallPrompt'; // ✅ [추가 1] 컴포넌트 불러오기

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
        {/* 구글 애드센스 스크립트 */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7536814024124909"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body>
        {children}
        
        {/* ✅ [추가 2] 설치 버튼 컴포넌트 배치 */}
        <InstallPrompt />
      </body>
    </html>
  );
}