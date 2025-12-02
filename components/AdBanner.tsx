'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import GoogleAd from './GoogleAd';

type Props = {
  position: 'left' | 'right';
  href?: string;
};

// ✅ [왼쪽 배너 목록] 여기에 계속 추가하면 됩니다!
const LEFT_BANNERS = [
  {
    img: '/art-1.png',
    link: 'https://tremendous-sunset-519.notion.site/51ec9464cecd425d91c96f5a8167471d?pvs=105'
  },
  {
    img: '/art-2.png',
    link: 'https://policy-funding.ba-damda.com/'
  },
  // { img: '/art-3.png', link: '...' }, // 나중에 이렇게 추가
];

export default function AdBanner({ position, href }: Props) {
  const [randomBanner, setRandomBanner] = useState(LEFT_BANNERS[0]);

  useEffect(() => {
    // 왼쪽 배너일 때만 랜덤 선택
    if (position === 'left') {
      const randomIndex = Math.floor(Math.random() * LEFT_BANNERS.length);
      setRandomBanner(LEFT_BANNERS[randomIndex]);
    }
  }, [position]);

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

  // 🟢 [왼쪽 배너] - 랜덤 이미지 노출
  if (position === 'left') {
    return (
      <Link href={randomBanner.link} target="_blank" style={{ textDecoration: 'none' }}>
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
            src={randomBanner.img} 
            alt="광고 배너" 
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
          />
        </div>
      </Link>
    );
  }

  // 🔵 [오른쪽 배너] - 구글 광고
  if (position === 'right') {
    const GOOGLE_AD_SLOT_ID = "7310830607"; // 🔴 실제 슬롯 ID 확인

    return (
      <div 
        className="responsive-banner"
        style={{
          ...baseStyle,
          right: 0,
          boxShadow: '-4px 0 15px rgba(0, 0, 0, 0.08)',
          cursor: 'default'
        }}
      >
        <GoogleAd slot={GOOGLE_AD_SLOT_ID} format="vertical" />
      </div>
    );
  }

  return null;
}