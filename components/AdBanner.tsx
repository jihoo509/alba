'use client';

import React from 'react';
import Link from 'next/link';
import GoogleAd from './GoogleAd'; // ✅ 구글 광고 컴포넌트 import

type Props = {
  position: 'left' | 'right';
  href?: string;
};

export default function AdBanner({ position, href }: Props) {
  // 왼쪽 배너 링크 (정책자금 등)
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
    transition: 'transform 0.2s ease',
  };

  // -------------------------------------------------------
  // 🟢 [왼쪽 배너] - 기존 이미지 배너 유지 (정책자금 등)
  // -------------------------------------------------------
  if (position === 'left') {
    return (
      <Link href={targetLink} target="_blank" style={{ textDecoration: 'none' }}>
        <div 
          className="responsive-banner" 
          style={{
            ...baseStyle,
            left: 0,
            boxShadow: '4px 0 15px rgba(0, 0, 0, 0.08)', 
            cursor: 'pointer'
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
  // 🔵 [오른쪽 배너] - 구글 애드센스 광고로 교체
  // -------------------------------------------------------
  if (position === 'right') {
    // 구글 애드센스에서 발급받은 '수직형' 광고 단위 ID를 넣으세요.
    const GOOGLE_AD_SLOT_ID = "1234567890"; // 🔴 여기에 실제 ID 입력

    return (
      <div 
        className="responsive-banner"
        style={{
          ...baseStyle,
          right: 0,
          boxShadow: '-4px 0 15px rgba(0, 0, 0, 0.08)',
          cursor: 'default' // 광고는 커서 기본
        }}
      >
        {/* 구글 광고 컴포넌트 */}
        <GoogleAd slot={GOOGLE_AD_SLOT_ID} format="vertical" />
      </div>
    );
  }

  return null;
}