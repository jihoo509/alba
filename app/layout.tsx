import './globals.css'; // 스타일 파일
import React from 'react';
import AdBanner from '@/components/AdBanner'; // ✅ [필수] 배너 컴포넌트 불러오기

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
      <body>
        {/* ✅ [왼쪽 광고] 
           className="desktop-only" 덕분에 화면이 1620px보다 좁아지면 
           CSS에 의해 자동으로 사라집니다 (display: none).
        */}
        <div className="desktop-only">
          <AdBanner position="left" />
        </div>

        {/* 메인 콘텐츠 */}
        {children}

        {/* ✅ [오른쪽 광고] */}
        <div className="desktop-only">
          <AdBanner position="right" />
        </div>
      </body>
    </html>
  );
}