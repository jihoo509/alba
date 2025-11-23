'use client';

import React, { useState, useEffect } from 'react';

export default function AdPopup() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 하루 동안 보지 않기 체크 여부 확인 (localStorage)
    const hideUntil = localStorage.getItem('hide_ad_popup');
    if (!hideUntil || new Date().getTime() > Number(hideUntil)) {
      setIsVisible(true);
    }
  }, []);

  const closePopup = (hideToday: boolean) => {
    if (hideToday) {
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
      <div style={{ width: 400, height: 500, background: '#fff', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        {/* 광고 이미지 영역 (임시) */}
        <div style={{ flex: 1, background: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: 20, fontWeight: 'bold' }}>
          메인 광고 배너
        </div>
        
        {/* 하단 버튼 */}
        <div style={{ height: 40, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px' }}>
          <label style={{ color: '#fff', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" onChange={(e) => { if(e.target.checked) closePopup(true); }} />
            오늘 하루 보지 않기
          </label>
          <button onClick={() => closePopup(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13 }}>
            닫기 X
          </button>
        </div>
      </div>
    </div>
  );
}