import './globals.css'; // 스타일 파일
import React from 'react';
import AdBanner from '@/components/AdBanner'; // 배너 컴포넌트
import AdPopup from '@/components/AdPopup'; // (혹시 팝업도 쓰신다면 추가, 안 쓰시면 지우세요)

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
        {/* (선택 사항) 팝업 광고 */}
        <AdPopup />

        {/* ✅ [왼쪽 광고] - PC에서만 보임 (1620px 이상) */}
        <div className="desktop-only responsive-banner" style={{ position: 'fixed', left: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 90 }}>
          <AdBanner position="left" />
        </div>

        {/* 🟢 메인 콘텐츠 */}
        {children}

        {/* ✅ [오른쪽 광고] - PC에서만 보임 */}
        <div className="desktop-only responsive-banner" style={{ position: 'fixed', right: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 90 }}>
          <AdBanner position="right" />
        </div>

        {/* ✅ [신규 추가] 하단 광고 영역 2개 (모바일/PC 공통) */}
        {/* 스크롤 제일 아래로 내렸을 때 보이는 영역입니다. */}
        <div style={{ 
          width: '100%', 
          maxWidth: '750px', // 본문 너비와 비슷하게
          margin: '60px auto 100px auto', // 위쪽 여백 60px, 아래쪽 여백 100px
          padding: '0 20px', 
          boxSizing: 'border-box' 
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
            
            {/* 광고 박스 1 */}
            <div style={{ 
              width: '100%', 
              height: '100px', // 요청하신 높이
              backgroundColor: '#f5f5f5', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              color: '#aaa', 
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              fontSize: '14px'
            }}>
              광고 배너 영역 1
            </div>

            {/* 광고 박스 2 */}
            <div style={{ 
              width: '100%', 
              height: '100px', 
              backgroundColor: '#f5f5f5', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              color: '#aaa', 
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              fontSize: '14px'
            }}>
              광고 배너 영역 2
            </div>

          </div>
        </div>

      </body>
    </html>
  );
}