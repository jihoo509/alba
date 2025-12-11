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
  daily_pay_amount?: number;
  pay_type?: string;
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

export default function ScheduleCalendar({ currentStoreId, selectedTemplate, employees }: Props) {
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
  const [editDailyPay, setEditDailyPay] = useState('');
  const [minuteInterval, setMinuteInterval] = useState(30);

  const [isEmpListOpen, setIsEmpListOpen] = useState(false);

  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedDeleteIds, setSelectedDeleteIds] = useState<string[]>([]);

  // 모바일 선택 팝업 상태
  const [showMobileChoice, setShowMobileChoice] = useState(false);

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

  useEffect(() => {
    if (editEmpId) {
        const emp = employees.find(e => e.id === editEmpId) as any;
        if (emp && (emp.pay_type === 'day' || emp.pay_type === '일당')) {
            if (editDailyPay === '' || isNew) {
                const defaultWage = emp.daily_wage || emp.default_daily_pay || 0;
                setEditDailyPay(defaultWage > 0 ? defaultWage.toLocaleString() : '');
            }
        }
    }
  }, [editEmpId, employees, isNew]); 

  // 메인 버튼 동작 (PC vs 모바일 분기)
  const handleMainDownloadClick = () => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);
    if (isMobile) {
      setShowMobileChoice(true); 
    } else {
      handleDownloadImage(false); 
    }
  };

  // 이미지 생성 및 다운로드 (공용)
  const handleDownloadImage = async (autoClose = false) => {
    setShowMobileChoice(false); 
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

      const canvas = await html2canvas(clone, { scale: 2, backgroundColor: '#ffffff', useCORS: true, windowWidth: 1600, width: 1200 });
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

  // 카카오톡/공유하기 (모바일 전용)
  const handleShareImage = async () => {
    setShowMobileChoice(false);
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

      const canvas = await html2canvas(clone, { scale: 2, backgroundColor: '#ffffff', useCORS: true, windowWidth: 1600, width: 1200 });
      document.body.removeChild(clone);

      canvas.toBlob(async (blob) => {
        if (!blob) return alert('이미지 생성 실패');
        const file = new File([blob], `${format(currentDate, 'yyyy-MM')}_스케줄표.png`, { type: 'image/png' });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `${format(currentDate, 'yyyy-MM')} 스케줄`,
              text: `${format(currentDate, 'yyyy년 MM월')} 근무 스케줄표입니다.`,
            });
          } catch (err) {
            console.log('공유 취소됨');
          }
        } else {
          alert('이 기기에서는 공유 기능을 사용할 수 없어 다운로드합니다.');
          const link = document.createElement('a');
          link.href = canvas.toDataURL('image/png');
          link.download = `${format(currentDate, 'yyyy-MM')}_스케줄표.png`;
          link.click();
        }
      }, 'image/png');

    } catch (err) {
      console.error('공유 실패:', err);
      alert('공유 실패');
    }
  };

  const handleResetFuture = async () => {
    if (!confirm('정말 내일부터의 모든 스케줄을 초기화(삭제)하시겠습니까?')) return;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    const { error } = await supabase.from('schedules').delete().eq('store_id', currentStoreId).gte('date', dateStr);
    if (error) alert('초기화 실패: ' + error.message);
    else { alert('초기화되었습니다.'); fetchSchedules(); }
  };

  const handleBulkDelete = async () => {
    if (selectedDeleteIds.length === 0) return;
    if (!confirm(`선택한 ${selectedDeleteIds.length}개의 스케줄을 삭제하시겠습니까?`)) return;
    const { error } = await supabase.from('schedules').delete().in('id', selectedDeleteIds);
    if (error) alert('삭제 실패');
    else { setSelectedDeleteIds([]); setIsDeleteMode(false); fetchSchedules(); }
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
      setEditDailyPay(sch.daily_pay_amount ? sch.daily_pay_amount.toLocaleString() : '');
      setMinuteInterval(30); 
      setIsNew(false);
      setPopupOpen(true);
      setIsEmpListOpen(false); 
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
    setEditDailyPay('');
    setMinuteInterval(30); 
    setIsNew(true);
    setPopupOpen(true);
    setIsEmpListOpen(false);
  };

  const handleDailyPayInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/,/g, '');
    if (/^\d*$/.test(val)) {
        setEditDailyPay(val === '' ? '' : Number(val).toLocaleString());
    }
  };

  const handleSelectEmployee = (id: string | null) => {
    setEditEmpId(id);
    setIsEmpListOpen(false);
  };

  const handleSave = async () => {
    if (!currentStoreId) return;
    const selectedEmp = employees.find(e => e.id === editEmpId) as any;
    const isDaily = selectedEmp && (selectedEmp.pay_type === 'day' || selectedEmp.pay_type === '일당');

    const payload = {
      store_id: currentStoreId,
      date: editDate,
      start_time: editStartTime,
      end_time: editEndTime,
      employee_id: editEmpId,
      exclude_holiday_pay: editExcludePay,
      is_holiday_work: editIsHolidayWork,
      color: '#4ECDC4',
      pay_type: isDaily ? 'day' : 'time',
      daily_pay_amount: isDaily ? Number(editDailyPay.replace(/,/g, '')) : 0,
    };

    let error;
    if (isNew) {
      const { error: insertError } = await supabase.from('schedules').insert(payload);
      error = insertError;
    } else if (targetSchedule) {
      const { error: updateError } = await supabase.from('schedules').update(payload).eq('id', targetSchedule.id);
      error = updateError;
    }
    if (error) alert('저장 실패: ' + error.message);
    else { fetchSchedules(); setPopupOpen(false); }
  };

  const handleDelete = async () => {
    if (!targetSchedule) return;
    const { error } = await supabase.from('schedules').delete().eq('id', targetSchedule.id);
    if (!error) { fetchSchedules(); setPopupOpen(false); }
  };

  const selectedEmpObj = employees.find(e => e.id === editEmpId) as any;
  const isSelectedEmpDaily = selectedEmpObj && (selectedEmpObj.pay_type === 'day' || selectedEmpObj.pay_type === '일당');
  const selectedEmpName = selectedEmpObj ? selectedEmpObj.name : '(미배정)';

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); 
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const weeks = ['월', '화', '수', '목', '금', '토', '일'];

  return (
    <div style={{ backgroundColor: '#ffffff', padding: 24, borderRadius: 12, border: '1px solid #ddd', position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      {/* ✅ [스타일] 반응형 CSS */}
      <style jsx>{`
        .calendar-header-mobile {
          flex-direction: row;
        }
        .mobile-btn-group {
          margin-top: 0;
        }
        @media (max-width: 600px) {
          .calendar-header-mobile {
            flex-direction: column;
            gap: 12px;
            align-items: stretch !important;
          }
          .mobile-btn-group {
            justify-content: space-between;
            width: 100%;
          }
          .mobile-sm-btn {
            flex: 1;
            padding: 10px 0 !important;
            font-size: 13px !important;
          }
        }
      `}</style>

      {/* 상단 컨트롤 영역 */}
      <div className="calendar-header-mobile" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} style={btnStyle}>&lt;</button>
          <span style={{ fontSize: 20, fontWeight: 'bold', color: '#333', alignSelf: 'center', marginLeft: 8 }}>{format(currentDate, 'yyyy년 MM월')}</span>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} style={btnStyle}>&gt;</button>
        </div>
        <div className="mobile-btn-group" style={{ display: 'flex', gap: 8 }}>
           {!isDeleteMode && (
             <button onClick={handleMainDownloadClick} className="mobile-sm-btn" style={{ ...btnStyle, background: 'dodgerblue', color: '#fff', border: 'none', fontWeight: 'bold' }}>
               📷 이미지 저장
             </button>
           )}
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

      {/* 캘린더 영역 */}
      <div ref={calendarRef} style={{ backgroundColor: '#fff', paddingBottom: 10 }}>
        <div style={{ minWidth: '100%', display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 10, textAlign: 'center' }}>
          {weeks.map((day, idx) => (
            <div key={day} style={{ color: idx === 5 ? 'dodgerblue' : idx === 6 ? 'salmon' : '#666', fontWeight: 'bold', fontSize: 16 }}>{day}</div>
          ))}
        </div>
        
        {/* ✅ [수정] 스크롤바 제거 (overflowX 제거 및 width 100%) */}
        <div className="table-wrapper" style={{ backgroundColor: '#fff', width: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderTop: '1px solid #ddd', borderLeft: '1px solid #ddd' }}>
            {calendarDays.map((day, idx) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isTodayDate = isToday(day);
              const daySchedules = schedules.filter(s => s.date === dateStr).sort((a, b) => a.start_time.localeCompare(b.start_time));
              const isSun = idx % 7 === 6;
              const dayColor = isSun ? 'salmon' : (idx % 7 === 5 ? 'dodgerblue' : '#333');

              return (
                <div key={day.toString()} onClick={() => handleDateClick(day)} 
                     style={{ 
                         // ✅ [수정] minHeight 제거 -> 내용만큼 늘어남
                         minHeight: 80, 
                         padding: '4px 2px 10px 2px', 
                         borderRight: '1px solid #ddd', 
                         borderBottom: '1px solid #ddd', 
                         backgroundColor: isCurrentMonth ? (isTodayDate ? '#f0f9ff' : 'transparent') : '#f9f9f9', 
                         cursor: isDeleteMode ? 'default' : 'pointer', 
                         display: 'flex', flexDirection: 'column',
                         overflow: 'hidden' // 내용 넘침 숨김
                     }}>
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
                        <div key={sch.id} onClick={(e) => handleScheduleClick(e, sch)} className="schedule-box" style={{ backgroundColor: isDeleteMode ? (isSelectedForDelete ? 'darkred' : '#eee') : bgColor, color: isDeleteMode && !isSelectedForDelete ? '#aaa' : '#fff', fontSize: 11, padding: '3px', borderRadius: 4, cursor: 'pointer', border: isDeleteMode ? (isSelectedForDelete ? '2px solid red' : '1px solid #ccc') : (sch.employee_id ? 'none' : '2px dashed #999'), textAlign: 'center', opacity: isDeleteMode && !isSelectedForDelete ? 0.5 : 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                          <div className="schedule-emp-name" style={{ fontWeight: 'bold', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {empName || '미배정'}
                            {sch.is_holiday_work && <span style={{fontSize: 10, marginLeft: 2}}>🔴</span>}
                            {sch.exclude_holiday_pay && <span style={{fontSize: 10, marginLeft: 2}}>🚫</span>}
                          </div>
                          <div className="schedule-time" style={{ fontSize: 10, opacity: 0.9 }}>{start}~{end}</div>
                          {patternName && <div className="schedule-pattern-only mobile-only-block" style={{ fontSize: 10, fontWeight: 'bold' }}>{patternName}</div>}
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
          <div style={{backgroundColor: '#ffffff', padding: 24, borderRadius: 12, border: '1px solid #ccc', width: '90%', maxWidth: '380px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', color: '#333', maxHeight: '90vh', overflowY: 'auto'}} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: 20, color: '#333', textAlign: 'center' }}>{isNew ? '새 스케줄 추가' : '스케줄 수정'} ({editDate})</h3>
            
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                {/* ✅ [수정] 분 선택 버튼을 라벨 바로 옆으로 이동 */}
                <div style={{display:'flex', alignItems:'center', gap: 10}}>
                    <label style={{ fontSize: 13, color: '#666', fontWeight:'bold' }}>근무 시간</label>
                    <div style={{ display: 'flex', gap: 4 }}>
                    {[30, 10, 5].map((min) => (
                        <button key={min} onClick={() => setMinuteInterval(min)} style={{ padding: '2px 6px', fontSize: 11, borderRadius: 4, border: '1px solid #ccc', cursor: 'pointer', backgroundColor: minuteInterval === min ? 'dodgerblue' : '#f0f0f0', color: minuteInterval === min ? '#fff' : '#666' }}>{min}분</button>
                    ))}
                    </div>
                </div>
              </div>

              {/* ✅ [수정] 모바일 화면 최적화를 위해 시간 선택을 세로로 배치 (Stack) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                    <span style={{fontSize:13, color:'#555', minWidth: 30}}>시작</span>
                    <TimeSelector value={editStartTime} onChange={setEditStartTime} interval={minuteInterval} />
                </div>
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                    <span style={{fontSize:13, color:'#555', minWidth: 30}}>종료</span>
                    <TimeSelector value={editEndTime} onChange={setEditEndTime} interval={minuteInterval} isLast={true} />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 8, fontWeight:'bold' }}>근무자 (대타)</label>
              
              <div 
                onClick={() => setIsEmpListOpen(!isEmpListOpen)}
                style={{ width: '100%', padding: 12, backgroundColor: '#fff', color: '#333', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>{selectedEmpName}</span>
                <span style={{ fontSize: 12, color: '#999' }}>{isEmpListOpen ? '▲' : '▼'}</span>
              </div>

              {isEmpListOpen && (
                <div style={{ border: '1px solid #ddd', borderRadius: 6, marginTop: 4, maxHeight: 150, overflowY: 'auto', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <div 
                        onClick={() => handleSelectEmployee(null)}
                        style={{ padding: '10px 12px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', color: '#999' }}
                    >
                        (미배정)
                    </div>
                    {employees.map(emp => (
                        <div 
                            key={emp.id} 
                            onClick={() => handleSelectEmployee(emp.id)}
                            style={{ 
                                padding: '10px 12px', 
                                borderBottom: '1px solid #f0f0f0', 
                                cursor: 'pointer', 
                                backgroundColor: editEmpId === emp.id ? '#e6f7ff' : '#fff',
                                color: editEmpId === emp.id ? 'dodgerblue' : '#333',
                                fontWeight: editEmpId === emp.id ? 'bold' : 'normal'
                            }}
                        >
                            {emp.name}
                        </div>
                    ))}
                </div>
              )}
            </div>

            {isSelectedEmpDaily && (
                <div style={{ marginBottom: 20, padding: 12, backgroundColor: '#fffbe6', borderRadius: 8, border: '1px solid #ffe58f' }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', color: '#d48806', marginBottom: 8 }}>💰 일당 (금액 수정)</label>
                    <input 
                        type="text" 
                        inputMode="numeric"
                        value={editDailyPay} 
                        onChange={handleDailyPayInput} 
                        placeholder="일당 입력"
                        style={{ width: '100%', padding: 10, border: '1px solid #ffe58f', borderRadius: 6, fontSize: 14, fontWeight: 'bold', color: '#333', boxSizing: 'border-box' }}
                    />
                    <div style={{fontSize: 11, color: '#d48806', marginTop: 4}}>* 이 날만 적용되는 금액입니다.</div>
                </div>
            )}

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

            {/* ✅ [수정] 하단 버튼 그룹: 취소/저장 가운데 정렬 + 삭제 버튼 좌측 배치 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
               <div>
                  {!isNew && <button onClick={handleDelete} style={{ width: '100%', padding: '12px', background: '#ffebeb', color: 'red', border: '1px solid #ffcccc', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontSize: 13 }}>삭제</button>}
               </div>
               <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setPopupOpen(false)} style={{ flex: 1, padding: '12px', background: '#f5f5f5', color: '#333', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight:'bold' }}>취소</button>
                  <button onClick={handleSave} style={{ flex: 1, padding: '12px', background: 'dodgerblue', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer', fontSize: 13 }}>저장</button>
               </div>
            </div>

          </div>
        </div>
      )}

      {/* 모바일 선택 팝업 */}
      {showMobileChoice && (
        <div style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(0,0,0,0.5)', zIndex: 9999,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center' 
        }} onClick={() => setShowMobileChoice(false)}>
            
            <div style={{ 
                width: '100%', background: '#fff', 
                borderTopLeftRadius: '16px', borderTopRightRadius: '16px', 
                padding: '24px 20px 40px 20px', 
                animation: 'slideUp 0.3s ease-out'
            }} onClick={e => e.stopPropagation()}>
                
                <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', textAlign: 'center', color: '#333', fontWeight: 'bold' }}>
                    스케줄표를 어떻게 할까요?
                </h3>
                
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => handleDownloadImage(false)} style={{ 
                        flex: 1, padding: '16px', borderRadius: '12px', border: '1px solid #ddd', 
                        background: '#fff', fontSize: '15px', fontWeight: 'bold', color: '#333',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8
                    }}>
                        <span style={{fontSize: '24px'}}>📥</span>
                        갤러리에 저장
                    </button>
                    
                    <button onClick={handleShareImage} style={{ 
                        flex: 1, padding: '16px', borderRadius: '12px', border: 'none', 
                        background: '#FEE500', fontSize: '15px', fontWeight: 'bold', color: '#000',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8
                    }}>
                        <span style={{fontSize: '24px'}}>💬</span>
                        카톡/공유하기
                    </button>
                </div>
            </div>
        </div>
      )}
      
      {/* ✅ [수정] 조건부 렌더링 밖으로 이동된 스타일 태그 */}
      <style jsx>{`
          @keyframes slideUp {
              from { transform: translateY(100%); }
              to { transform: translateY(0); }
          }
      `}</style>
    </div>
  );
}

const btnStyle = { padding: '6px 12px', background: '#fff', border: '1px solid #ccc', color: '#333', borderRadius: 6, cursor: 'pointer', fontSize: 13 };