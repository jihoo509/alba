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
    <div style={{ minHeight: '100vh', backgroundColor: '#000', color: '#fff' }}>
      {/* 1. 팝업 광고 */}
      <AdPopup />

      {/* 2. PC용 왼쪽 광고 */}
      <div className="pc-only">
        <AdBanner position="left" />
      </div>

      {/* 3. 중앙 콘텐츠 영역 (배경 이미지 적용) */}
      <div className="dashboard-content" style={{
        backgroundImage: "url('/dashboard-bg.jpg')", // ✅ 배경 이미지
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed', // 스크롤 해도 배경 고정
        minHeight: '100vh',
        position: 'relative'
      }}>
        {/* 배경 어둡게 (가독성 확보) */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 0 }}></div>
        
        {/* 실제 내용은 z-index로 위로 올림 */}
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