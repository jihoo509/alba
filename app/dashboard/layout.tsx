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
    // ✅ 전체 컨테이너: 글자색은 기본적으로 검정(가독성 위함)으로 설정
    <div style={{ minHeight: '100vh', backgroundColor: '#000', color: '#333' }}>
      <AdPopup />

      <div className="pc-only">
        <AdBanner position="left" />
      </div>

      {/* ✅ 배경 이미지 다시 적용 */}
      <div className="dashboard-content" style={{
        backgroundImage: "url('/dashboard-bg.jpg')", // 다시 활성화!
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
        position: 'relative',
        // 💡 팁: 배경이 너무 쨍하면 아래 줄 주석을 풀어서 살짝 어둡게 눌러줄 수 있습니다.
        // backgroundColor: 'rgba(0,0,0,0.3)', backgroundBlendMode: 'darken' 
      }}>
        
        {/* 실제 내용이 들어가는 부분 */}
        <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </div>

      <div className="pc-only">
        <AdBanner position="right" />
      </div>

      <div className="mobile-only">
        <MobileAdBanner />
      </div>
    </div>
  );
}