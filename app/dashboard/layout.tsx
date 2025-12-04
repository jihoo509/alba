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
  // const MOBILE_STICKY_SLOT_ID = "1423137158"; // 🗑️ 스티키 슬롯 ID는 이제 안 쓰므로 주석 처리

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
        // ✅ [수정] 하단 스티키 배너가 사라졌으므로, 불필요한 큰 여백(70px)을 제거하고 기본 여백(20px)만 남김
        paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' 
      }}>
        
        {/* 실제 내용 */}
        <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
          {children}
        </div>

{/* 4. [정적] 모바일 하단 광고 박스 (수정됨) */}
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
          <div style={{ 
              width: '100%', 
              height: '100px', // 높이 100px 공간 확보
              overflow: 'hidden', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              background:'#f8f8f8', 
              borderRadius:8 
          }}>
             {/* 🔹 [핵심 수정] rectangle(사각형) -> horizontal(가로형) 변경 */}
             <GoogleAd 
                slot={MOBILE_BOTTOM_BOX_SLOT_ID} 
                format="horizontal" 
                responsive="true" 
             />
          </div>

          {/* 광고 박스 2 */}
          <div style={{ 
              width: '100%', 
              height: '100px', 
              overflow: 'hidden', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              background:'#f8f8f8', 
              borderRadius:8 
          }}>
             {/* 🔹 [핵심 수정] 여기도 horizontal로 변경 */}
             <GoogleAd 
                slot={MOBILE_BOTTOM_BOX_SLOT_ID} 
                format="horizontal"
                responsive="true" 
             />
          </div>
        </div>
      </div>

      {/* ✅ 5. 모바일 스티키 배너 삭제됨 */}

    </div>
  );
}