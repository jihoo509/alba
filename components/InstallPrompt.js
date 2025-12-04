'use client';

import { useState, useEffect } from 'react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      // 1. 브라우저가 자동으로 설치 안내를 띄우지 않게 막습니다.
      e.preventDefault();
      // 2. 나중에 버튼을 눌렀을 때 설치 창을 띄우기 위해 이벤트를 저장해둡니다.
      setDeferredPrompt(e);
      // 3. 이제 설치 버튼을 화면에 보여줍니다.
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // 저장해둔 설치 프롬프트를 실행합니다.
    deferredPrompt.prompt();

    // 사용자가 설치를 수락했는지 거절했는지 결과를 기다립니다.
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    // 한 번 썼으면 초기화하고 버튼을 숨깁니다.
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  // 설치 조건이 안 되면 아무것도 렌더링하지 않습니다.
  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed', 
      bottom: '20px', 
      left: '50%', 
      transform: 'translateX(-50%)', 
      zIndex: 1000,
      backgroundColor: '#0070f3',
      color: 'white',
      padding: '12px 24px',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      cursor: 'pointer'
    }}>
      <button 
        onClick={handleInstallClick} 
        style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer' }}
      >
        앱으로 설치하고 편하게 쓰기 ⬇️
      </button>
    </div>
  );
}