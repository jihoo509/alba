'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link'; // 링크 연결을 위해 추가 (선택 사항)

export default function AdPopup() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 하루 동안 보지 않기 체크 여부 확인 (localStorage)
    const hideUntil = localStorage.getItem('hide_ad_popup');
    // 값이 없거나, 현재 시간이 저장된 시간보다 지났으면 보임
    if (!hideUntil || new Date().getTime() > Number(hideUntil)) {
      setIsVisible(true);
    }
  }, []);

  const closePopup = (hideToday: boolean) => {
    if (hideToday) {
      // 내일 같은 시간까지 숨김 설정
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      localStorage.setItem('hide_ad_popup', String(tomorrow.getTime()));
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div style={{ 
        width: 400, 
        height: 500, 
        background: '#fff', 
        position: 'relative', 
        display: 'flex', 
        flexDirection: 'column',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)', // 그림자 추가 (선택)
        borderRadius: '8px', // 모서리 둥글게 (선택)
        overflow: 'hidden'   // 이미지가 둥근 모서리 밖으로 나가는 것 방지
      }}>
        
        {/* ✅ [수정] 광고 이미지 영역 */}
        {/* 이미지를 클릭하면 링크로 이동하게 하려면 Link 태그 사용 (필요 없으면 div만 사용) */}
        <div style={{ flex: 1, position: 'relative', cursor: 'pointer' }}>
           {/* 예시 링크: 정책자금 사이트 (필요 시 수정하세요) */}
           <Link href="" target="_blank">
             <img 
               src="/pop-1.png" 
               alt="메인 광고" 
               style={{ 
                 width: '100%', 
                 height: '100%', 
                 objectFit: 'cover', // 영역 꽉 채우기
                 display: 'block' 
               }} 
             />
           </Link>
        </div>
        
        {/* 하단 버튼 영역 */}
        <div style={{ 
          height: 40, 
          background: '#222', // 검정색 배경
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '0 15px' 
        }}>
          <label style={{ color: '#fff', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <input 
              type="checkbox" 
              onChange={(e) => { if(e.target.checked) closePopup(true); }} 
              style={{ cursor: 'pointer' }}
            />
            오늘 하루 보지 않기
          </label>
          
          <button 
            onClick={() => closePopup(false)} 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: '#fff', 
              cursor: 'pointer', 
              fontSize: 14,
              fontWeight: 'bold' 
            }}
          >
            닫기 X
          </button>
        </div>
      </div>
    </div>
  );
}