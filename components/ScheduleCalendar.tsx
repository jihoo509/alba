'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, addMonths, subMonths, isSameMonth, isToday 
} from 'date-fns';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import type { ScheduleTemplate, SimpleEmployee } from './TemplateSection';
import TimeSelector from './TimeSelector';

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
  exclude_holiday_pay?: boolean;
};

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
  
  // 팝업용 상태 (수정 및 신규 추가 공용)
  const [popupOpen, setPopupOpen] = useState(false);
  const [targetScheduleId, setTargetScheduleId] = useState<string | null>(null); // null이면 신규 추가
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('09:00');
  const [editEndTime, setEditEndTime] = useState('18:00');
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

  // ✅ [수동 추가] 날짜 클릭 시 신규 등록 팝업 열기
  const handleDateClick = (day: Date) => {
    // 만약 템플릿 선택 모드라면? (기존 기능 유지할지, 수동 추가로 통일할지 고민)
    // 사장님 요청대로 '수동 추가' 위주로 갑니다.
    setTargetScheduleId(null); // 신규 모드
    setEditDate(format(day, 'yyyy-MM-dd'));
    setEditStartTime('09:00');
    setEditEndTime('18:00');
    setEditEmpId(null);
    setEditExcludePay(false);
    setPopupOpen(true);
  };

  // ✅ [수정] 기존 스케줄 클릭 시 수정 팝업 열기
  const handleScheduleClick = (e: React.MouseEvent, sch: Schedule) => {
    e.stopPropagation();
    setTargetScheduleId(sch.id); // 수정 모드
    setEditDate(sch.date);
    setEditStartTime(sch.start_time.slice(0, 5));
    setEditEndTime(sch.end_time.slice(0, 5));
    setEditEmpId(sch.employee_id);
    setEditExcludePay(sch.exclude_holiday_pay || false);
    setPopupOpen(true);
  };

  // 저장 (신규 or 수정)
  const handleSave = async () => {
    if (!currentStoreId) return;

    const payload = {
      store_id: currentStoreId,
      date: editDate,
      start_time: editStartTime,
      end_time: editEndTime,
      employee_id: editEmpId,
      exclude_holiday_pay: editExcludePay,
      color: '#4ECDC4' // 기본 색상 (직원 배정 시 자동 색상으로 보임)
    };

    let error;
    if (targetScheduleId) {
      // 수정
      const { error: updateError } = await supabase
        .from('schedules')
        .update(payload)
        .eq('id', targetScheduleId);
      error = updateError;
    } else {
      // 신규
      const { error: insertError } = await supabase
        .from('schedules')
        .insert(payload);
      error = insertError;
    }

    if (error) alert('저장 실패: ' + error.message);
    else {
      fetchSchedules();
      setPopupOpen(false);
    }
  };

  // 삭제
  const handleDelete = async () => {
    if (!targetScheduleId || !confirm("정말 삭제하시겠습니까?")) return;
    const { error } = await supabase.from('schedules').delete().eq('id', targetScheduleId);
    if (!error) {
      fetchSchedules();
      setPopupOpen(false);
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
              onClick={() => handleDateClick(day)} // ✅ 클릭 시 추가 팝업
              style={{ 
                minHeight: 130, padding: '4px 2px 20px 2px', // 하단 패딩 확보
                borderRight: '1px solid #444', borderBottom: '1px solid #444',
                backgroundColor: isCurrentMonth ? (isTodayDate ? '#222f3e' : 'transparent') : '#111',
                opacity: isCurrentMonth ? 1 : 0.4, cursor: 'pointer', // 손가락 커서
                display: 'flex', flexDirection: 'column', position: 'relative'
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
                      onClick={(e) => handleScheduleClick(e, sch)} // ✅ 클릭 시 수정 팝업
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
              
              {/* + 버튼 (호버 효과 등은 CSS로 처리하거나, 간단하게 텍스트로 표시) */}
              <div style={{ position: 'absolute', bottom: 4, right: 4, color: '#555', fontSize: 18 }}>+</div>
            </div>
          );
        })}
      </div>

      {/* ✅ [통합] 스케줄 추가/수정 팝업 */}
      {popupOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#222', padding: 24, borderRadius: 12, border: '1px solid #444', width: 360,
            boxShadow: '0 10px 25px rgba(0,0,0,0.8)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: 20, color: '#fff', textAlign: 'center' }}>
              {targetScheduleId ? '스케줄 수정' : '새 스케줄 추가'} ({editDate})
            </h3>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#aaa', marginBottom: 8 }}>근무 시간</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TimeSelector value={editStartTime} onChange={setEditStartTime} />
                <span>~</span>
                <TimeSelector value={editEndTime} onChange={setEditEndTime} />
              </div>
            </div>

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

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              {targetScheduleId ? (
                <button onClick={handleDelete} style={{ padding: '10px 16px', background: '#c0392b', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>삭제</button>
              ) : (
                <div></div> // 빈 공간 채우기
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setPopupOpen(false)} style={{ padding: '10px 16px', background: '#555', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>취소</button>
                <button onClick={handleSave} style={{ padding: '10px 20px', background: 'dodgerblue', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer' }}>저장</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const btnStyle = { padding: '6px 12px', background: '#333', border: '1px solid #555', color: '#fff', borderRadius: 4, cursor: 'pointer' };