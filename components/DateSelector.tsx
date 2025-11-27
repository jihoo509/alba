'use client';

import React, { useEffect, useState, useMemo } from 'react';

type Props = {
  value: string | null | undefined; // "YYYY-MM-DD"
  onChange: (value: string) => void;
};

export default function DateSelector({ value, onChange }: Props) {
  // 오늘 날짜 기준으로 기본값 세팅
  const today = new Date();
  const [year, setYear] = useState(String(today.getFullYear()));
  const [month, setMonth] = useState(String(today.getMonth() + 1).padStart(2, '0'));
  const [day, setDay] = useState(String(today.getDate()).padStart(2, '0'));

  // 부모로부터 값이 들어오면 상태 업데이트
  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split('-');
      setYear(y);
      setMonth(m);
      setDay(d);
    }
  }, [value]);

  // ✅ [핵심] 연도와 월에 따라 '일' 개수 자동 계산
  const daysInMonth = useMemo(() => {
    if (!year || !month) return 31; // 기본값
    // new Date(year, month, 0).getDate() : 해당 월의 마지막 날짜 반환
    return new Date(Number(year), Number(month), 0).getDate();
  }, [year, month]);

  // 일 목록 생성 (동적)
  const days = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, '0'));
  }, [daysInMonth]);

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

    // 월이 바뀌었을 때, 현재 선택된 '일'이 그 달의 마지막 날보다 크면 자동으로 줄여줌
    // 예: 1월 31일 선택 상태에서 2월로 바꾸면 -> 2월 28일로 자동 변경
    const maxDay = new Date(Number(newY), Number(newM), 0).getDate();
    if (Number(newD) > maxDay) {
        newD = String(maxDay).padStart(2, '0');
        setDay(newD);
    }

    // 값이 다 있으면 부모에게 전달
    if (newY && newM && newD) {
      onChange(`${newY}-${newM}-${newD}`);
    }
  };

  // 연도 목록 (올해 ~ 1950, 최신순)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1950 + 1 }, (_, i) => String(currentYear - i));
  
  // 월 목록
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {/* 연도 */}
      <select
        value={year}
        onChange={(e) => handleChange('year', e.target.value)}
        style={selectStyle}
      >
        {years.map((y) => (
          <option key={y} value={y}>{y}년</option>
        ))}
      </select>

      {/* 월 */}
      <select
        value={month}
        onChange={(e) => handleChange('month', e.target.value)}
        style={selectStyle}
      >
        {months.map((m) => (
          <option key={m} value={m}>{m}월</option>
        ))}
      </select>

      {/* 일 (동적으로 변함) */}
      <select
        value={day}
        onChange={(e) => handleChange('day', e.target.value)}
        style={selectStyle}
      >
        {days.map((d) => (
          <option key={d} value={d}>{d}일</option>
        ))}
      </select>
    </div>
  );
}

const selectStyle = {
  flex: 1,
  padding: '8px',
  backgroundColor: '#494949ff',
  border: '1px solid #555',
  borderRadius: 4,
  color: '#fff',
  fontSize: '14px',
  outline: 'none',
  cursor: 'pointer',
  minWidth: '70px' // 너비 살짝 확보
};