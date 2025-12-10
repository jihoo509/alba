'use client';

import React from 'react';

export default function BusinessFooter() {
  return (
    <footer style={footerStyle}>
      <div style={containerStyle}>
        <div style={rowStyle}>
          <span style={labelStyle}>상호명</span>
          <span style={valueStyle}>바르게 담다</span>
          <span style={dividerStyle}>|</span>
          <span style={labelStyle}>대표</span>
          <span style={valueStyle}>신지후</span>
        </div>
        
        <div style={rowStyle}>
          <span style={labelStyle}>사업자등록번호</span>
          <span style={valueStyle}>686-21-01069</span>
        </div>

        <div style={rowStyle}>
          <span style={labelStyle}>문의</span>
          <span style={valueStyle}>inserr509@daum.net</span>
        </div>

        <div style={copyrightStyle}>
          © Easy Alba. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

const footerStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#f8f9fa', // 연한 회색 배경
  borderTop: '1px solid #eee',
  padding: '30px 20px 30px 20px', // ✅ [중요] 하단 80px 여백 (모바일 광고 가림 방지)
  marginTop: '10px',
  boxSizing: 'border-box',
  display: 'flex',
  justifyContent: 'center'
};

const containerStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '1000px',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  color: '#888',
  fontSize: '12px',
  lineHeight: '1.5',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '4px',
};

const labelStyle: React.CSSProperties = {
  fontWeight: 'bold',
  color: '#555',
};

const valueStyle: React.CSSProperties = {
  color: '#666',
};

const dividerStyle: React.CSSProperties = {
  margin: '0 4px',
  color: '#ccc',
  fontSize: '10px',
};

const copyrightStyle: React.CSSProperties = {
  marginTop: '12px',
  fontSize: '11px',
  color: '#aaa',
};