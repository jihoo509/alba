'use client';

import React, { useEffect, useState, useMemo } from 'react';

type Props = {
  value: string; // "HH:mm" (24시간제)
  onChange: (value: string) => void;
  interval?: number; // 분 단위 (기본 30)
  isLast?: boolean;  // ✅ [신규] 마지막 입력칸인지 여부 (모바일 '다음' 버튼 제어용)
};

export default function TimeSelector({ value, onChange, interval = 30, isLast = false }: Props) {
  const [ampm, setAmpm] = useState('AM');
  const [hour, setHour] = useState('12');
  const [minute, setMinute] = useState('00');

  // 값 변경 감지 및 초기화
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

  // 변경 핸들러
  const handleChange = (type: 'ampm' | 'hour' | 'minute', val: string) => {
    let newAmpm = ampm;
    let newHour = hour;
    let newMinute = minute;

    if (type === 'ampm') newAmpm = val;
    if (type === 'hour') newHour = val;
    if (type === 'minute') newMinute = val;

    let h24 = parseInt(newHour, 10);
    if (newAmpm === 'PM' && h24 !== 12) h24 += 12;
    if (newAmpm === 'AM' && h24 === 12) h24 = 0;

    const finalTime = `${String(h24).padStart(2, '0')}:${newMinute}`;
    
    if (type === 'ampm') setAmpm(val);
    if (type === 'hour') setHour(val);
    if (type === 'minute') setMinute(val);

    onChange(finalTime);
  };

  // interval에 따라 분 목록 동적 생성
  const minutes = useMemo(() => {
    const list = [];
    for (let i = 0; i < 60; i += interval) {
      list.push(String(i).padStart(2, '0'));
    }
    return list;
  }, [interval]);

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {/* 오전/오후 */}
      <select
        value={ampm}
        onChange={(e) => handleChange('ampm', e.target.value)}
        style={{ ...selectStyle, width: 60 }}
      >
        <option value="AM">오전</option>
        <option value="PM">오후</option>
      </select>

      {/* 시 */}
      <select
        value={hour}
        onChange={(e) => handleChange('hour', e.target.value)}
        style={{ ...selectStyle, width: 50 }}
      >
        {hours.map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <span style={{ color: '#aaa', fontWeight: 'bold' }}>:</span>

      {/* 분 */}
      <select
        value={minute}
        onChange={(e) => handleChange('minute', e.target.value)}
        style={{ ...selectStyle, width: 50 }}
        // ✅ [핵심] 마지막 요소일 경우 '다음' 대신 '완료(Done)' 동작 유도
        enterKeyHint={isLast ? 'done' : 'next'}
      >
        {minutes.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
    </div>
  );
}

const selectStyle = {
  padding: '8px 2px',
  backgroundColor: '#333',
  border: '1px solid #555',
  borderRadius: 4,
  color: '#fff',
  fontSize: '13px',
  textAlign: 'center' as const,
  outline: 'none',
  cursor: 'pointer'
};