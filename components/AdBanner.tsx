'use client';

import React from 'react';

type Props = {
  position: 'left' | 'right';
};

export default function AdBanner({ position }: Props) {
  return (
    <div 
      style={{
        width: '160px', // 배너 고정 너비
        height: '100vh',
        position: 'fixed',
        top: 0,
        [position]: 0, // left:0 or right:0
        backgroundColor: '#000', // 배경색 (이미지 없을 때 대비)
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '100px', // 상단 여백
        zIndex: 50,
        // 경계선 제거 (원하면 추가 가능)
      }}
    >
      {/* 여기에 실제 광고 코드나 이미지를 넣으면 꽉 차게 나옵니다 */}
      <div style={{ width: '100%', height: '600px', background: '#222', color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
        광고 영역<br/>(160x600)
      </div>
    </div>
  );
}