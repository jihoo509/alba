import './globals.css';
import React from 'react';

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
        {/* ✅ 여기엔 아무 광고도 넣지 않습니다. (로그인 페이지 청정 구역) */}
        {children}
      </body>
    </html>
  );
}