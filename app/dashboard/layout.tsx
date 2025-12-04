import React from 'react';
import AdBanner from '@/components/AdBanner';
import AdPopup from '@/components/AdPopup';
import GoogleAd from '@/components/GoogleAd';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 🔴 [중요] 실제 운영 시엔 사장님 애드센스 ID로 변경 필수
  const MOBILE_BOTTOM_BOX_SLOT_ID = "4218312145"; 
  const MOBILE_STICKY_SLOT_ID = "1423137158";     

  return (
    // ✅ 전체 컨테이너
    <div style={{ minHeight: '100vh', backgroundColor: '#fff', color: '#292929' }}>
      
      {/* 1. 팝업 광고 (기존 유지) */}
      <AdPopup />

      {/* 2. PC 좌우 배너 (기존 유지) */}
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
        // ✅ [수정] 하단 스티키 배너 높이(50px) + 여유분(20px) + 아이폰 하단 베젤(safe-area)만큼 패딩 확보
        paddingBottom: 'calc(70px + env(safe-area-inset-bottom))' 
      }}>
        
        {/* 실제 내용 */}
        <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
          {children}
        </div>

        {/* 4. [정적] 모바일 하단 광고 박스 (기존 유지) */}
        <div className="mobile-only" style={{
          width: '100%',
          padding: '20px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          backgroundColor: '#fff',
          borderTop: '1px solid #eee',
          marginTop: '40px'
        }}>
          {/* 광고 박스 1 */}
          <div style={{ width: '100%', height: '100px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', background:'#f8f8f8', borderRadius:8 }}>
             {/* 높이 제한을 위해 overflow: hidden 추가 및 배경색으로 영역 표시 */}
             <GoogleAd slot={MOBILE_BOTTOM_BOX_SLOT_ID} format="rectangle" />
          </div>
          {/* 광고 박스 2 */}
          <div style={{ width: '100%', height: '100px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', background:'#f8f8f8', borderRadius:8 }}>
             <GoogleAd slot={MOBILE_BOTTOM_BOX_SLOT_ID} format="rectangle" />
          </div>
        </div>

      </div>

{/* ✅ 5. [수정] 모바일 스티키 배너 (CSS 강제 고정 적용) */}
      <div className="mobile-only sticky-ad-container" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff', 
        zIndex: 100, 
        borderTop: '1px solid #eee',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
        // 하단 여백(Safe Area) 확보
        paddingBottom: 'env(safe-area-inset-bottom)',
        // 높이 강제 지정 (내용물이 커져도 이 이상 안 커짐)
        height: '60px', 
        maxHeight: '60px',
        overflow: 'hidden', 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {/* 🔥 CSS로 내부 광고 크기 강제 조절 (인라인 스타일 무시) */}
        <style dangerouslySetInnerHTML={{__html: `
          .sticky-ad-container ins, 
          .sticky-ad-container iframe {
            height: 50px !important;
            max-height: 50px !important;
            min-height: 50px !important;
            margin: 0 auto !important;
          }
        `}} />

        <div style={{ width: '320px', height: '50px' }}>
           {/* format을 비워두거나 "false"로 설정하여 반응형 동작 억제 */}
           <GoogleAd 
             slot={MOBILE_STICKY_SLOT_ID} 
             format="" 
             style={{ display:'block', width: '320px', height: '50px' }} 
           />
        </div>
      </div>

    </div>
  );
}