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

// ✅ [추가] 직원 이름으로 고유 색상을 만드는 함수 (해시값 기반)
// 매번 똑같은 사람에게는 똑같은 색이 나옵니다.
const getEmployeeColor = (name: string | undefined) => {
  if (!name) return '#555'; // 미배정은 회색
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#9B59B6', 
    '#3498DB', '#F1C40F', '#E67E22', '#2ECC71', '#E74C3C',
    '#8E44AD', '#1ABC9C'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function ScheduleCalendar({ currentStoreId, selectedTemplate, employees }: Props) {
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

  const handleAssignEmployee = async (scheduleId: string, employeeId: string | null) => {
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

  const handleDateClick = async (day: Date) => {
    if (!currentStoreId || !selectedTemplate) return;
    // (스케줄 생성 로직 - 기존과 동일)
    const dateStr = format(day, 'yyyy-MM-dd');
    const { error } = await supabase.from('schedules').insert({
      store_id: currentStoreId,
      date: dateStr,
      start_time: selectedTemplate.start_time,
      end_time: selectedTemplate.end_time,
      color: selectedTemplate.color,
      employee_id: null 
    });
    if (error) alert('생성 실패: ' + error.message);
    else fetchSchedules();
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
          <div key={day} style={{ color: idx === 0 ? 'salmon' : idx === 6 ? 'skyblue' : '#aaa', fontWeight: 'bold', fontSize: 16 }}>{day}</div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderTop: '1px solid #444', borderLeft: '1px solid #444' }}>
        {calendarDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isTodayDate = isToday(day);
          
          // 시간순 정렬
          const daySchedules = schedules
            .filter(s => s.date === dateStr)
            .sort((a, b) => a.start_time.localeCompare(b.start_time));

          return (
            <div 
              key={day.toString()} 
              onClick={() => handleDateClick(day)} // 템플릿 있으면 클릭 시 생성
              style={{ 
                minHeight: 130, // ✅ 높이 더 키움
                padding: '4px 4px 12px 4px', 
                borderRight: '1px solid #444', 
                borderBottom: '1px solid #444',
                backgroundColor: isCurrentMonth ? (isTodayDate ? '#222f3e' : 'transparent') : '#111',
                opacity: isCurrentMonth ? 1 : 0.4,
                cursor: selectedTemplate ? 'cell' : 'default', // 템플릿 선택 시 커서 변경
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* 날짜 숫자 */}
              <div style={{ 
                textAlign: 'center', marginBottom: 6, fontSize: 14, 
                color: isTodayDate ? 'dodgerblue' : '#fff', 
                fontWeight: isTodayDate ? 'bold' : 'normal',
                paddingTop: 4
              }}>
                {format(day, 'd')}
              </div>

              {/* 스케줄 바 영역 (꽉 차게) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                {daySchedules.map(sch => {
                  const start = sch.start_time.slice(0, 5);
                  const end = sch.end_time.slice(0, 5);
                  const isNextDay = sch.start_time > sch.end_time;
                  const empName = sch.employees?.name;
                  
                  // ✅ 직원별 색상 적용
                  const bgColor = empName ? getEmployeeColor(empName) : '#444'; 

                  return (
                    <div 
                      key={sch.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setTargetSchedule(sch);
                      }}
                      style={{
                        backgroundColor: bgColor,
                        color: '#fff', 
                        fontSize: 12, 
                        padding: '6px', // 패딩 늘림
                        borderRadius: 6,
                        cursor: 'pointer', 
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        border: sch.employee_id ? 'none' : '2px dashed #777', // 미배정은 점선 테두리
                        textAlign: 'center', // ✅ 가운데 정렬
                        opacity: empName ? 1 : 0.7,
                        display: 'flex', flexDirection: 'column', justifyContent: 'center'
                      }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: 13, marginBottom: 2 }}>
                        {empName || '❓ 미배정'}
                      </div>
                      <div style={{ fontSize: 11, opacity: 0.9 }}>
                        {start} ~ {end} {isNextDay && <span style={{ color: '#ffcccc', fontWeight: 'bold' }}>+1</span>}
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
          backgroundColor: '#2c3e50', padding: 24, borderRadius: 12, boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
          zIndex: 100, border: '1px solid #555', minWidth: 320
        }}>
          <h3 style={{ marginTop: 0, marginBottom: 16, color: '#fff', textAlign: 'center' }}>직원 배정 / 변경</h3>
          <div style={{ textAlign: 'center', color: '#ddd', marginBottom: 20, fontSize: 15, backgroundColor: '#111', padding: 10, borderRadius: 6 }}>
            📅 {targetSchedule.date} <br/> 
            ⏰ {targetSchedule.start_time.slice(0,5)} ~ {targetSchedule.end_time.slice(0,5)}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
            <button
               onClick={() => handleAssignEmployee(targetSchedule.id, null)}
               style={{ padding: '10px', background: '#444', color: '#ccc', border: '1px solid #666', borderRadius: 6, cursor: 'pointer' }}
            >
              (미배정으로)
            </button>
            {employees.map(emp => (
              <button
                key={emp.id}
                onClick={() => handleAssignEmployee(targetSchedule.id, emp.id)}
                style={{
                  padding: '10px', 
                  background: targetSchedule.employee_id === emp.id ? 'dodgerblue' : '#333',
                  color: '#fff', border: '1px solid #555', borderRadius: 6, cursor: 'pointer',
                  fontWeight: targetSchedule.employee_id === emp.id ? 'bold' : 'normal',
                  boxShadow: targetSchedule.employee_id === emp.id ? '0 0 10px dodgerblue' : 'none'
                }}
              >
                {emp.name}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => handleDeleteSchedule(targetSchedule.id)} style={{ background: '#c0392b', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>
              🗑️ 스케줄 삭제
            </button>
            <button onClick={() => setTargetSchedule(null)} style={{ background: '#555', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 6, cursor: 'pointer' }}>
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const btnStyle = { padding: '8px 16px', background: '#333', border: '1px solid #555', color: '#fff', borderRadius: 6, cursor: 'pointer', fontSize: 14 };