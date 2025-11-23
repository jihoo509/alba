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
      {/* 1. 팝업 광고 (모든 화면 공통) */}
      <AdPopup />

      {/* 2. 왼쪽 광고 */}
      {/* pc-only: 모바일(768px 이하) 숨김 */}
      {/* side-ad: 노트북 등 좁은 PC 화면(1300px 이하) 숨김 (이번에 추가된 클래스!) */}
      <div className="pc-only side-ad">
        <AdBanner position="left" />
      </div>

      {/* 3. 중앙 콘텐츠 영역 (CSS 클래스로 위치/여백 자동 조절) */}
      <div className="dashboard-content">
        {children}
      </div>

      {/* 4. 오른쪽 광고 */}
      <div className="pc-only side-ad">
        <AdBanner position="right" />
      </div>

      {/* 5. 모바일용 하단 광고 (PC 숨김) */}
      <div className="mobile-only">
        <MobileAdBanner />
      </div>
    </div>
  );
}