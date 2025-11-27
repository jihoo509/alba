import React from 'react';
import AdBanner from '@/components/AdBanner';
import AdPopup from '@/components/AdPopup';
import MobileAdBanner from '@/components/MobileAdBanner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // ✅ 배경: 밝은 회색, 글자: 검정
    <div style={{ minHeight: '100vh', backgroundColor: '#fcfcfc', color: '#000' }}>
      {/* 1. 팝업 광고 */}
      <AdPopup />

      {/* 2. PC용 왼쪽 광고 */}
      <div className="pc-only">
        <AdBanner position="left" />
      </div>

      {/* 3. 중앙 콘텐츠 영역 */}
      <div className="dashboard-content" style={{
        // backgroundImage: "url('/dashboard-bg.jpg')", // ❌ 흰 배경을 위해 잠시 주석 처리 (필요시 해제)
        backgroundColor: '#fcfcfc', // 배경 이미지 대신 밝은 색 적용
        minHeight: '100vh',
        position: 'relative'
      }}>
        
        {/* 실제 내용 */}
        <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </div>

      {/* 4. PC용 오른쪽 광고 */}
      <div className="pc-only">
        <AdBanner position="right" />
      </div>

      {/* 5. 모바일용 하단 광고 */}
      <div className="mobile-only">
        <MobileAdBanner />
      </div>
    </div>
  );
}