import React from 'react';
import AdBanner from '@/components/AdBanner';
import AdPopup from '@/components/AdPopup';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000', color: '#fff' }}>
      {/* 1. 팝업 광고 (대시보드 들어오면 뜸) */}
      <AdPopup />

      {/* 2. 왼쪽 광고 (PC에서만 보임) */}
      <div className="pc-only">
        <AdBanner position="left" />
      </div>

      {/* 3. 중앙 콘텐츠 영역 (광고 자리 비켜주기) */}
      <div style={{ 
        marginLeft: '160px', // 왼쪽 광고 너비만큼 띄움
        marginRight: '160px', // 오른쪽 광고 너비만큼 띄움
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* 실제 대시보드 내용이 여기에 들어갑니다 */}
        {children}
      </div>

      {/* 4. 오른쪽 광고 */}
      <div className="pc-only">
        <AdBanner position="right" />
      </div>
    </div>
  );
}