'use client';

import React, { useState, useEffect, useRef } from 'react';

type Props = {
  value: string; // "YYYY-MM-DD"
  onChange: (value: string) => void;
};

export default function DateSelector({ value, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  // 현재 선택된 날짜 파싱
  const parseDate = (dateStr: string) => {
    if (!dateStr) {
      const today = new Date();
      return { y: today.getFullYear(), m: today.getMonth() + 1, d: today.getDate() };
    }
    const [y, m, d] = dateStr.split('-').map(Number);
    return { y, m, d };
  };

  const { y: initY, m: initM, d: initD } = parseDate(value);
  const [selectedYear, setSelectedYear] = useState(initY);
  const [selectedMonth, setSelectedMonth] = useState(initM);
  const [selectedDay, setSelectedDay] = useState(initD);

  // 모달이 열릴 때 선택된 날짜로 스크롤 이동 (핵심 로직)
  useEffect(() => {
    if (isOpen) {
      // 0.1초 뒤 실행 (모달 렌더링 후 찾기 위해)
      setTimeout(() => {
        const yearEl = document.getElementById(`picker-year-${selectedYear}`);
        const monthEl = document.getElementById(`picker-month-${selectedMonth}`);
        const dayEl = document.getElementById(`picker-day-${selectedDay}`);

        // 부드럽게 가운데로 스크롤
        yearEl?.scrollIntoView({ behavior: 'auto', block: 'center' });
        monthEl?.scrollIntoView({ behavior: 'auto', block: 'center' });
        dayEl?.scrollIntoView({ behavior: 'auto', block: 'center' });
      }, 50);
    }
  }, [isOpen]);

  // 값 변경 시 업데이트
  useEffect(() => {
    const { y, m, d } = parseDate(value);
    setSelectedYear(y);
    setSelectedMonth(m);
    setSelectedDay(d);
  }, [value]);

  const handleConfirm = () => {
    const yStr = String(selectedYear);
    const mStr = String(selectedMonth).padStart(2, '0');
    const dStr = String(selectedDay).padStart(2, '0');
    onChange(`${yStr}-${mStr}-${dStr}`);
    setIsOpen(false);
  };

  // 날짜 데이터 생성
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i); // 전후 5년
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <>
      {/* 1. 입력창 (클릭 시 모달 열림) */}
      <div 
        onClick={() => setIsOpen(true)}
        style={{
          padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6,
          backgroundColor: '#fff', cursor: 'pointer', fontSize: 14, minWidth: 120, textAlign: 'center',
          color: '#333'
        }}
      >
        {value || '날짜 선택'}
      </div>

      {/* 2. 모달 (중앙 정렬) */}
      {isOpen && (
        <div style={modalOverlayStyle} onClick={() => setIsOpen(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: 16, textAlign: 'center', fontSize: 16, fontWeight: 'bold', color: '#333' }}>
              날짜 선택
            </h3>

            {/* 3단 컬럼 (년/월/일) */}
            <div style={{ display: 'flex', height: 200, borderTop: '1px solid #eee', borderBottom: '1px solid #eee' }}>
              {/* 년 */}
              <div style={columnStyle}>
                {years.map(y => (
                  <div 
                    key={y} 
                    id={`picker-year-${y}`} // ✅ ID 부여 (스크롤 타겟)
                    onClick={() => setSelectedYear(y)}
                    style={itemStyle(y === selectedYear)}
                  >
                    {y}년
                  </div>
                ))}
              </div>
              {/* 월 */}
              <div style={columnStyle}>
                {months.map(m => (
                  <div 
                    key={m} 
                    id={`picker-month-${m}`} // ✅ ID 부여
                    onClick={() => setSelectedMonth(m)}
                    style={itemStyle(m === selectedMonth)}
                  >
                    {m}월
                  </div>
                ))}
              </div>
              {/* 일 */}
              <div style={columnStyle}>
                {days.map(d => (
                  <div 
                    key={d} 
                    id={`picker-day-${d}`} // ✅ ID 부여
                    onClick={() => setSelectedDay(d)}
                    style={itemStyle(d === selectedDay)}
                  >
                    {d}일
                  </div>
                ))}
              </div>
            </div>

            {/* 버튼 그룹 */}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setIsOpen(false)} style={cancelBtnStyle}>취소</button>
              <button onClick={handleConfirm} style={confirmBtnStyle}>선택 완료</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// 스타일
const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
  display: 'flex', justifyContent: 'center', alignItems: 'center' // ✅ 중앙 정렬
};

const modalContentStyle: React.CSSProperties = {
  width: 320, backgroundColor: '#fff', borderRadius: 12, padding: 20,
  boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
};

const columnStyle: React.CSSProperties = {
  flex: 1, overflowY: 'auto', textAlign: 'center', scrollBehavior: 'smooth'
};

const itemStyle = (isSelected: boolean): React.CSSProperties => ({
  padding: '10px 0', cursor: 'pointer',
  fontWeight: isSelected ? 'bold' : 'normal',
  color: isSelected ? 'dodgerblue' : '#333',
  backgroundColor: isSelected ? '#f0f9ff' : 'transparent'
});

const cancelBtnStyle = { flex: 1, padding: 12, borderRadius: 8, border: 'none', background: '#f0f0f0', color: '#333', fontWeight: 'bold', cursor: 'pointer' };
const confirmBtnStyle = { flex: 1, padding: 12, borderRadius: 8, border: 'none', background: 'dodgerblue', color: '#fff', fontWeight: 'bold', cursor: 'pointer' };