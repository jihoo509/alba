'use client';

import React, { useState, useEffect } from 'react';
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
  
  // ✅ [로직 추가] 랜덤 광고 상태 관리
  // 초기값을 null로 두어 서버/클라이언트 불일치(Hydration) 에러 방지
  const [randomAd, setRandomAd] = useState<{ img: string; link: string } | null>(null);

  useEffect(() => {
    // 광고 데이터 목록
    const adList = [
      {
        img: '/art-m-1.png', // public 폴더 기준 경로
        link: 'https://policy-funding.ba-damda.com/'
      },
      {
        img: '/art-m-2.png',
        link: 'https://tremendous-sunset-519.notion.site/51ec9464cecd425d91c96f5a8167471d'
      }
    ];

    // 페이지 접속 시 0 또는 1 중 랜덤 선택
    const randomIndex = Math.floor(Math.random() * adList.length);
    setRandomAd(adList[randomIndex]);
  }, []);

  return (
    // ✅ 전체 컨테이너
    <div style={{ minHeight: '100vh', backgroundColor: '#fff', color: '#292929' }}>
      
      {/* 1. 팝업 광고 */}
      <AdPopup />

      {/* 2. PC 좌우 배너 */}
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
        // 하단 여백: 스티키 배너가 없으므로 기본값(20px) + 아이폰 하단 베젤(safe-area)
        paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' 
      }}>
        
        {/* 실제 내용 */}
        <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
          {children}
        </div>

        {/* 4. [모바일 하단] 광고 박스 2개 */}
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
          
          {/* ✅ [광고 박스 1] 직접 광고 (랜덤 로테이션) */}
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
             {randomAd ? (
              <a 
                href={randomAd.link} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ display: 'block', width: '100%', height: '100%', textAlign: 'center' }}
              >
                <img 
                  src={randomAd.img} 
                  alt="Advertisement" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '100%', 
                    objectFit: 'contain', 
                    width: 'auto',
                    height: 'auto'
                  }} 
                />
              </a>
            ) : (
              // 로딩 전 잠깐 보일 빈 화면
              <div style={{ width: '100%', height: '100%' }} />
            )}
          </div>

          {/* ✅ [광고 박스 2] 구글 애드센스 (고정 사이즈) */}
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
             <GoogleAd 
               slot={MOBILE_BOTTOM_BOX_SLOT_ID} 
               format="" 
               responsive="false"
               style={{ display:'inline-block', width: '320px', height: '50px' }}
             />
          </div>
        </div>

      </div>
    </div>
  );
}