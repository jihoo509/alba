'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, addMonths, subMonths, isSameMonth, isToday 
} from 'date-fns';
import html2canvas from 'html2canvas'; 
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import type { ScheduleTemplate } from './TemplateSection';
import TimeSelector from './TimeSelector';
import type { Employee } from '@/app/dashboard/page';

type Props = {
  currentStoreId: string | null;
  selectedTemplate: ScheduleTemplate | null;
  employees: Employee[];
  wageSystem: 'hourly' | 'daily'; // ✅ [추가]
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
  memo?: string; 
  daily_wage?: number; // ✅ [추가]
};

const getEmployeeColor = (empId: string | null, employees: Employee[]) => {
  if (!empId) return '#95a5a6';
  const index = employees.findIndex(e => e.id === empId);
  const PALETTE = [
    '#e74c3c', '#3498db', '#f1c40f', '#2ecc71', '#9b59b6', 
    '#e67e22', '#1abc9c', '#34495e', '#d35400', '#7f8c8d'
  ];
  if (index === -1) return '#95a5a6';
  return PALETTE[index % PALETTE.length];
};

export default function ScheduleCalendar({ currentStoreId, selectedTemplate, employees, wageSystem }: Props) {
  const supabase = createSupabaseBrowserClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  
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
  
  // ✅ [추가] 일당 입력 상태
  const [editDailyWage, setEditDailyWage] = useState('');

  const [minuteInterval, setMinuteInterval] = useState(30);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedDeleteIds, setSelectedDeleteIds] = useState<string[]>([]);

  const fetchSchedules = useCallback(async () => {
    if (!currentStoreId) return;
    
    const startDate = format(startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const endDate = format(endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 }), 'yyyy-MM-dd');

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

  const handleDownloadImage = async () => {
    if (!calendarRef.current) return;
    try {
      const originalElement = calendarRef.current;
      const clone = originalElement.cloneNode(true) as HTMLElement;
      
      clone.classList.add('force-pc-view');
      document.body.appendChild(clone);

      clone.style.position = 'fixed';
      clone.style.top = '-10000px';
      clone.style.left = '-10000px';
      clone.style.width = '1200px'; 
      clone.style.height = 'auto';
      clone.style.zIndex = '-1';
      clone.style.backgroundColor = '#ffffff';
      
      const tables = clone.getElementsByTagName('table');
      if (tables.length > 0) {
        tables[0].style.width = '100%';
        tables[0].style.minWidth = '1200px';
        tables[0].style.fontSize = '14px';
      }

      const canvas = await html2canvas(clone, {
        scale: 2, 
        backgroundColor: '#ffffff',
        useCORS: true,
        windowWidth: 1600, 
        width: 1200
      });

      document.body.removeChild(clone);

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `${format(currentDate, 'yyyy-MM')}_스케줄표.png`;
      link.click();
    } catch (err) {
      console.error('이미지 저장 실패:', err);
      alert('이미지 저장 중 오류가 발생했습니다.');
    }
  };

  const handleResetFuture = async () => {
    if (!confirm('정말 내일부터의 모든 스케줄을 초기화(삭제)하시겠습니까?')) return;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    const { error } = await supabase.from('schedules').delete().eq('store_id', currentStoreId).gte('date', dateStr);
    if (error) alert('초기화 실패: ' + error.message);
    else {
      alert('초기화되었습니다.');
      fetchSchedules();
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDeleteIds.length === 0) return;
    if (!confirm(`선택한 ${selectedDeleteIds.length}개의 스케줄을 삭제하시겠습니까?`)) return;
    const { error } = await supabase.from('schedules').delete().in('id', selectedDeleteIds);
    if (error) alert('삭제 실패');
    else {
      setSelectedDeleteIds([]);
      setIsDeleteMode(false);
      fetchSchedules();
    }
  };

  const handleScheduleClick = (e: React.MouseEvent, sch: Schedule) => {
    e.stopPropagation();
    if (isDeleteMode) {
      setSelectedDeleteIds(prev => prev.includes(sch.id) ? prev.filter(id => id !== sch.id) : [...prev, sch.id]);
    } else {
      setTargetSchedule(sch);
      setEditDate(sch.date);
      setEditStartTime(sch.start_time.slice(0, 5));
      setEditEndTime(sch.end_time.slice(0, 5));
      setEditEmpId(sch.employee_id);
      setEditExcludePay(sch.exclude_holiday_pay || false);
      setEditIsHolidayWork(sch.is_holiday_work || false);
      
      // ✅ 일당 정보 불러오기
      setEditDailyWage(sch.daily_wage ? String(sch.daily_wage) : '');

      setMinuteInterval(30); 
      setIsNew(false);
      setPopupOpen(true);
    }
  };

  const handleDateClick = (day: Date) => {
    if (isDeleteMode) return;
    setTargetSchedule(null);
    setEditDate(format(day, 'yyyy-MM-dd'));
    setEditStartTime('09:00');
    setEditEndTime('18:00');
    setEditEmpId(null);
    setEditExcludePay(false);
    setEditIsHolidayWork(false);
    
    // ✅ 일당 초기화
    setEditDailyWage('');

    setMinuteInterval(30);
    setIsNew(true);
    setPopupOpen(true);
  };

  const handleSave = async () => {
    if (!currentStoreId) return;

    // ✅ 일당제일 경우 값 확인
    const dailyWageVal = wageSystem === 'daily' ? Number(editDailyWage.replace(/,/g, '')) : null;
    if (wageSystem === 'daily' && !dailyWageVal) {
        return alert('일당 금액을 입력해주세요.');
    }

    const payload = {
      store_id: currentStoreId,
      date: editDate,
      start_time: editStartTime,
      end_time: editEndTime,
      employee_id: editEmpId,
      exclude_holiday_pay: editExcludePay,
      is_holiday_work: editIsHolidayWork,
      daily_wage: dailyWageVal, // ✅ DB 저장
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
    else { fetchSchedules(); setPopupOpen(false); }
  };

  const handleDelete = async () => {
    if (!targetSchedule) return;
    const { error } = await supabase.from('schedules').delete().eq('id', targetSchedule.id);
    if (!error) { fetchSchedules(); setPopupOpen(false); }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); 
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const weeks = ['월', '화', '수', '목', '금', '토', '일'];

  return (
    <div style={{ backgroundColor: '#ffffff', padding: 24, borderRadius: 12, border: '1px solid #ddd', position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      
      {/* 상단 컨트롤 영역 */}
      <div className="calendar-header-mobile" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} style={btnStyle}>&lt;</button>
          <span style={{ fontSize: 20, fontWeight: 'bold', color: '#333', alignSelf: 'center', marginLeft: 8 }}>{format(currentDate, 'yyyy년 MM월')}</span>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} style={btnStyle}>&gt;</button>
        </div>
        <div className="mobile-btn-group" style={{ display: 'flex', gap: 8 }}>
           {!isDeleteMode && <button onClick={handleDownloadImage} className="mobile-sm-btn" style={{ ...btnStyle, background: 'dodgerblue', color: '#fff', border: 'none', fontWeight: 'bold' }}>📷 이미지 저장</button>}
          {isDeleteMode ? (
            <>
              <button onClick={handleBulkDelete} className="mobile-sm-btn" style={{ ...btnStyle, background: 'darkred', color: '#fff', border: 'none' }}>선택 삭제</button>
              <button onClick={() => { setIsDeleteMode(false); setSelectedDeleteIds([]); }} className="mobile-sm-btn" style={btnStyle}>취소</button>
            </>
          ) : (
            <>
              <button onClick={() => setIsDeleteMode(true)} className="mobile-sm-btn" style={btnStyle}>🗑️ 일괄 삭제</button>
              <button onClick={handleResetFuture} className="mobile-sm-btn" style={btnStyle}>🔄 미래 초기화</button>
            </>
          )}
        </div>
      </div>

      {/* 캡처 영역 */}
      <div ref={calendarRef} style={{ backgroundColor: '#fff', paddingBottom: 10 }}>
        
        {/* 요일 헤더 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 10, textAlign: 'center' }}>
          {weeks.map((day, idx) => (
            <div key={day} style={{ color: idx === 5 ? 'dodgerblue' : idx === 6 ? 'salmon' : '#666', fontWeight: 'bold', fontSize: 16 }}>{day}</div>
          ))}
        </div>

        {/* 캘린더 그리드 */}
        <div className="table-wrapper" style={{ backgroundColor: '#fff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead><tr>{weeks.map(day => <th key={day} style={{ height: 0, padding: 0, border: 'none' }}></th>)}</tr></thead>
            <tbody></tbody>
          </table>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderTop: '1px solid #ddd', borderLeft: '1px solid #ddd' }}>
            {calendarDays.map((day, idx) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isTodayDate = isToday(day);
              const daySchedules = schedules.filter(s => s.date === dateStr).sort((a, b) => a.start_time.localeCompare(b.start_time));
              const isSun = idx % 7 === 6;
              const dayColor = isSun ? 'salmon' : (idx % 7 === 5 ? 'dodgerblue' : '#333');

              return (
                <div key={day.toString()} onClick={() => handleDateClick(day)} style={{ minHeight: 130, padding: '4px 2px 20px 2px', borderRight: '1px solid #ddd', borderBottom: '1px solid #ddd', backgroundColor: isCurrentMonth ? (isTodayDate ? '#f0f9ff' : 'transparent') : '#f9f9f9', opacity: 1, cursor: isDeleteMode ? 'default' : 'pointer', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ textAlign: 'center', marginBottom: 6, fontSize: 14, color: isTodayDate ? 'dodgerblue' : dayColor, fontWeight: isTodayDate ? 'bold' : 'normal', paddingTop: 4 }}>{format(day, 'd')}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                    {daySchedules.map(sch => {
                      const start = sch.start_time.slice(0, 5);
                      const end = sch.end_time.slice(0, 5);
                      const empName = sch.employees?.name;
                      const bgColor = getEmployeeColor(sch.employee_id, employees); 
                      const isSelectedForDelete = selectedDeleteIds.includes(sch.id);
                      const patternName = sch.memo; 

                      return (
                        <div key={sch.id} onClick={(e) => handleScheduleClick(e, sch)} className="schedule-box" style={{ backgroundColor: isDeleteMode ? (isSelectedForDelete ? 'darkred' : '#eee') : bgColor, color: isDeleteMode && !isSelectedForDelete ? '#aaa' : '#fff', fontSize: 12, padding: '6px', borderRadius: 6, cursor: 'pointer', border: isDeleteMode ? (isSelectedForDelete ? '2px solid red' : '1px solid #ccc') : (sch.employee_id ? 'none' : '2px dashed #999'), textAlign: 'center', opacity: isDeleteMode && !isSelectedForDelete ? 0.5 : 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                          <div className="schedule-emp-name" style={{ fontWeight: 'bold', fontSize: 13 }}>
                            {empName || '미배정'}
                            {sch.is_holiday_work && <span style={{fontSize: 10, marginLeft: 4}}>🔴</span>}
                            {sch.exclude_holiday_pay && <span style={{fontSize: 10, marginLeft: 4}}>🚫</span>}
                          </div>
                          <div className="schedule-time" style={{ fontSize: 11, opacity: 0.9 }}>{start} ~ {end}</div>
                          {/* ✅ [추가] 일당제면 금액도 살짝 표시 */}
                          {wageSystem === 'daily' && sch.daily_wage && (
                              <div style={{fontSize: 10, color: '#ffeb3b', fontWeight:'bold'}}>
                                  ₩{sch.daily_wage.toLocaleString()}
                              </div>
                          )}
                          <div className="schedule-pattern-only mobile-only-block" style={{ fontSize: 11, fontWeight: 'bold' }}>{patternName || ''}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {popupOpen && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000}}>
          <div style={{backgroundColor: '#ffffff', padding: 24, borderRadius: 12, border: '1px solid #ccc', width: 360, boxShadow: '0 10px 25px rgba(0,0,0,0.2)', color: '#333'}}>
            <h3 style={{ marginTop: 0, marginBottom: 20, color: '#333', textAlign: 'center' }}>{isNew ? '새 스케줄 추가' : '스케줄 수정'} ({editDate})</h3>
            
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 13, color: '#666' }}>근무 시간</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[30, 10, 5].map((min) => (
                    <button key={min} onClick={() => setMinuteInterval(min)} style={{ padding: '2px 8px', fontSize: 11, borderRadius: 4, border: '1px solid #ccc', cursor: 'pointer', backgroundColor: minuteInterval === min ? 'dodgerblue' : '#f0f0f0', color: minuteInterval === min ? '#fff' : '#666' }}>{min}분</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TimeSelector value={editStartTime} onChange={setEditStartTime} interval={minuteInterval} />
                <span>~</span>
                <TimeSelector value={editEndTime} onChange={setEditEndTime} interval={minuteInterval} isLast={true} />
              </div>
            </div>

            {/* ✅ [추가] 일당제일 때 일당 입력칸 */}
            {wageSystem === 'daily' && (
                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 8 }}>일당 (원)</label>
                    <input 
                        type="number" 
                        value={editDailyWage} 
                        onChange={(e) => setEditDailyWage(e.target.value)} 
                        placeholder="예: 120000"
                        style={{ width: '100%', padding: 10, backgroundColor: '#fff', color: '#333', border: '1px solid #ccc', borderRadius: 6 }}
                    />
                </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 8 }}>근무자 (대타)</label>
              <select value={editEmpId || ''} onChange={(e) => setEditEmpId(e.target.value || null)} style={{ width: '100%', padding: 10, backgroundColor: '#fff', color: '#333', border: '1px solid #ccc', borderRadius: 6 }}>
                <option value="">(미배정)</option>
                {employees.map(emp => (<option key={emp.id} value={emp.id}>{emp.name}</option>))}
              </select>
            </div>
            <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#e74c3c', fontWeight: 'bold', fontSize: 14 }}>
                <input type="checkbox" checked={editIsHolidayWork} onChange={(e) => setEditIsHolidayWork(e.target.checked)} style={{ width: 18, height: 18 }} />
                🟥 공휴일(특근) 근무 (1.5배)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#666', fontSize: 13 }}>
                <input type="checkbox" checked={editExcludePay} onChange={(e) => setEditExcludePay(e.target.checked)} style={{ width: 16, height: 16 }} />
                이 근무는 주휴수당 계산 제외
              </label>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              {!isNew ? <button onClick={handleDelete} style={{ padding: '10px 16px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>삭제</button> : <div></div>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setPopupOpen(false)} style={{ padding: '10px 16px', background: '#f0f0f0', color: '#333', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer' }}>취소</button>
                <button onClick={handleSave} style={{ padding: '10px 20px', background: 'dodgerblue', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer' }}>저장</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const btnStyle = { padding: '6px 12px', background: '#fff', border: '1px solid #ccc', color: '#333', borderRadius: 6, cursor: 'pointer', fontSize: 13 };