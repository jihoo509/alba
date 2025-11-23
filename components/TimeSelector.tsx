'use client';

import React, { useEffect, useState } from 'react';

type Props = {
  value: string; // "HH:mm" (24시간제)
  onChange: (value: string) => void;
};

export default function TimeSelector({ value, onChange }: Props) {
  const [ampm, setAmpm] = useState('AM');
  const [hour, setHour] = useState('12');
  const [minute, setMinute] = useState('00');

  // 값 변경 시 (24시간제 -> 12시간제 변환)
  useEffect(() => {
    if (value) {
      const [hStr, mStr] = value.split(':');
      let h = parseInt(hStr, 10);
      
      // AM/PM 계산
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

  // 사용자가 선택했을 때 (12시간제 -> 24시간제 변환 후 부모에게 전달)
  const handleChange = (type: 'ampm' | 'hour' | 'minute', val: string) => {
    let newAmpm = ampm;
    let newHour = hour;
    let newMinute = minute;

    if (type === 'ampm') newAmpm = val;
    if (type === 'hour') newHour = val;
    if (type === 'minute') newMinute = val;

    // 12시간제 -> 24시간제 변환
    let h24 = parseInt(newHour, 10);
    if (newAmpm === 'PM' && h24 !== 12) h24 += 12;
    if (newAmpm === 'AM' && h24 === 12) h24 = 0;

    const finalTime = `${String(h24).padStart(2, '0')}:${newMinute}`;
    
    // 내부 상태 즉시 업데이트 (UI 반응성)
    if (type === 'ampm') setAmpm(val);
    if (type === 'hour') setHour(val);
    if (type === 'minute') setMinute(val);

    onChange(finalTime);
  };

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0')); // 5분 단위

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {/* 오전/오후 */}
      <select
        value={ampm}
        onChange={(e) => handleChange('ampm', e.target.value)}
        style={{ ...selectStyle, width: 65 }}
      >
        <option value="AM">오전</option>
        <option value="PM">오후</option>
      </select>

      {/* 시 */}
      <select
        value={hour}
        onChange={(e) => handleChange('hour', e.target.value)}
        style={{ ...selectStyle, width: 55 }}
      >
        {hours.map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <span style={{ color: '#fff', fontWeight: 'bold' }}>:</span>

      {/* 분 */}
      <select
        value={minute}
        onChange={(e) => handleChange('minute', e.target.value)}
        style={{ ...selectStyle, width: 55 }}
      >
        {minutes.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
    </div>
  );
}

const selectStyle = {
  padding: '8px 4px',
  backgroundColor: '#333',
  border: '1px solid #555',
  borderRadius: 4,
  color: '#fff',
  fontSize: '14px',
  textAlign: 'center' as const,
  outline: 'none',
  cursor: 'pointer'
};