'use client';

import React from 'react';

type Props = {
  position: 'left' | 'right';
};

export default function AdBanner({ position }: Props) {
  // 1. "오른쪽에만 적용" 요청에 따라 왼쪽일 경우 아예 렌더링하지 않음 (null 반환)
  if (position === 'left') return null;

  return (
    <div 
      style={{
        width: '400px',        // 너비 200px 고정
        height: '100vh',       // 높이 화면 전체
        position: 'fixed',
        top: 0,
        right: 0,              // 오른쪽 고정
        zIndex: 50,
        backgroundColor: '#fff', // 이미지 로딩 전 배경색
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        // borderLeft: '1px solid #ddd', // 필요 시 경계선 추가
      }}
    >
      {/* 2. public 폴더의 art-1.png 불러오기 */}
      <img 
        src="/art-1.png" 
        alt="Right Banner" 
        style={{
          width: '100%',
          height: '100%',
          // 'cover': 화면 높이에 맞춰 꽉 채움 (비율 유지, 위아래 일부 잘릴 수 있음)
          // 'contain': 이미지가 잘리지 않고 다 보임 (대신 위아래 여백 생길 수 있음)
          objectFit: 'cover', 
          objectPosition: 'center'
        }}
      />
    </div>
  );
}