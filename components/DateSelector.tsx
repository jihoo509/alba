'use client';

import React, { useState, useEffect, useRef } from 'react';

type Props = {
  value: string;
  onChange: (val: string) => void;
};

export default function DateSelector({ value, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  // 내부에서 임시로 선택 중인 날짜 (완료 누르기 전까지 저장용)
  const [tempYear, setTempYear] = useState(new Date().getFullYear());
  const [tempMonth, setTempMonth] = useState(new Date().getMonth() + 1);
  const [tempDay, setTempDay] = useState(new Date().getDate());

  // 스크롤 위치 조정을 위한 Refs
  const yearRef = useRef<HTMLDivElement>(null);
  const monthRef = useRef<HTMLDivElement>(null);
  const dayRef = useRef<HTMLDivElement>(null);

  // 1. 초기값 세팅 및 모달 열릴 때 값 동기화
  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split('-').map(Number);
      setTempYear(y);
      setTempMonth(m);
      setTempDay(d);
    }
  }, [value, isOpen]);

  // 2. 날짜 목록 생성
  const currentYear = new Date().getFullYear();
  // 작년 ~ 내후년까지 (필요하면 범위 조절하세요)
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 1 + i); 
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  
  // 해당 연/월의 마지막 날짜 계산
  const daysInMonth = new Date(tempYear, tempMonth, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // 월/년 변경 시 일이 범위를 넘어가면 조정 (예: 31일 -> 2월 선택 시 28일로)
  useEffect(() => {
    if (tempDay > daysInMonth) {
      setTempDay(daysInMonth);
    }
  }, [tempYear, tempMonth, daysInMonth, tempDay]);

  const handleConfirm = () => {
    const str = `${tempYear}-${String(tempMonth).padStart(2,'0')}-${String(tempDay).padStart(2,'0')}`;
    onChange(str);
    setIsOpen(false);
  };

  return (
    <>
      {/* 🟢 1. 날짜 표시 버튼 */}
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          padding: '8px 12px',
          border: '1px solid #ccc',
          borderRadius: 6,
          backgroundColor: '#fff',
          cursor: 'pointer',
          fontSize: '14px',
          minWidth: '120px',
          textAlign: 'center',
          color: '#333'
        }}
      >
        {value ? `${value.split('-')[0]}년 ${value.split('-')[1]}월 ${value.split('-')[2]}일` : '날짜 선택'}
      </button>

      {/* 🔵 2. 모달창 */}
      {isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999,
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div style={{ 
            backgroundColor: '#fff', 
            borderRadius: 12, 
            width: '90%', 
            maxWidth: 340, 
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            
            {/* 헤더 */}
            <div style={{ padding: '16px', background: '#f8f9fa', borderBottom: '1px solid #eee', textAlign: 'center', fontWeight: 'bold', color: '#333' }}>
              날짜 선택
            </div>

            {/* 선택 영역 (3단 컬럼) */}
            <div style={{ padding: '10px', display: 'flex', height: '220px', backgroundColor: '#fff' }}>
              
              {/* 년 */}
              <div ref={yearRef} style={scrollBoxStyle}>
                {years.map(y => (
                  <div key={y} 
                    onClick={() => setTempYear(y)}
                    style={getItemStyle(y === tempYear)}>
                    {y}년
                  </div>
                ))}
              </div>

              {/* 월 */}
              <div ref={monthRef} style={{ ...scrollBoxStyle, borderLeft: '1px solid #f0f0f0', borderRight: '1px solid #f0f0f0' }}>
                {months.map(m => (
                  <div key={m} 
                    onClick={() => setTempMonth(m)}
                    style={getItemStyle(m === tempMonth)}>
                    {m}월
                  </div>
                ))}
              </div>

              {/* 일 */}
              <div ref={dayRef} style={scrollBoxStyle}>
                {days.map(d => (
                  <div key={d} 
                    onClick={() => setTempDay(d)}
                    style={getItemStyle(d === tempDay)}>
                    {d}일
                  </div>
                ))}
              </div>
            </div>

            {/* 하단 버튼 (취소 / 완료) */}
            <div style={{ display: 'flex', padding: '12px', gap: 10, borderTop: '1px solid #eee', backgroundColor: '#f8f9fa' }}>
              <button 
                onClick={() => setIsOpen(false)}
                style={{ flex: 1, padding: '12px', background: '#e0e0e0', color: '#333', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}
              >
                취소
              </button>
              <button 
                onClick={handleConfirm}
                style={{ flex: 1, padding: '12px', background: 'dodgerblue', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}
              >
                선택 완료
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

// 스타일 헬퍼
const scrollBoxStyle: React.CSSProperties = {
  flex: 1, 
  overflowY: 'auto', 
  textAlign: 'center',
  scrollbarWidth: 'none', // 파이어폭스 스크롤 숨김
  msOverflowStyle: 'none',  // IE 스크롤 숨김
};

const getItemStyle = (isSelected: boolean): React.CSSProperties => ({
  padding: '10px 0',
  cursor: 'pointer',
  fontWeight: isSelected ? 'bold' : 'normal',
  color: isSelected ? 'dodgerblue' : '#888',
  backgroundColor: isSelected ? '#f0f8ff' : 'transparent',
  borderRadius: 6,
  margin: '2px 4px'
});