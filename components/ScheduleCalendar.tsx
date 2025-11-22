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
  employees: SimpleEmployee[]; // 직원 목록
};

type Schedule = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  color: string;
  employee_id: string | null; // 배정된 직원 ID
  employees?: { name: string }; // 조인된 직원 정보 (이름 등)
};

export default function ScheduleCalendar({ currentStoreId, selectedTemplate, employees }: Props) {
  const supabase = createSupabaseBrowserClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  // 선택된 스케줄 관리 (직원 배정 팝업용)
  const [targetSchedule, setTargetSchedule] = useState<Schedule | null>(null);

  // 1. 스케줄 불러오기 (직원 이름 포함)
  const fetchSchedules = useCallback(async () => {
    if (!currentStoreId) return;
    
    const startDate = format(startOfWeek(startOfMonth(currentDate)), 'yyyy-MM-dd');
    const endDate = format(endOfWeek(endOfMonth(currentDate)), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('schedules')
      .select('*, employees ( name )') // join으로 이름 가져오기
      .eq('store_id', currentStoreId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (!error && data) {
      // @ts-ignore (Supabase 타입 추론 회피)
      setSchedules(data);
    }
  }, [currentStoreId, currentDate, supabase]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // 2. 날짜 클릭 -> 스케줄 생성 (템플릿 적용)
  const handleDateClick = async (day: Date) => {
    if (!currentStoreId || !selectedTemplate) return;

    const dateStr = format(day, 'yyyy-MM-dd');

    const { error } = await supabase.from('schedules').insert({
      store_id: currentStoreId,
      date: dateStr,
      start_time: selectedTemplate.start_time,
      end_time: selectedTemplate.end_time,
      color: selectedTemplate.color,
      employee_id: null // 처음엔 미배정
    });

    if (error) alert('생성 실패: ' + error.message);
    else fetchSchedules();
  };

  // 3. 직원 배정 업데이트
  const handleAssignEmployee = async (scheduleId: string, employeeId: string) => {
    const { error } = await supabase
      .from('schedules')
      .update({ employee_id: employeeId })
      .eq('id', scheduleId);

    if (error) alert('배정 실패');
    else {
      fetchSchedules();
      setTargetSchedule(null); // 팝업 닫기
    }
  };

  // 4. 스케줄 삭제
  const handleDeleteSchedule = async (id: string) => {
    if(!confirm("정말 삭제하시겠습니까?")) return;
    const { error } = await supabase.from('schedules').delete().eq('id', id);
    if (!error) {
      fetchSchedules();
      setTargetSchedule(null);
    }
  };

  // 캘린더 날짜 계산
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
          const daySchedules = schedules.filter(s => s.date === dateStr);

          return (
            <div 
              key={day.toString()} 
              onClick={() => handleDateClick(day)}
              style={{ 
                minHeight: 100, padding: 4, borderRight: '1px solid #444', borderBottom: '1px solid #444',
                backgroundColor: isCurrentMonth ? (isTodayDate ? '#2c3e50' : 'transparent') : '#222',
                cursor: selectedTemplate ? 'pointer' : 'default',
                opacity: isCurrentMonth ? 1 : 0.5
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: 4, fontSize: 14, color: isTodayDate ? 'dodgerblue' : '#fff', fontWeight: isTodayDate ? 'bold' : 'normal' }}>
                {format(day, 'd')}
              </div>

              {/* 스케줄 리스트 (여기가 중요!) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {daySchedules.map(sch => {
                  // 시간만 자르기 (09:00:00 -> 09:00)
                  const start = sch.start_time.slice(0, 5);
                  const end = sch.end_time.slice(0, 5);
                  // 익일 퇴근 체크 (단순 문자열 비교)
                  const isNextDay = sch.start_time > sch.end_time;

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
                        marginBottom: 2, cursor: 'pointer', 
                        boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                        border: sch.employee_id ? '1px solid rgba(255,255,255,0.3)' : '1px dashed rgba(255,255,255,0.5)',
                        lineHeight: 1.3
                      }}
                      title={`${start}~${end}${isNextDay ? '(익일)' : ''} - ${sch.employees?.name || '미배정'}`}
                    >
                      {/* 1줄: 시간 */}
                      <div style={{ fontSize: 10, opacity: 0.9 }}>
                        {start}~{end}
                        {isNextDay && <span style={{ color: '#ff6b6b', fontWeight: 'bold', marginLeft: 2 }}>(+1)</span>}
                      </div>
                      
                      {/* 2줄: 이름 */}
                      <div style={{ fontWeight: 'bold', fontSize: 12, marginTop: 1 }}>
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

      {/* ✅ 직원 배정 팝업 */}
      {targetSchedule && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          backgroundColor: '#333', padding: 20, borderRadius: 8, boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          zIndex: 100, border: '1px solid #555', minWidth: 300
        }}>
          <h3 style={{ marginTop: 0, marginBottom: 16, color: '#fff' }}>직원 배정</h3>
          <p style={{ color: '#ccc', fontSize: 14, marginBottom: 12 }}>
            {targetSchedule.date} <br/> 
            {targetSchedule.start_time} ~ {targetSchedule.end_time}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {/* 배정 취소(미배정으로 돌리기) 버튼 추가 */}
            <button
               onClick={() => handleAssignEmployee(targetSchedule.id, null as any)} // null을 보내서 배정 해제
               style={{
                 padding: '8px', background: '#555', color: '#fff', border: '1px solid #777', borderRadius: 4, cursor: 'pointer'
               }}
            >
              (미배정으로)
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
            <button onClick={() => handleDeleteSchedule(targetSchedule.id)} style={{ background: 'darkred', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 4, cursor: 'pointer' }}>
              스케줄 삭제
            </button>
            <button onClick={() => setTargetSchedule(null)} style={{ background: '#555', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 4, cursor: 'pointer' }}>
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const btnStyle = { padding: '6px 12px', background: '#333', border: '1px solid #555', color: '#fff', borderRadius: 4, cursor: 'pointer' };