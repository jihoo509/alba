'use client';

import React from 'react';

type Props = {
  position: 'left' | 'right';
};

export default function AdBanner({ position }: Props) {
  return (
    <div 
      style={{
        width: '160px', // 배너 너비
        height: '100vh',
        position: 'fixed',
        top: 0,
        [position]: 0, // left:0 or right:0
        backgroundColor: '#111',
        borderLeft: position === 'right' ? '1px solid #333' : 'none',
        borderRight: position === 'left' ? '1px solid #333' : 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        color: '#555'
      }}
    >
      <div style={{ width: '140px', height: '600px', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px dashed #444' }}>
        광고 영역 ({position === 'left' ? '좌' : '우'})
        <br />
        160x600
      </div>
    </div>
  );
}