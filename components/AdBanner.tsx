'use client';

import React from 'react';
import Link from 'next/link';

type Props = {
  position: 'left' | 'right';
  href?: string; 
};

export default function AdBanner({ position, href }: Props) {
  // ✅ [수정] 링크 주소 결정 로직
  // 1. 왼쪽이면 -> '정책자금 사이트' 주소 고정
  // 2. 오른쪽이거나 다른 경우 -> props로 받은 href 또는 '#' (기본값)
  const targetLink = position === 'left' 
    ? "https://policy-funding.ba-damda.com/" 
    : (href || '#');

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
    cursor: targetLink !== '#' ? 'pointer' : 'default', // 링크 있으면 포인터 커서
    transition: 'transform 0.2s ease',
  };

  // -------------------------------------------------------
  // 🟢 [왼쪽 배너] : 정책자금 (링크 적용됨)
  // -------------------------------------------------------
  if (position === 'left') {
    return (
      // ✅ target="_blank"를 추가하면 새 창으로 열립니다. (선택 사항)
      <Link href={targetLink} target="_blank" style={{ textDecoration: 'none' }}>
        <div 
          style={{
            ...baseStyle,
            left: 0,
            boxShadow: '4px 0 15px rgba(0, 0, 0, 0.08)', 
          }}
        >
          {/* 왼쪽 이미지 (파일명 확인 필요, 예: policy-banner.png 등) */}
          <img 
            src="/art-2.png" 
            alt="정책자금 지원" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover', 
              objectPosition: 'center' 
            }}
          />
        </div>
      </Link>
    );
  }

  // -------------------------------------------------------
  // 🔵 [오른쪽 배너] : 보험인 구인
  // -------------------------------------------------------
  if (position === 'right') {
    return (
      <Link href={targetLink} style={{ textDecoration: 'none' }}>
        <div 
          style={{
            ...baseStyle,
            right: 0,
            boxShadow: '-4px 0 15px rgba(0, 0, 0, 0.08)',
          }}
        >
          {/* 오른쪽 이미지 (파일명 art-2.png 등으로 교체했으면 수정) */}
          <img 
            src="/art-1.png"  
            alt="보험인 구인" 
            style={{ 
              width: '100%', 
              height: '100%', 
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