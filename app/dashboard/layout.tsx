import React from 'react';
import AdBanner from '@/components/AdBanner';
import AdPopup from '@/components/AdPopup';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // ✅ 전체 컨테이너
    <div style={{ minHeight: '100vh', backgroundColor: '#fff', color: '#292929' }}>
      
      {/* 1. 팝업 광고 */}
      <AdPopup />

      {/* 2. PC 좌우 배너 (Fixed) */}
      <div className="desktop-only responsive-banner" style={{ position: 'fixed', left: 0, top: '0', bottom: '0', height: '100vh', zIndex: 90, display: 'flex', alignItems: 'center' }}>
        <AdBanner position="left" />
      </div>
      <div className="desktop-only responsive-banner" style={{ position: 'fixed', right: 0, top: '0', bottom: '0', height: '100vh', zIndex: 90, display: 'flex', alignItems: 'center' }}>
        <AdBanner position="right" />
      </div>

      {/* 3. 대시보드 콘텐츠 영역 */}
      <div className="dashboard-content" style={{
        backgroundImage: "url('/dashboard-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        paddingBottom: '50px' // ✅ [중요] 하단 스티키 배너(50px) 가림 방지용 여백
      }}>
        
        {/* 실제 내용 */}
        <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
          {children}
        </div>

        {/* 4. [정적] 모바일 하단 광고 (스크롤 끝에 박혀있는 광고) */}
        <div className="mobile-only" style={{
          width: '100%',
          padding: '20px 20px 80px 20px', // 스티키 배너 위로 올라오도록 여백 확보
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          backgroundColor: '#fff',
          borderTop: '1px solid #eee',
          marginTop: '40px'
        }}>
          <div style={{ width: '100%', height: '90px', backgroundColor: '#eaeaea', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '13px', border: '1px solid #ddd' }}>
            모바일 하단 광고 1
          </div>
          <div style={{ width: '100%', height: '90px', backgroundColor: '#eaeaea', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '13px', border: '1px solid #ddd' }}>
            모바일 하단 광고 2
          </div>
        </div>

      </div>

      {/* ✅ 5. [복구] 모바일 스티키 배너 (화면 하단 고정, 높이 50px) */}
      <div className="mobile-only" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50px',
        backgroundColor: '#333', // 배너 배경색 (이미지 없을 때)
        color: '#fff',
        zIndex: 100, // 맨 위에 뜨도록
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
      }}>
        {/* 여기에 실제 광고 컴포넌트나 이미지를 넣으시면 됩니다 */}
        <span style={{ fontSize: '13px' }}>광고 문의 010.4554.5587</span>
      </div>

    </div>
  );
}