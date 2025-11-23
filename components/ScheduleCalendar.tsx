'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, addMonths, subMonths, isSameMonth, isToday 
} from 'date-fns';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import type { ScheduleTemplate, SimpleEmployee } from './TemplateSection';
import TimeSelector from './TimeSelector'; // 시간 선택기 재사용

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
  exclude_holiday_pay?: boolean; // 주휴 제외 여부
};

// 직원별 색상 매핑
const getEmployeeColor = (empId: string | null, employees: SimpleEmployee[]) => {
  if (!empId) return '#444';
  const index = employees.findIndex(e => e.id === empId);
  const PALETTE = [
    '#E74C3C', '#3498DB', '#F1C40F', '#2ECC71', '#9B59B6', 
    '#E67E22', '#1ABC9C', '#34495E', '#D35400', '#7F8C8D'
  ];
  if (index === -1) return '#666';
  return PALETTE[index % PALETTE.length];
};

export default function ScheduleCalendar({ currentStoreId, selectedTemplate, employees }: Props) {
  const supabase = createSupabaseBrowserClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  
  // 팝업용 상태
  const [targetSchedule, setTargetSchedule] = useState<Schedule | null>(null);
  // 수정용 임시 상태 (시간, 직원, 옵션)
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editEmpId, setEditEmpId] = useState<string | null>(null);
  const [editExcludePay, setEditExcludePay] = useState(false);

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

  // 스케줄 클릭 시 팝업 열기 & 데이터 세팅
  const openEditPopup = (sch: Schedule) => {
    setTargetSchedule(sch);
    setEditStartTime(sch.start_time.slice(0, 5));
    setEditEndTime(sch.end_time.slice(0, 5));
    setEditEmpId(sch.employee_id);
    setEditExcludePay(sch.exclude_holiday_pay || false);
  };

  // 수정 사항 저장 (시간, 대타, 옵션 한방에)
  const handleUpdateSchedule = async () => {
    if (!targetSchedule) return;

    const { error } = await supabase
      .from('schedules')
      .update({
        start_time: editStartTime,
        end_time: editEndTime,
        employee_id: editEmpId,
        exclude_holiday_pay: editExcludePay
      })
      .eq('id', targetSchedule.id);

    if (error) alert('수정 실패: ' + error.message);
    else {
      fetchSchedules();
      setTargetSchedule(null);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!targetSchedule || !confirm("정말 삭제하시겠습니까?")) return;
    const { error } = await supabase.from('schedules').delete().eq('id', targetSchedule.id);
    if (!error) {
      fetchSchedules();
      setTargetSchedule(null);
    }
  };

  const handleDateClick = async (day: Date) => {
    if (!currentStoreId || !selectedTemplate) return;
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
          const daySchedules = schedules
            .filter(s => s.date === dateStr)
            .sort((a, b) => a.start_time.localeCompare(b.start_time));

          return (
            <div 
              key={day.toString()} 
              onClick={() => handleDateClick(day)}
              style={{ 
                minHeight: 130, padding: '4px 2px 12px 2px', borderRight: '1px solid #444', borderBottom: '1px solid #444',
                backgroundColor: isCurrentMonth ? (isTodayDate ? '#222f3e' : 'transparent') : '#111',
                opacity: isCurrentMonth ? 1 : 0.4, cursor: selectedTemplate ? 'cell' : 'default',
                display: 'flex', flexDirection: 'column',
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: 6, fontSize: 14, color: isTodayDate ? 'dodgerblue' : '#fff', fontWeight: isTodayDate ? 'bold' : 'normal', paddingTop: 4 }}>
                {format(day, 'd')}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                {daySchedules.map(sch => {
                  const start = sch.start_time.slice(0, 5);
                  const end = sch.end_time.slice(0, 5);
                  const empName = sch.employees?.name;
                  const bgColor = getEmployeeColor(sch.employee_id, employees); 

                  return (
                    <div 
                      key={sch.id}
                      onClick={(e) => { e.stopPropagation(); openEditPopup(sch); }}
                      style={{
                        backgroundColor: bgColor, color: '#fff', fontSize: 12, padding: '6px', borderRadius: 6,
                        cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        border: sch.employee_id ? 'none' : '2px dashed #777',
                        textAlign: 'center', opacity: empName ? 1 : 0.7,
                        display: 'flex', flexDirection: 'column', justifyContent: 'center'
                      }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: 13, marginBottom: 2 }}>
                        {empName || '❓ 미배정'}
                        {sch.exclude_holiday_pay && <span style={{fontSize: 10, marginLeft: 4}}>🚫</span>}
                      </div>
                      <div style={{ fontSize: 11, opacity: 0.9 }}>{start} ~ {end}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ✅ [개선된] 스케줄 수정/배정 팝업 */}
      {targetSchedule && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#222', padding: 24, borderRadius: 12, border: '1px solid #444', width: 360,
            boxShadow: '0 10px 25px rgba(0,0,0,0.8)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: 20, color: '#fff', textAlign: 'center' }}>
              스케줄 수정 ({targetSchedule.date})
            </h3>

            {/* 1. 시간 수정 */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#aaa', marginBottom: 8 }}>근무 시간</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TimeSelector value={editStartTime} onChange={setEditStartTime} />
                <span>~</span>
                <TimeSelector value={editEndTime} onChange={setEditEndTime} />
              </div>
            </div>

            {/* 2. 대타(직원) 선택 */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#aaa', marginBottom: 8 }}>근무자 (대타)</label>
              <select 
                value={editEmpId || ''} 
                onChange={(e) => setEditEmpId(e.target.value || null)}
                style={{ width: '100%', padding: 10, backgroundColor: '#333', color: '#fff', border: '1px solid #555', borderRadius: 6 }}
              >
                <option value="">(미배정)</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>

            {/* 3. 옵션 (주휴 제외) */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#fff', fontSize: 14 }}>
                <input 
                  type="checkbox" 
                  checked={editExcludePay} 
                  onChange={(e) => setEditExcludePay(e.target.checked)}
                  style={{ width: 18, height: 18 }}
                />
                이 근무는 주휴수당 계산에서 제외 (대타 등)
              </label>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={handleDeleteSchedule} style={{ padding: '10px 16px', background: '#c0392b', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>삭제</button>
              <button onClick={() => setTargetSchedule(null)} style={{ padding: '10px 16px', background: '#555', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>취소</button>
              <button onClick={handleUpdateSchedule} style={{ padding: '10px 20px', background: 'dodgerblue', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer' }}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const btnStyle = { padding: '6px 12px', background: '#333', border: '1px solid #555', color: '#fff', borderRadius: 6, cursor: 'pointer', fontSize: 14 };