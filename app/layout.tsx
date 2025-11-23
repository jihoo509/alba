import './globals.css'; // 👈 [핵심] 방금 만든 CSS 파일을 여기서 불러옵니다!
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
      {/* 스타일은 이제 globals.css에서 관리하므로 body 태그를 깨끗하게 유지합니다. */}
      <body>
        {children}
      </body>
    </html>
  );
}