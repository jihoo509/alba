'use client'; // 필수!

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 에러 로그를 서버에 남길 수도 있습니다.
    console.error(error);
  }, [error]);

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>⚠️</h1>
      <h2 style={subTitleStyle}>잠시 문제가 발생했습니다.</h2>
      <p style={descStyle}>
        일시적인 오류일 수 있습니다.<br />
        잠시 후 다시 시도해 주세요.
      </p>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={() => reset()} style={buttonStyle}>
          다시 시도하기
        </button>
        <a href="/dashboard" style={outlineButtonStyle}>
          홈으로 가기
        </a>
      </div>
    </div>
  );
}

// 스타일
const containerStyle = {
  display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center',
  height: '100vh', backgroundColor: '#fff', textAlign: 'center' as const, padding: '20px'
};
const titleStyle = { fontSize: '60px', margin: '0 0 20px 0' };
const subTitleStyle = { fontSize: '22px', fontWeight: 'bold', color: '#333', margin: '0' };
const descStyle = { fontSize: '15px', color: '#666', lineHeight: '1.5', margin: '10px 0 30px 0' };
const buttonStyle = {
  padding: '12px 24px', backgroundColor: '#0052cc', color: '#fff', border: 'none', borderRadius: '8px',
  cursor: 'pointer', fontWeight: 'bold', fontSize: '15px'
};
const outlineButtonStyle = {
  padding: '12px 24px', backgroundColor: '#fff', color: '#0052cc', border: '1px solid #0052cc', borderRadius: '8px',
  textDecoration: 'none', fontWeight: 'bold', fontSize: '15px', display: 'flex', alignItems: 'center'
};