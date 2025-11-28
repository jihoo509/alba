'use client';

import React from 'react';
import Link from 'next/link'; // ✅ 링크 이동을 위해 추가

type Props = {
  position: 'left' | 'right';
  href?: string; // ✅ 나중에 링크 걸 때 사용할 주소 (선택 사항)
};

export default function AdBanner({ position, href = '#' }: Props) {
  // 공통 스타일
  const baseStyle: React.CSSProperties = {
    width: '300px',
    height: '100vh',
    position: 'fixed',
    top: 0,
    zIndex: 50,
    backgroundColor: '#fff',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: href !== '#' ? 'pointer' : 'default', // 링크가 있으면 손가락 모양
    transition: 'transform 0.2s ease', // (선택) 마우스 올렸을 때 살짝 반응 효과
  };

  // -------------------------------------------------------
  // 🟢 [왼쪽 배너]
  // -------------------------------------------------------
  if (position === 'left') {
    return (
      <Link href={href} style={{ textDecoration: 'none' }}>
        <div 
          style={{
            ...baseStyle,
            left: 0,
            // 오른쪽으로 그림자 (4px)
            boxShadow: '4px 0 15px rgba(0, 0, 0, 0.08)', 
          }}
        >
          <img 
            src="/art-1.png" 
            alt="Left Banner" 
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
          />
        </div>
      </Link>
    );
  }

  // -------------------------------------------------------
  // 🔵 [오른쪽 배너]
  // -------------------------------------------------------
  if (position === 'right') {
    return (
      <Link href={href} style={{ textDecoration: 'none' }}>
        <div 
          style={{
            ...baseStyle,
            right: 0,
            // 왼쪽으로 그림자 (-4px) : 방향만 반대
            boxShadow: '-4px 0 15px rgba(0, 0, 0, 0.08)',
          }}
        >
          <img 
            src="/art-1.png" 
            alt="Right Banner" 
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
          />
        </div>
      </Link>
    );
  }

  return null;
}