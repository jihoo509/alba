import './globals.css';
import React from 'react';
import Script from 'next/script'; 
import InstallPrompt from './InstallPrompt'; 
import VisitTracker from '@/components/VisitTracker'; 
// ✅ [추가] 푸터 컴포넌트 불러오기
import BusinessFooter from '@/components/BusinessFooter'; 

// ✅ [수정] 메타데이터: 표준 주소(Canonical) 설정 추가
export const metadata = {
  // 1. ✅ [핵심 추가] 사이트의 '기준 도메인'을 선언합니다.
  // 이렇게 하면 상대 경로 이미지나 링크들도 전부 이 도메인 기준으로 인식됩니다.
  metadataBase: new URL('https://www.xn--9g3bp2okvbh9c.kr'),

  // 2. ✅ [핵심 추가] 표준 주소 설정
  // 구글에게 "www 붙은 주소가 진짜니까 이걸로 등록해!"라고 말해주는 설정입니다.
  alternates: {
    canonical: '/',
  },

  title: "Alba Manager",
  description: "매장과 직원을 효율적으로 관리하세요.",
  
  // 3. 구글 애드센스 (기존)
  other: {
    "google-adsense-account": "ca-pub-7536814024124909",
  },

  // 4. 검색엔진 소유권 확인 (네이버, 구글)
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
        {/* 구글 애드센스 스크립트 */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7536814024124909"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />

        {/* 방문자 감지기 */}
        <VisitTracker />

        {/* 메인 콘텐츠 영역 */}
        <div style={{ minHeight: 'calc(100vh - 150px)' }}>
          {children}
        </div>
        
        {/* 사이트 하단 정보 (푸터) */}
        <BusinessFooter />

        {/* 설치 버튼 컴포넌트 */}
        <InstallPrompt />
      </body>
    </html>
  );
}