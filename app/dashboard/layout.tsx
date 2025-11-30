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
      
      {/* 1. 팝업 광고 (대시보드 들어왔을 때만 뜸) */}
      <AdPopup />

      {/* 2. PC 좌우 배너 (Fixed Position) */}
      {/* desktop-only 클래스로 모바일 숨김 / fixed로 스크롤 무관하게 화면 고정 */}
      <div className="desktop-only responsive-banner" style={{ position: 'fixed', left: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 90 }}>
        <AdBanner position="left" />
      </div>
      <div className="desktop-only responsive-banner" style={{ position: 'fixed', right: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 90 }}>
        <AdBanner position="right" />
      </div>

      {/* 3. 대시보드 콘텐츠 영역 (배경 이미지 적용) */}
      <div className="dashboard-content" style={{
        backgroundImage: "url('/dashboard-bg.jpg')", // 배경 이미지
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed', // 스크롤 해도 배경은 고정 느낌
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* 실제 내용 (children) */}
        <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
          {children}
        </div>

        {/* 4. 모바일 하단 광고 (모바일 전용 / 스크롤 끝) */}
        <div className="mobile-only" style={{
          width: '100%',
          padding: '20px 20px 60px 20px', // 하단 여백 확보
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          backgroundColor: '#fff', // 깔끔하게 흰색 배경 위 광고
          borderTop: '1px solid #eee',
          marginTop: '40px'
        }}>
          {/* 광고 박스 1 */}
          <div style={{
            width: '100%', height: '90px', // 요청하신 80~100 사이
            backgroundColor: '#eaeaea', borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#999', fontSize: '13px', border: '1px solid #ddd'
          }}>
            모바일 하단 광고 1
          </div>

          {/* 광고 박스 2 */}
          <div style={{
            width: '100%', height: '90px',
            backgroundColor: '#eaeaea', borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#999', fontSize: '13px', border: '1px solid #ddd'
          }}>
            모바일 하단 광고 2
          </div>
        </div>

      </div>
    </div>
  );
}