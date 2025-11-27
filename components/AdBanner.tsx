'use client';

import React from 'react';

type Props = {
  position: 'left' | 'right';
};

export default function AdBanner({ position }: Props) {
  return (
    <div 
      style={{
        width: '160px',          // 너비 고정
        height: '100vh',         // 높이 화면 전체 꽉 채움
        position: 'fixed',
        top: 0,
        [position]: 0,           // left: 0 또는 right: 0
        backgroundColor: '#000', // 광고 없을 때 보일 배경색 (이미지 로딩 전)
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        borderLeft: position === 'right' ? '1px solid #222' : 'none',
        borderRight: position === 'left' ? '1px solid #222' : 'none',
        color: '#333',
        fontSize: '14px',
        fontWeight: 'bold'
      }}
    >
      {/* 내부 박스 없이 전체가 광고 영역 */}
      광고 영역 ({position === 'left' ? '좌' : '우'})
    </div>
  );
}