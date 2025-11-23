'use client';

import React, { useEffect, useState } from 'react';

type Props = {
  value: string | null | undefined; // "YYYY-MM-DD" 형태
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function DateSelector({ value, onChange, placeholder = '날짜 선택' }: Props) {
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');

  // 초기값 파싱
  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split('-');
      setYear(y);
      setMonth(m);
      setDay(d);
    } else {
      setYear('');
      setMonth('');
      setDay('');
    }
  }, [value]);

  // 변경 핸들러
  const handleChange = (type: 'year' | 'month' | 'day', val: string) => {
    let newY = year;
    let newM = month;
    let newD = day;

    if (type === 'year') newY = val;
    if (type === 'month') newM = val;
    if (type === 'day') newD = val;

    // 상태 업데이트
    if (type === 'year') setYear(val);
    if (type === 'month') setMonth(val);
    if (type === 'day') setDay(val);

    // 셋 다 선택되었을 때만 부모에게 값 전달
    if (newY && newM && newD) {
      onChange(`${newY}-${newM}-${newD}`);
    }
  };

  // 연도 목록 (1950 ~ 2035)
  const years = Array.from({ length: 86 }, (_, i) => String(1950 + i));
  // 월 목록 (01 ~ 12)
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  // 일 목록 (01 ~ 31)
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {/* 연도 */}
      <select
        value={year}
        onChange={(e) => handleChange('year', e.target.value)}
        style={selectStyle}
      >
        <option value="">년</option>
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>

      {/* 월 */}
      <select
        value={month}
        onChange={(e) => handleChange('month', e.target.value)}
        style={selectStyle}
      >
        <option value="">월</option>
        {months.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>

      {/* 일 */}
      <select
        value={day}
        onChange={(e) => handleChange('day', e.target.value)}
        style={selectStyle}
      >
        <option value="">일</option>
        {days.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
    </div>
  );
}

const selectStyle = {
  flex: 1,
  padding: '10px',
  backgroundColor: '#333',
  border: '1px solid #555',
  borderRadius: 4,
  color: '#fff',
  fontSize: '14px',
  outline: 'none',
  cursor: 'pointer'
};