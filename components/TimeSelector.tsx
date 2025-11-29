'use client';

import React, { useEffect, useState, useMemo } from 'react';

type Props = {
  value: string; // "HH:mm" (24시간제)
  onChange: (value: string) => void;
  interval?: number; 
  isLast?: boolean;  // 마지막 입력칸(종료 시간)인지 여부
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
  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement>, 
    type: 'ampm' | 'hour' | 'minute'
  ) => {
    const val = e.target.value;
    
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

    // ✅ [핵심 해결책] '분'을 변경했고, 이것이 '종료 시간(isLast)'이라면?
    // -> 강제로 포커스를 해제(blur)하여 모바일 키보드/피커를 닫아버림!
    if (type === 'minute' && isLast) {
      e.target.blur(); 
    }
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
        onChange={(e) => handleChange(e, 'ampm')}
        style={{ ...selectStyle, width: 60 }}
      >
        <option value="AM">오전</option>
        <option value="PM">오후</option>
      </select>

      {/* 시 */}
      <select
        value={hour}
        onChange={(e) => handleChange(e, 'hour')}
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
        onChange={(e) => handleChange(e, 'minute')}
        style={{ ...selectStyle, width: 50 }}
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