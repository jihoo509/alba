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

{/* ✅ 5. [수정] 모바일 스티키 배너 (높이 강제 고정) */}
      <div className="mobile-only" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff', 
        zIndex: 100, 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
        borderTop: '1px solid #eee',
        
        // 🔥 [핵심 수정 1] 높이를 'auto'가 아니라 계산된 고정값으로 변경
        // 광고 높이(50px) + 여유분(10px) + 아이폰 하단 베젤(safe-area)
        height: 'calc(60px + env(safe-area-inset-bottom))', 
        
        // 🔥 [핵심 수정 2] 광고가 이 높이를 뚫고 나오지 못하도록 넘치는 부분 숨김 처리
        overflow: 'hidden',
        
        // 패딩은 safe-area만 적용 (높이를 고정했으므로 padding-bottom만 챙김)
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxSizing: 'border-box'
      }}>
        
        {/* 내부 광고 래퍼 */}
        <div style={{ 
            width: '320px',    // 가로 고정
            height: '50px',    // 세로 고정
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden' // 이중 잠금
        }}>
           <GoogleAd 
             slot={MOBILE_STICKY_SLOT_ID} 
             format="horizontal" 
             style={{ display:'block', width: '320px', height: '50px' }} 
           />
        </div>
      </div>

    </div>
  );
}