'use client';

import React, { useState, useEffect } from 'react';

type Props = {
  value: string; // "HH:mm" (24시간제)
  onChange: (value: string) => void;
  interval?: number; 
  isLast?: boolean; 
};

export default function TimeSelector({ value, onChange, interval = 30, isLast = false }: Props) {
  // 모달 열림 상태 관리 (어떤 걸 수정 중인지: 'ampm' | 'hour' | 'minute' | null)
  const [activeTab, setActiveTab] = useState<'ampm' | 'hour' | 'minute' | null>(null);

  const [ampm, setAmpm] = useState('AM');
  const [hour, setHour] = useState('12');
  const [minute, setMinute] = useState('00');

  useEffect(() => {
    if (value) {
      const [hStr, mStr] = value.split(':');
      let h = parseInt(hStr, 10);
      if (h >= 12) {
        setAmpm('PM');
        if (h > 12) h -= 12;
      } else {
        setAmpm('AM');
        if (h === 0) h = 12;
      }
      setHour(String(h).padStart(2, '0'));
      setMinute(mStr);
    }
  }, [value]);

  // 값 업데이트 함수
  const updateTime = (newAmpm: string, newHour: string, newMinute: string) => {
    let h24 = parseInt(newHour, 10);
    if (newAmpm === 'PM' && h24 !== 12) h24 += 12;
    if (newAmpm === 'AM' && h24 === 12) h24 = 0;
    const finalTime = `${String(h24).padStart(2, '0')}:${newMinute}`;
    onChange(finalTime);
  };

  const handleSelect = (type: 'ampm' | 'hour' | 'minute', val: string) => {
    let nextAmpm = ampm;
    let nextHour = hour;
    let nextMinute = minute;

    if (type === 'ampm') { nextAmpm = val; setAmpm(val); }
    if (type === 'hour') { nextHour = val; setHour(val); }
    if (type === 'minute') { nextMinute = val; setMinute(val); }

    updateTime(nextAmpm, nextHour, nextMinute);
    setActiveTab(null); // 선택 즉시 닫기
  };

  // 분 목록 생성
  const minutes = [];
  for (let i = 0; i < 60; i += interval) minutes.push(String(i).padStart(2, '0'));
  
  // 시 목록 생성
  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));

  return (
    <>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {/* 커스텀 버튼들 (클릭 시 모달 열림) */}
        <button onClick={() => setActiveTab('ampm')} style={btnStyle}>{ampm === 'AM' ? '오전' : '오후'}</button>
        <button onClick={() => setActiveTab('hour')} style={btnStyle}>{hour}시</button>
        <span style={{fontWeight:'bold', color:'#ccc'}}>:</span>
        <button onClick={() => setActiveTab('minute')} style={btnStyle}>{minute}분</button>
      </div>

      {/* 모달 (activeTab이 있을 때만 보임) */}
      {activeTab && (
        <div style={modalOverlayStyle} onClick={() => setActiveTab(null)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <span>
                {activeTab === 'ampm' ? '오전/오후 선택' : activeTab === 'hour' ? '시간 선택' : '분 선택'}
              </span>
              <button onClick={() => setActiveTab(null)} style={closeBtnStyle}>닫기</button>
            </div>
            
            <div style={gridContainerStyle}>
              {activeTab === 'ampm' && (
                <>
                  <button onClick={() => handleSelect('ampm', 'AM')} style={optionBtnStyle(ampm === 'AM')}>오전</button>
                  <button onClick={() => handleSelect('ampm', 'PM')} style={optionBtnStyle(ampm === 'PM')}>오후</button>
                </>
              )}
              {activeTab === 'hour' && hours.map(h => (
                <button key={h} onClick={() => handleSelect('hour', h)} style={optionBtnStyle(hour === h)}>{h}</button>
              ))}
              {activeTab === 'minute' && minutes.map(m => (
                <button key={m} onClick={() => handleSelect('minute', m)} style={optionBtnStyle(minute === m)}>{m}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// 스타일 정의
const btnStyle = {
  padding: '8px 4px',
  backgroundColor: '#fff',
  border: '1px solid #ccc',
  borderRadius: 6,
  fontSize: '13px',
  color: '#333',
  minWidth: '45px',
  textAlign: 'center' as const,
  cursor: 'pointer'
};

const modalOverlayStyle = {
  position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  zIndex: 9999,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-end', // 바텀 시트처럼 아래에 붙이기
};

const modalContentStyle = {
  width: '100%',
  maxWidth: '500px',
  backgroundColor: '#fff',
  borderTopLeftRadius: '20px',
  borderTopRightRadius: '20px',
  padding: '20px',
  paddingBottom: '40px',
  animation: 'slideUp 0.3s ease-out'
};

const modalHeaderStyle = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  marginBottom: '20px', fontWeight: 'bold', fontSize: '16px'
};

const closeBtnStyle = {
  border: 'none', background: 'none', color: '#999', fontSize: '14px', padding: '4px 8px'
};

const gridContainerStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)', // 한 줄에 4개씩
  gap: '10px',
};

const optionBtnStyle = (isActive: boolean) => ({
  padding: '12px',
  borderRadius: '8px',
  border: isActive ? '1px solid dodgerblue' : '1px solid #eee',
  backgroundColor: isActive ? '#e6f7ff' : '#f9f9f9',
  color: isActive ? 'dodgerblue' : '#333',
  fontWeight: isActive ? 'bold' : 'normal' as const,
  fontSize: '15px'
});