import React from 'react';
import AdBanner from '@/components/AdBanner';
import AdPopup from '@/components/AdPopup';
import GoogleAd from '@/components/GoogleAd'; // ✅ 구글 광고 컴포넌트 불러오기

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 🔴 [중요] 구글 애드센스에서 발급받은 '광고 단위 ID'를 여기에 입력하세요.
  const MOBILE_BOTTOM_BOX_SLOT_ID = "4218312145"; // (예시) 모바일 하단 큰 박스용
  const MOBILE_STICKY_SLOT_ID = "1423137158";     // (예시) 모바일 하단 스티키(띠)용

  return (
    // ✅ 전체 컨테이너
    <div style={{ minHeight: '100vh', backgroundColor: '#fff', color: '#292929' }}>
      
      {/* 1. 팝업 광고 */}
      <AdPopup />

      {/* 2. PC 좌우 배너 (Fixed) */}
      {/* AdBanner 내부에서 왼쪽(자체), 오른쪽(구글) 분기 처리됨 */}
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
        paddingBottom: '60px' // ✅ 스티키 배너 가림 방지 (50px + 여유분)
      }}>
        
        {/* 실제 내용 */}
        <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
          {children}
        </div>

        {/* 4. [정적] 모바일 하단 광고 (스크롤 끝에 박혀있는 광고) */}
        <div className="mobile-only" style={{
          width: '100%',
          padding: '20px 20px 20px 20px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          backgroundColor: '#fff',
          borderTop: '1px solid #eee',
          marginTop: '40px'
        }}>
          {/* 광고 박스 1 */}
          <div style={{ width: '100%', height: '100px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
             <GoogleAd slot={MOBILE_BOTTOM_BOX_SLOT_ID} format="rectangle" />
          </div>
          {/* 광고 박스 2 */}
          <div style={{ width: '100%', height: '100px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
             <GoogleAd slot={MOBILE_BOTTOM_BOX_SLOT_ID} format="rectangle" />
          </div>
        </div>

      </div>

      {/* ✅ 5. [복구] 모바일 스티키 배너 (화면 하단 고정) */}
      <div className="mobile-only" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50px',
        backgroundColor: '#fff', // 광고 배경색 (흰색 추천)
        zIndex: 100, 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
        borderTop: '1px solid #eee'
      }}>
        {/* 높이 50px에 맞는 가로형 광고 */}
        <GoogleAd slot={MOBILE_STICKY_SLOT_ID} format="horizontal" style={{ maxHeight: '50px' }} />
      </div>

    </div>
  );
}