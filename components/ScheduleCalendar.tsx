'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, addMonths, subMonths, isSameMonth, isToday 
} from 'date-fns';
import html2canvas from 'html2canvas'; // 이미지 저장용
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import type { ScheduleTemplate } from './TemplateSection';
import TimeSelector from './TimeSelector';
// ✅ [수정] 에러 원인 해결: Employee 타입을 dashboard에서 가져옴
import type { Employee } from '@/app/dashboard/page';

type Props = {
  currentStoreId: string | null;
  selectedTemplate: ScheduleTemplate | null;
  employees: Employee[]; // ✅ SimpleEmployee -> Employee로 변경
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
  is_holiday_work?: boolean;
};

// ✅ [수정] 타입 변경 반영
const getEmployeeColor = (empId: string | null, employees: Employee[]) => {
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
  
  // ✅ 이미지 저장을 위한 Ref
  const calendarRef = useRef<HTMLDivElement>(null);
  
  const [targetSchedule, setTargetSchedule] = useState<Schedule | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);

  // 폼 상태
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('09:00');
  const [editEndTime, setEditEndTime] = useState('18:00');
  const [editEmpId, setEditEmpId] = useState<string | null>(null);
  const [editExcludePay, setEditExcludePay] = useState(false);
  const [editIsHolidayWork, setEditIsHolidayWork] = useState(false);

  // 일괄 삭제 모드
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedDeleteIds, setSelectedDeleteIds] = useState<string[]>([]);

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

  // ✅ 이미지 다운로드 함수
  const handleDownloadImage = async () => {
    if (!calendarRef.current) return;
    try {
      const canvas = await html2canvas(calendarRef.current, {
        backgroundColor: '#1a1a1a',
        scale: 2, 
      });
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `${format(currentDate, 'yyyy-MM')}_스케줄표.png`;
      link.click();
    } catch (err) {
      console.error('이미지 저장 실패:', err);
      alert('이미지 저장 중 오류가 발생했습니다.');
    }
  };

  // 미래 스케줄 초기화
  const handleResetFuture = async () => {
    if (!confirm('정말 내일부터의 모든 스케줄을 초기화(삭제)하시겠습니까?')) return;
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('store_id', currentStoreId)
      .gte('date', dateStr);

    if (error) alert('초기화 실패: ' + error.message);
    else {
      alert('초기화되었습니다.');
      fetchSchedules();
    }
  };

  // 일괄 삭제 실행
  const handleBulkDelete = async () => {
    if (selectedDeleteIds.length === 0) return;
    if (!confirm(`선택한 ${selectedDeleteIds.length}개의 스케줄을 삭제하시겠습니까?`)) return;

    const { error } = await supabase
      .from('schedules')
      .delete()
      .in('id', selectedDeleteIds);

    if (error) alert('삭제 실패');
    else {
      setSelectedDeleteIds([]);
      setIsDeleteMode(false);
      fetchSchedules();
    }
  };

  // 스케줄 클릭 핸들러
  const handleScheduleClick = (e: React.MouseEvent, sch: Schedule) => {
    e.stopPropagation();

    if (isDeleteMode) {
      setSelectedDeleteIds(prev => 
        prev.includes(sch.id) ? prev.filter(id => id !== sch.id) : [...prev, sch.id]
      );
    } else {
      setTargetSchedule(sch);
      setEditDate(sch.date);
      setEditStartTime(sch.start_time.slice(0, 5));
      setEditEndTime(sch.end_time.slice(0, 5));
      setEditEmpId(sch.employee_id);
      setEditExcludePay(sch.exclude_holiday_pay || false);
      setEditIsHolidayWork(sch.is_holiday_work || false);
      setIsNew(false);
      setPopupOpen(true);
    }
  };

  // 날짜 클릭 (신규 추가)
  const handleDateClick = (day: Date) => {
    if (isDeleteMode) return;
    
    setTargetSchedule(null);
    setEditDate(format(day, 'yyyy-MM-dd'));
    setEditStartTime('09:00');
    setEditEndTime('18:00');
    setEditEmpId(null);
    setEditExcludePay(false);
    setEditIsHolidayWork(false);
    setIsNew(true);
    setPopupOpen(true);
  };

  // 저장 (신규/수정)
  const handleSave = async () => {
    if (!currentStoreId) return;

    const payload = {
      store_id: currentStoreId,
      date: editDate,
      start_time: editStartTime,
      end_time: editEndTime,
      employee_id: editEmpId,
      exclude_holiday_pay: editExcludePay,
      is_holiday_work: editIsHolidayWork,
      color: '#4ECDC4'
    };

    let error;
    if (isNew) {
      const { error: insertError } = await supabase.from('schedules').insert(payload);
      error = insertError;
    } else if (targetSchedule) {
      const { error: updateError } = await supabase.from('schedules').update(payload).eq('id', targetSchedule.id);
      error = updateError;
    }

    if (error) alert('저장 실패');
    else {
      fetchSchedules();
      setPopupOpen(false);
    }
  };

  // 단건 삭제
  const handleDelete = async () => {
    if (!targetSchedule) return;
    const { error } = await supabase.from('schedules').delete().eq('id', targetSchedule.id);
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
    // ✅ ref 연결 (캡쳐 영역)
    <div ref={calendarRef} style={{ backgroundColor: '#1a1a1a', padding: 20, borderRadius: 8, border: '1px solid #333', position: 'relative' }}>
      
      {/* 헤더 + 기능 버튼들 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} style={btnStyle}>&lt;</button>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} style={btnStyle}>&gt;</button>
          <span style={{ fontSize: 20, fontWeight: 'bold', color: '#fff', alignSelf: 'center', marginLeft: 8 }}>{format(currentDate, 'yyyy년 MM월')}</span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
           {/* ✅ 이미지 저장 버튼 */}
           {!isDeleteMode && (
            <button 
              onClick={handleDownloadImage} 
              style={{ ...btnStyle, background: 'dodgerblue', border: 'none', fontWeight: 'bold' }}
            >
              📷 이미지 저장
            </button>
          )}

          {isDeleteMode ? (
            <>
              <span style={{ color: 'salmon', alignSelf: 'center', fontSize: 14 }}>선택 중... ({selectedDeleteIds.length})</span>
              <button onClick={handleBulkDelete} style={{ ...btnStyle, background: 'darkred', color: '#fff' }}>선택 삭제</button>
              <button onClick={() => { setIsDeleteMode(false); setSelectedDeleteIds([]); }} style={btnStyle}>취소</button>
            </>
          ) : (
            <>
              <button onClick={() => setIsDeleteMode(true)} style={{ ...btnStyle, background: '#444', color: '#ddd' }}>🗑️ 일괄 삭제</button>
              <button onClick={handleResetFuture} style={{ ...btnStyle, background: '#444', color: '#ddd' }}>🔄 미래 초기화</button>
            </>
          )}
        </div>
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
                minHeight: 130, padding: '4px 2px 20px 2px', 
                borderRight: '1px solid #444', borderBottom: '1px solid #444',
                backgroundColor: isCurrentMonth ? (isTodayDate ? '#222f3e' : 'transparent') : '#111',
                opacity: isCurrentMonth ? 1 : 0.4, cursor: isDeleteMode ? 'default' : 'pointer',
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
                  const isSelectedForDelete = selectedDeleteIds.includes(sch.id);

                  return (
                    <div 
                      key={sch.id}
                      onClick={(e) => handleScheduleClick(e, sch)}
                      style={{
                        backgroundColor: isDeleteMode ? (isSelectedForDelete ? 'darkred' : '#333') : bgColor,
                        color: '#fff', fontSize: 12, padding: '6px', borderRadius: 6,
                        cursor: 'pointer', 
                        border: isDeleteMode 
                          ? (isSelectedForDelete ? '2px solid red' : '1px solid #555') 
                          : (sch.employee_id ? 'none' : '2px dashed #777'),
                        textAlign: 'center', opacity: isDeleteMode && !isSelectedForDelete ? 0.5 : 1,
                        display: 'flex', flexDirection: 'column', justifyContent: 'center'
                      }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: 13, marginBottom: 2 }}>
                        {empName || '❓ 미배정'}
                        {sch.is_holiday_work && <span style={{fontSize: 10, marginLeft: 4}}>🔴</span>}
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

      {/* 팝업 */}
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
              {isNew ? '새 스케줄 추가' : '스케줄 수정'} ({editDate})
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

            <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#ff6b6b', fontWeight: 'bold', fontSize: 14 }}>
                <input type="checkbox" checked={editIsHolidayWork} onChange={(e) => setEditIsHolidayWork(e.target.checked)} style={{ width: 18, height: 18 }} />
                🟥 공휴일(특근) 근무 (1.5배)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#aaa', fontSize: 13 }}>
                <input type="checkbox" checked={editExcludePay} onChange={(e) => setEditExcludePay(e.target.checked)} style={{ width: 16, height: 16 }} />
                이 근무는 주휴수당 계산 제외
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              {!isNew ? (
                <button onClick={handleDelete} style={{ padding: '10px 16px', background: '#c0392b', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>삭제</button>
              ) : <div></div>}
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

const btnStyle = { padding: '6px 12px', background: '#333', border: '1px solid #555', color: '#fff', borderRadius: 6, cursor: 'pointer', fontSize: 13 };