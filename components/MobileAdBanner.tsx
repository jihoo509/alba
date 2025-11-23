'use client';

import React from 'react';

export default function MobileAdBanner() {
  return (
    <div 
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        height: '50px', // 320x50 기준
        backgroundColor: '#222',
        borderTop: '1px solid #444',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
        color: '#555',
        fontSize: '12px'
      }}
    >
      <div style={{ width: '320px', height: '50px', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
        모바일 광고 (320x50)
      </div>
    </div>
  );
}