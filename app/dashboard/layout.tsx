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

      {/* 2. PC용 왼쪽 광고 (꽉 찬 배너) */}
      <div className="pc-only">
        <AdBanner position="left" />
      </div>

      {/* 3. 중앙 콘텐츠 영역 */}
      <div className="dashboard-content" style={{
        backgroundImage: "url('/dashboard-bg.jpg')", // 배경 이미지
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
        position: 'relative'
      }}>
        {/* ❌ 기존에 있던 어두운 오버레이(div) 삭제함 -> 원본 밝기 그대로 나옴 */}
        
        {/* 실제 내용 */}
        <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </div>

      {/* 4. PC용 오른쪽 광고 (꽉 찬 배너) */}
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