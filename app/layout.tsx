import './globals.css';
import React from 'react';
import Script from 'next/script'; 
import InstallPrompt from './InstallPrompt'; 
import VisitTracker from '@/components/VisitTracker'; 
// ✅ [추가] 푸터 컴포넌트 불러오기
import BusinessFooter from '@/components/BusinessFooter'; 

// ✅ [수정] 메타데이터: 구글 애드센스 + 검색엔진 소유권 확인 코드 추가
export const metadata = {
  title: "Alba Manager",
  description: "매장과 직원을 효율적으로 관리하세요.",
  
  // 1. 구글 애드센스 (기존)
  other: {
    "google-adsense-account": "ca-pub-7536814024124909",
  },

  // 2. 검색엔진 소유권 확인 (네이버, 구글)
  verification: {
    google: "Y-e6TlFoVraNFiHICXDpphsZVRhxgre8N1Hqd0uv_xk", // 구글 코드
    other: {
      "naver-site-verification": "1224469959ad4122f9082d200a1ffb4ee1fedd45", // 네이버 코드
    },
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

        {/* ✅ [수정] 메인 콘텐츠 영역 
            내용이 적어도 푸터가 화면 중간에 뜨지 않도록 최소 높이를 줬습니다.
        */}
        <div style={{ minHeight: 'calc(100vh - 150px)' }}>
          {children}
        </div>
        
        {/* ✅ [추가] 사이트 하단 정보 (푸터) */}
        <BusinessFooter />

        {/* 설치 버튼 컴포넌트 */}
        <InstallPrompt />
      </body>
    </html>
  );
}