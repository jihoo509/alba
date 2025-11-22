'use client';

import React, { useState, useEffect } from 'react';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, addMonths, subMonths, isSameMonth, isToday 
} from 'date-fns';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';

type Props = {
  currentStoreId: string | null;
};

export default function ScheduleCalendar({ currentStoreId }: Props) {
  const supabase = createSupabaseBrowserClient();
  
  // 현재 보고 있는 달력의 기준 날짜 (기본값: 오늘)
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState<any[]>([]);

  // 날짜 이동 함수
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToday = () => setCurrentDate(new Date());

  // 달력 생성 로직
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart); // 달력의 첫 칸 (보통 전달의 날짜)
  const endDate = endOfWeek(monthEnd);       // 달력의 마지막 칸 (보통 다음달 날짜)

  // 달력에 표시될 모든 날짜 배열
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  // 요일 헤더 (일 월 화 수 목 금 토)
  const weeks = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div style={{ backgroundColor: '#1a1a1a', padding: 20, borderRadius: 8, border: '1px solid #333' }}>
      {/* 1. 달력 헤더 (이전달 / 현재월 / 다음달) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={prevMonth} style={btnStyle}>&lt; 이전</button>
          <button onClick={nextMonth} style={btnStyle}>다음 &gt;</button>
          <button onClick={goToday} style={{ ...btnStyle, background: '#444' }}>오늘</button>
        </div>
        <h2 style={{ margin: 0, fontSize: 24 }}>
          {format(currentDate, 'yyyy년 MM월')}
        </h2>
        <div>
            {/* 추후 여기에 '자동 생성' 버튼 등 추가 예정 */}
        </div>
      </div>

      {/* 2. 요일 표시 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 10, textAlign: 'center' }}>
        {weeks.map((day, idx) => (
          <div key={day} style={{ color: idx === 0 ? 'salmon' : idx === 6 ? 'skyblue' : '#aaa', fontWeight: 'bold' }}>
            {day}
          </div>
        ))}
      </div>

      {/* 3. 날짜 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderTop: '1px solid #444', borderLeft: '1px solid #444' }}>
        {calendarDays.map((day) => {
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isTodayDate = isToday(day);

          return (
            <div 
              key={day.toString()} 
              style={{ 
                minHeight: 100, 
                padding: 8, 
                borderRight: '1px solid #444', 
                borderBottom: '1px solid #444',
                backgroundColor: isCurrentMonth ? 'transparent' : '#222', // 이번달 아니면 어둡게
                color: !isCurrentMonth ? '#555' : isTodayDate ? 'dodgerblue' : '#fff',
                position: 'relative'
              }}
            >
              {/* 날짜 숫자 */}
              <div style={{ fontWeight: isTodayDate ? 'bold' : 'normal', marginBottom: 4 }}>
                {format(day, 'd')}
              </div>

              {/* 이곳에 스케줄 데이터가 들어갈 예정 */}
              <div style={{ fontSize: 12, color: '#888' }}>
                {/* (스케줄 표시 영역) */}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const btnStyle = {
  padding: '6px 12px',
  background: '#333',
  border: '1px solid #555',
  color: '#fff',
  borderRadius: 4,
  cursor: 'pointer',
};