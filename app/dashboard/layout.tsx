import React from 'react';
import AdBanner from '@/components/AdBanner';
import AdPopup from '@/components/AdPopup';
import MobileAdBanner from '@/components/MobileAdBanner'; // ✅ 추가됨

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000', color: '#fff' }}>
      {/* 1. 팝업 광고 (공통) */}
      <AdPopup />

      {/* 2. PC용 왼쪽 광고 (모바일엔 숨김) */}
      <div className="pc-only">
        <AdBanner position="left" />
      </div>

      {/* 3. 중앙 콘텐츠 영역 (CSS 클래스로 마진 조절) */}
      <div className="dashboard-content">
        {children}
      </div>

      {/* 4. PC용 오른쪽 광고 (모바일엔 숨김) */}
      <div className="pc-only">
        <AdBanner position="right" />
      </div>

      {/* 5. 모바일용 하단 광고 (PC엔 숨김) */}
      <div className="mobile-only">
        <MobileAdBanner />
      </div>
    </div>
  );
}