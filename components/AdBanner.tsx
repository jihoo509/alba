'use client';

import React from 'react';
import Link from 'next/link';

type Props = {
  position: 'left' | 'right';
  href?: string;
};

export default function AdBanner({ position, href }: Props) {
  // 링크 주소 결정
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
    cursor: targetLink !== '#' ? 'pointer' : 'default',
    transition: 'transform 0.2s ease',
  };

  // -------------------------------------------------------
  // 🟢 [왼쪽 배너]
  // -------------------------------------------------------
  if (position === 'left') {
    return (
      <Link href={targetLink} target="_blank" style={{ textDecoration: 'none' }}>
        {/* ✅ className="responsive-banner" 추가 */}
        <div 
          className="responsive-banner" 
          style={{
            ...baseStyle,
            left: 0,
            boxShadow: '4px 0 15px rgba(0, 0, 0, 0.08)', 
          }}
        >
          <img 
            src="/art-2.png" 
            alt="정책자금 지원" 
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
      <Link href={targetLink} style={{ textDecoration: 'none' }}>
        {/* ✅ className="responsive-banner" 추가 */}
        <div 
          className="responsive-banner"
          style={{
            ...baseStyle,
            right: 0,
            boxShadow: '-4px 0 15px rgba(0, 0, 0, 0.08)',
          }}
        >
          <img 
            src="/art-1.png"  
            alt="보험인 구인" 
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
          />
        </div>
      </Link>
    );
  }

  return null;
}