'use client';

import React, { useState, useEffect } from 'react';

type Props = {
  popups: any[]; // 팝업 데이터 배열
};

export default function AdPopup({ popups }: Props) {
  const [visiblePopups, setVisiblePopups] = useState<any[]>([]);

  useEffect(() => {
    // 로컬 스토리지 확인하여 24시간이 지나지 않은 팝업은 숨김
    const now = new Date().getTime();
    const active = popups.filter(p => {
      const hideUntil = localStorage.getItem(`hide_popup_${p.id}`);
      // 저장된 시간이 없거나, 현재 시간이 저장된 시간(만료시간)보다 지났으면 보여줌
      if (!hideUntil) return true;
      return now > parseInt(hideUntil);
    });
    setVisiblePopups(active);
  }, [popups]);

  const closePopup = (id: string, hideToday: boolean) => {
    if (hideToday) {
      // 24시간 뒤의 시간값(밀리초)을 계산해서 저장
      const twentyFourHoursLater = new Date().getTime() + (24 * 60 * 60 * 1000);
      localStorage.setItem(`hide_popup_${id}`, twentyFourHoursLater.toString());
    }
    setVisiblePopups(prev => prev.filter(p => p.id !== id));
  };

  // 배경 클릭 시 닫기 핸들러
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>, id: string) => {
    if (e.target === e.currentTarget) {
      closePopup(id, false);
    }
  };

  if (visiblePopups.length === 0) return null;

  return (
    <>
      {visiblePopups.map((popup, index) => (
        <div
          key={popup.id}
          onClick={(e) => handleOverlayClick(e, popup.id)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 9999 + index,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <div 
            style={{ 
              position: 'relative', 
              width: '90%', 
              maxWidth: '400px', 
              backgroundColor: 'transparent', 
              borderRadius: '12px', 
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}
          >
            {/* 링크 유무에 따른 렌더링 */}
            {popup.link && popup.link.trim() !== '' ? (
              <a href={popup.link} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                <img 
                  src={popup.image_url} 
                  alt={popup.title} 
                  style={{ width: '100%', height: 'auto', display: 'block' }} 
                />
              </a>
            ) : (
              <img 
                src={popup.image_url} 
                alt={popup.title} 
                style={{ width: '100%', height: 'auto', display: 'block' }} 
              />
            )}

            {/* 하단 컨트롤 바 */}
            <div style={{ backgroundColor: '#222', color: '#fff', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  onChange={(e) => {
                    if (e.target.checked) closePopup(popup.id, true);
                  }} 
                />
                오늘 하루 보지 않기
              </label>
              <button 
                onClick={() => closePopup(popup.id, false)} 
                style={{ background: 'none', border: 'none', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
              >
                닫기 ✕
              </button>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}