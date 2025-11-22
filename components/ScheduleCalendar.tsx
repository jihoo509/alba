'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, addMonths, subMonths, isSameMonth, isToday 
} from 'date-fns';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import type { ScheduleTemplate } from './TemplateSection';

type Props = {
  currentStoreId: string | null;
  selectedTemplate: ScheduleTemplate | null;
};

type Schedule = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  color: string;
  // employee_id는 나중에 추가
};

export default function ScheduleCalendar({ currentStoreId, selectedTemplate }: Props) {
  const supabase = createSupabaseBrowserClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  // 1. 월별 스케줄 데이터 불러오기
  const fetchSchedules = useCallback(async () => {
    if (!currentStoreId) return;
    
    const startDate = format(startOfWeek(startOfMonth(currentDate)), 'yyyy-MM-dd');
    const endDate = format(endOfWeek(endOfMonth(currentDate)), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('store_id', currentStoreId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (!error && data) {
      setSchedules(data);
    }
  }, [currentStoreId, currentDate, supabase]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // 2. 날짜 클릭 시 스케줄 생성 (도장 찍기)
  const handleDateClick = async (day: Date) => {
    if (!currentStoreId || !selectedTemplate) return;

    const dateStr = format(day, 'yyyy-MM-dd');

    // DB에 스케줄 추가
    const { error } = await supabase.from('schedules').insert({
      store_id: currentStoreId,
      date: dateStr,
      start_time: selectedTemplate.start_time,
      end_time: selectedTemplate.end_time,
      color: selectedTemplate.color,
      // employee_id는 일단 비워둠 (미배정 상태)
    });

    if (error) {
      alert('스케줄 생성 실패: ' + error.message);
    } else {
      fetchSchedules(); // 화면 갱신
    }
  };

  // 3. 스케줄 삭제 (스케줄 바 클릭 시)
  const handleDeleteSchedule = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if(!confirm("이 스케줄을 삭제하시겠습니까?")) return;

    const { error } = await supabase.from('schedules').delete().eq('id', id);
    if (!error) fetchSchedules();
  };

  // --- 달력 렌더링 준비 ---
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const weeks = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div style={{ backgroundColor: '#1a1a1a', padding: 20, borderRadius: 8, border: '1px solid #333' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} style={btnStyle}>&lt; 이전</button>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} style={btnStyle}>다음 &gt;</button>
          <button onClick={() => setCurrentDate(new Date())} style={{ ...btnStyle, background: '#444' }}>오늘</button>
        </div>
        <h2 style={{ margin: 0, fontSize: 24, color: '#fff' }}>{format(currentDate, 'yyyy년 MM월')}</h2>
        <div style={{ width: 100 }}></div> 
      </div>

      {/* 요일 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 10, textAlign: 'center' }}>
        {weeks.map((day, idx) => (
          <div key={day} style={{ color: idx === 0 ? 'salmon' : idx === 6 ? 'skyblue' : '#aaa', fontWeight: 'bold' }}>{day}</div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderTop: '1px solid #444', borderLeft: '1px solid #444' }}>
        {calendarDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isTodayDate = isToday(day);
          
          // 해당 날짜의 스케줄 필터링
          const daySchedules = schedules.filter(s => s.date === dateStr);

          return (
            <div 
              key={day.toString()} 
              onClick={() => handleDateClick(day)}
              style={{ 
                minHeight: 100, padding: 4, borderRight: '1px solid #444', borderBottom: '1px solid #444',
                backgroundColor: isCurrentMonth ? (isTodayDate ? '#2c3e50' : 'transparent') : '#222',
                cursor: selectedTemplate ? 'pointer' : 'default', // 템플릿 선택 시 커서 변경
                opacity: isCurrentMonth ? 1 : 0.5
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: 4, fontSize: 14, color: isTodayDate ? 'dodgerblue' : '#fff', fontWeight: isTodayDate ? 'bold' : 'normal' }}>
                {format(day, 'd')}
              </div>

              {/* 스케줄 바 표시 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {daySchedules.map(sch => (
                  <div 
                    key={sch.id}
                    onClick={(e) => handleDeleteSchedule(e, sch.id)}
                    style={{
                      backgroundColor: sch.color || '#555',
                      color: '#fff', fontSize: 11, padding: '2px 4px', borderRadius: 3,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      cursor: 'pointer',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.3)'
                    }}
                    title={`${sch.start_time}~${sch.end_time} (클릭 시 삭제)`}
                  >
                    {sch.start_time}~{sch.end_time}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const btnStyle = { padding: '6px 12px', background: '#333', border: '1px solid #555', color: '#fff', borderRadius: 4, cursor: 'pointer' };