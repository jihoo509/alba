'use client';

import React from 'react';
import Link from 'next/link';

type Props = {
  position: 'left' | 'right';
  href?: string;
};

export default function AdBanner({ position, href = '#' }: Props) {
  // 공통 스타일
  const baseStyle: React.CSSProperties = {
    width: '300px',        // ✅ 300px 고정 (이미지 제작 사이즈와 일치)
    height: '100vh',       // 화면 높이 전체
    position: 'fixed',
    top: 0,
    zIndex: 50,
    backgroundColor: '#fff',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: href !== '#' ? 'pointer' : 'default',
    transition: 'transform 0.2s ease',
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
            // 오른쪽으로 그림자
            boxShadow: '4px 0 15px rgba(0, 0, 0, 0.08)', 
          }}
        >
          <img 
            src="/art-1.png" 
            alt="Left Banner" 
            style={{ 
              width: '100%', 
              height: '100%', 
              // ✅ 300x1080 제작 이미지용 설정
              objectFit: 'cover',      // 비율 유지하며 꽉 채움
              objectPosition: 'center' // 중앙 기준 정렬 (위아래 잘릴 때 중앙 보호)
            }}
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
            // 왼쪽으로 그림자
            boxShadow: '-4px 0 15px rgba(0, 0, 0, 0.08)',
          }}
        >
          {/* 이미지가 art-2.png라면 경로 수정 필요 */}
          <img 
            src="/art-1.png"  
            alt="Right Banner" 
            style={{ 
              width: '100%', 
              height: '100%', 
              // ✅ 300x1080 제작 이미지용 설정
              objectFit: 'cover', 
              objectPosition: 'center' 
            }}
          />
        </div>
      </Link>
    );
  }

  return null;
}