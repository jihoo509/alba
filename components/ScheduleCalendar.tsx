'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, addMonths, subMonths, isSameMonth, isToday 
} from 'date-fns';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import type { ScheduleTemplate, SimpleEmployee } from './TemplateSection';

type Props = {
  currentStoreId: string | null;
  selectedTemplate: ScheduleTemplate | null;
  employees: SimpleEmployee[];
};

type Schedule = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  color: string;
  employee_id: string | null;
  employees?: { name: string };
};

export default function ScheduleCalendar({ currentStoreId, employees }: Props) {
  const supabase = createSupabaseBrowserClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [targetSchedule, setTargetSchedule] = useState<Schedule | null>(null);

  const fetchSchedules = useCallback(async () => {
    if (!currentStoreId) return;
    
    const startDate = format(startOfWeek(startOfMonth(currentDate)), 'yyyy-MM-dd');
    const endDate = format(endOfWeek(endOfMonth(currentDate)), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('schedules')
      .select('*, employees ( name )')
      .eq('store_id', currentStoreId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (!error && data) {
      // @ts-ignore
      setSchedules(data);
    }
  }, [currentStoreId, currentDate, supabase]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleAssignEmployee = async (scheduleId: string, employeeId: string) => {
    const { error } = await supabase
      .from('schedules')
      .update({ employee_id: employeeId })
      .eq('id', scheduleId);

    if (error) alert('배정 실패');
    else {
      fetchSchedules();
      setTargetSchedule(null);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if(!confirm("정말 삭제하시겠습니까?")) return;
    const { error } = await supabase.from('schedules').delete().eq('id', id);
    if (!error) {
      fetchSchedules();
      setTargetSchedule(null);
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const weeks = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div style={{ backgroundColor: '#1a1a1a', padding: 20, borderRadius: 8, border: '1px solid #333', position: 'relative' }}>
      
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
          
          // ✅ [수정] 해당 날짜 스케줄 필터링 + 시간순 정렬 (오전 -> 오후)
          const daySchedules = schedules
            .filter(s => s.date === dateStr)
            .sort((a, b) => a.start_time.localeCompare(b.start_time));

          return (
            <div 
              key={day.toString()} 
              style={{ 
                // ✅ [수정] 높이 고정 (내용이 없어도 120px 유지 -> 깔끔함)
                minHeight: 120, 
                padding: 6, 
                borderRight: '1px solid #444', 
                borderBottom: '1px solid #444',
                backgroundColor: isCurrentMonth ? (isTodayDate ? '#2c3e50' : 'transparent') : '#222',
                opacity: isCurrentMonth ? 1 : 0.5
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: 6, fontSize: 14, color: isTodayDate ? 'dodgerblue' : '#fff', fontWeight: isTodayDate ? 'bold' : 'normal' }}>
                {format(day, 'd')}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {daySchedules.map(sch => {
                  const start = sch.start_time.slice(0, 5);
                  const end = sch.end_time.slice(0, 5);
                  
                  return (
                    <div 
                      key={sch.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setTargetSchedule(sch);
                      }}
                      style={{
                        backgroundColor: sch.color || '#555',
                        color: '#fff', fontSize: 11, padding: '4px 6px', borderRadius: 4,
                        cursor: 'pointer', 
                        boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                        border: sch.employee_id ? '1px solid rgba(255,255,255,0.3)' : '1px dashed rgba(255,255,255,0.5)',
                      }}
                    >
                      {/* ✅ [수정] (+1) 제거, 시간 심플하게 표시 */}
                      <div style={{ fontSize: 10, opacity: 0.9, marginBottom: 1 }}>
                        {start}~{end}
                      </div>
                      <div style={{ fontWeight: 'bold', fontSize: 12 }}>
                        {sch.employees?.name || <span style={{ color: '#ddd', fontWeight: 'normal' }}>미배정</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 배정 팝업 */}
      {targetSchedule && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          backgroundColor: '#333', padding: 20, borderRadius: 8, boxShadow: '0 10px 25px rgba(0,0,0,0.8)',
          zIndex: 100, border: '1px solid #555', minWidth: 300
        }}>
          <h3 style={{ marginTop: 0, marginBottom: 16, color: '#fff' }}>직원 배정</h3>
          <p style={{ color: '#ccc', fontSize: 14, marginBottom: 12 }}>
            {targetSchedule.date} <br/> 
            {targetSchedule.start_time} ~ {targetSchedule.end_time}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            <button
               onClick={() => handleAssignEmployee(targetSchedule.id, null as any)}
               style={{ padding: '8px', background: '#555', color: '#fff', border: '1px solid #777', borderRadius: 4, cursor: 'pointer' }}
            >
              (미배정)
            </button>
            {employees.map(emp => (
              <button
                key={emp.id}
                onClick={() => handleAssignEmployee(targetSchedule.id, emp.id)}
                style={{
                  padding: '8px', 
                  background: targetSchedule.employee_id === emp.id ? 'dodgerblue' : '#444',
                  color: '#fff', border: '1px solid #555', borderRadius: 4, cursor: 'pointer'
                }}
              >
                {emp.name}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
            <button onClick={() => handleDeleteSchedule(targetSchedule.id)} style={{ background: 'darkred', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 4, cursor: 'pointer' }}>스케줄 삭제</button>
            <button onClick={() => setTargetSchedule(null)} style={{ background: '#555', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 4, cursor: 'pointer' }}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}

const btnStyle = { padding: '6px 12px', background: '#333', border: '1px solid #555', color: '#fff', borderRadius: 4, cursor: 'pointer' };