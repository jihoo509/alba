'use client';

import React, { useState, useEffect } from 'react';

type Props = {
  value: string;
  onChange: (value: string) => void;
  // ✅ [추가] 스타일 커스텀을 위한 props
  style?: React.CSSProperties; 
  className?: string;
};

// ✅ 함수 인자에서 style과 className을 받아야 합니다!
export default function DateSelector({ value, onChange, style, className }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  // 날짜 파싱 (유틸리티)
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

  // 모달 열릴 때 자동 스크롤
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        document.getElementById(`picker-year-${selectedYear}`)?.scrollIntoView({ behavior: 'auto', block: 'center' });
        document.getElementById(`picker-month-${selectedMonth}`)?.scrollIntoView({ behavior: 'auto', block: 'center' });
        document.getElementById(`picker-day-${selectedDay}`)?.scrollIntoView({ behavior: 'auto', block: 'center' });
      }, 50);
    }
  }, [isOpen]);

  // 부모 값 변경 시 동기화
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

  // ✅ [핵심 기능] 월 클릭 시 1일로 리셋 & 스크롤 이동
  const handleMonthClick = (m: number) => {
    setSelectedMonth(m);
    setSelectedDay(1); // 1일로 강제 변경
    
    // 1일 위치로 스크롤 (살짝 딜레이 줘야 DOM 반영 후 이동됨)
    setTimeout(() => {
      document.getElementById(`picker-day-1`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  // ✅ [수정] 내년(2026) ~ 1950년까지 내림차순(최신순) 생성
  const currentYear = new Date().getFullYear();
  const maxYear = currentYear + 1; 
  const minYear = 1950;
  
  const years = Array.from(
    { length: maxYear - minYear + 1 }, 
    (_, i) => maxYear - i
  );
  
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <>
      <div 
        onClick={() => setIsOpen(true)}
        className={className} // ✅ 받아온 className 적용
        style={{
          // ✅ [스타일 수정]
          // 1. minWidth 제거 (모바일에서 튀어나감 방지)
          // 2. width: 100% (부모 flex 영역 꽉 채우기)
          // 3. 텍스트 중앙 정렬
          padding: '10px 4px', 
          border: '1px solid #ddd', borderRadius: 6,
          backgroundColor: '#fff', cursor: 'pointer', fontSize: 13, 
          textAlign: 'center', color: '#333',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '100%', 
          ...style // ✅ 외부에서 들어온 style 덮어쓰기
        }}
      >
        {value || '날짜 선택'}
      </div>

      {isOpen && (
        <div style={modalOverlayStyle} onClick={() => setIsOpen(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: 16, textAlign: 'center', fontSize: 16, fontWeight: 'bold', color: '#333' }}>
              날짜 선택
            </h3>

            <div style={{ display: 'flex', height: 200, borderTop: '1px solid #eee', borderBottom: '1px solid #eee' }}>
              {/* 년 */}
              <div style={columnStyle}>
                {years.map(y => (
                  <div 
                    key={y} 
                    id={`picker-year-${y}`} 
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
                    id={`picker-month-${m}`} 
                    onClick={() => handleMonthClick(m)} 
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
                    id={`picker-day-${d}`} 
                    onClick={() => setSelectedDay(d)}
                    style={itemStyle(d === selectedDay)}
                  >
                    {d}일
                  </div>
                ))}
              </div>
            </div>

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
  display: 'flex', justifyContent: 'center', alignItems: 'center'
};

const modalContentStyle: React.CSSProperties = {
  width: 320, backgroundColor: '#fff', borderRadius: 12, padding: 20,
  boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
};

const columnStyle: React.CSSProperties = {
  flex: 1, overflowY: 'auto', textAlign: 'center', scrollBehavior: 'smooth',
  msOverflowStyle: 'none',  // IE, Edge 스크롤바 숨김
  scrollbarWidth: 'none'    // Firefox 스크롤바 숨김
};

const itemStyle = (isSelected: boolean): React.CSSProperties => ({
  padding: '10px 0', cursor: 'pointer',
  fontWeight: isSelected ? 'bold' : 'normal',
  color: isSelected ? 'dodgerblue' : '#333',
  backgroundColor: isSelected ? '#f0f9ff' : 'transparent'
});

const cancelBtnStyle = { flex: 1, padding: 12, borderRadius: 8, border: 'none', background: '#f0f0f0', color: '#333', fontWeight: 'bold', cursor: 'pointer' };
const confirmBtnStyle = { flex: 1, padding: 12, borderRadius: 8, border: 'none', background: 'dodgerblue', color: '#fff', fontWeight: 'bold', cursor: 'pointer' };