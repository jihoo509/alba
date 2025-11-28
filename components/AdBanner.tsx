'use client';

import React from 'react';

type Props = {
  position: 'left' | 'right';
};

export default function AdBanner({ position }: Props) {
  // 공통 스타일 (너비, 높이, 위치 고정 등)
  const baseStyle: React.CSSProperties = {
    width: '300px',        // 너비 300px
    height: '100vh',       // 높이 화면 전체
    position: 'fixed',
    top: 0,
    zIndex: 50,
    backgroundColor: '#fff',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  // -------------------------------------------------------
  // 🟢 [왼쪽 배너] : 방법 1 (그림자 효과)
  // -------------------------------------------------------
  if (position === 'left') {
    return (
      <div 
        style={{
          ...baseStyle,
          left: 0,
          // 그림자 효과 (오른쪽으로 그림자가 지도록 설정)
          boxShadow: '4px 0 15px rgba(0, 0, 0, 0.08)',
          borderRight: 'none' // 테두리 없음
        }}
      >
        <img 
          src="/art-1.png" 
          alt="Left Banner" 
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center'
          }}
        />
      </div>
    );
  }

  // -------------------------------------------------------
  // 🔵 [오른쪽 배너] : 방법 2 (테두리 효과)
  // -------------------------------------------------------
  if (position === 'right') {
    return (
      <div 
        style={{
          ...baseStyle,
          right: 0,
          // 그림자 없음
          boxShadow: 'none', 
          // 왼쪽에 연한 회색 테두리 추가
          borderLeft: '1px solid #e0e0e0',
        }}
      >
        <img 
          src="/art-1.png" 
          alt="Right Banner" 
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center'
          }}
        />
      </div>
    );
  }

  return null;
}