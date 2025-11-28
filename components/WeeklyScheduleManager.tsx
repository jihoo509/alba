'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import type { Employee } from '@/app/dashboard/page';
import TimeSelector from './TimeSelector';
import DateSelector from './DateSelector';

type Props = {
  currentStoreId: string;
  employees: Employee[];
};

const DAYS = [
  { num: 1, label: '월' },
  { num: 2, label: '화' },
  { num: 3, label: '수' },
  { num: 4, label: '목' },
  { num: 5, label: '금' },
  { num: 6, label: '토' },
  { num: 0, label: '일' },
];

type ShiftPattern = {
  id: string;
  name: string;
  weekly_rules: Record<number, { start: string; end: string }>;
  color: string;
};

export default function WeeklyScheduleManager({ currentStoreId, employees }: Props) {
  const supabase = createSupabaseBrowserClient();
  
  const [patterns, setPatterns] = useState<ShiftPattern[]>([]); 
  const [assignments, setAssignments] = useState<Record<string, string>>({}); 
  const [loading, setLoading] = useState(false);

  // 패턴 생성/수정 폼 상태
  const [newPatternName, setNewPatternName] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [timeRules, setTimeRules] = useState<Record<number, { start: string; end: string }>>({});
  const [lastInputTime, setLastInputTime] = useState({ start: '10:00', end: '16:00' });
  
  const [editingPatternId, setEditingPatternId] = useState<string | null>(null);
  
  const [minuteInterval, setMinuteInterval] = useState(30);
  const [selectedPatternIds, setSelectedPatternIds] = useState<string[]>([]);

  // 생성 기간 (오늘 ~ 말일)
  const today = new Date();
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const [genStartDate, setGenStartDate] = useState(formatDate(today));
  const [genEndDate, setGenEndDate] = useState(formatDate(endOfMonth));

  const handleStartDateChange = (dateVal: string) => {
    setGenStartDate(dateVal);
    if (dateVal) {
      const [y, m, d] = dateVal.split('-').map(Number);
      const lastDay = new Date(y, m, 0);
      setGenEndDate(formatDate(lastDay));
    }
  };

  const loadData = useCallback(async () => {
    if (!currentStoreId) return;
    setLoading(true);
    
    const { data: tmplData } = await supabase
      .from('schedule_templates')
      .select('*')
      .eq('store_id', currentStoreId)
      .not('weekly_rules', 'is', null)
      .order('created_at', { ascending: true });

    if (tmplData) {
      const loadedPatterns = tmplData as any[];
      setPatterns(loadedPatterns);
      if (selectedPatternIds.length === 0) {
        setSelectedPatternIds(loadedPatterns.map(p => p.id));
      }
    }

    const { data: assignData } = await supabase
      .from('weekly_schedules')
      .select('*')
      .eq('store_id', currentStoreId);

    if (assignData) {
      const map: Record<string, string> = {};
      assignData.forEach(row => {
        map[row.employee_id] = row.template_id;
      });
      setAssignments(map);
    }
    setLoading(false);
  }, [currentStoreId, supabase]); 

  useEffect(() => {
    loadData();
  }, [loadData]);

  const togglePatternSelection = (id: string) => {
    setSelectedPatternIds(prev => 
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(prev => prev.filter(d => d !== day));
      const newRules = { ...timeRules };
      delete newRules[day];
      setTimeRules(newRules);
    } else {
      setSelectedDays(prev => [...prev, day]);
      setTimeRules(prev => ({ ...prev, [day]: { start: lastInputTime.start, end: lastInputTime.end } }));
    }
  };

  const handleTimeChange = (day: number, type: 'start' | 'end', value: string) => {
    setTimeRules(prev => ({ ...prev, [day]: { ...prev[day], [type]: value } }));
    setLastInputTime(prev => ({ ...prev, [type]: value }));
  };

  const handleSavePattern = async () => {
    if (!newPatternName.trim()) return alert('패턴 이름을 입력해주세요.');
    if (selectedDays.length === 0) return alert('요일을 하나 이상 선택해주세요.');

    if (editingPatternId) {
      const { error } = await supabase.from('schedule_templates')
        .update({
          name: newPatternName,
          weekly_rules: timeRules,
        })
        .eq('id', editingPatternId);

      if (error) alert('수정 실패: ' + error.message);
      else {
        alert('패턴이 수정되었습니다.');
        resetForm();
        loadData();
      }
    } else {
      const { error } = await supabase.from('schedule_templates').insert({
        store_id: currentStoreId,
        name: newPatternName,
        weekly_rules: timeRules,
        start_time: '00:00', end_time: '00:00', color: '#4ECDC4'
      });

      if (error) alert('저장 실패: ' + error.message);
      else {
        alert('패턴이 생성되었습니다.');
        resetForm();
        loadData();
      }
    }
  };

  const handleEditPattern = (pattern: ShiftPattern) => {
    setEditingPatternId(pattern.id);
    setNewPatternName(pattern.name);
    setTimeRules(pattern.weekly_rules);
    setSelectedDays(Object.keys(pattern.weekly_rules).map(Number));
    
    const firstRule = Object.values(pattern.weekly_rules)[0];
    if (firstRule) {
        setLastInputTime({ start: firstRule.start, end: firstRule.end });
    }
  };

  const resetForm = () => {
    setEditingPatternId(null);
    setNewPatternName('');
    setSelectedDays([]);
    setTimeRules({});
  };

  const handleDeletePattern = async (id: string) => {
    if (!confirm('이 패턴을 삭제하시겠습니까?')) return;
    await supabase.from('schedule_templates').delete().eq('id', id);
    if (editingPatternId === id) resetForm(); 
    loadData();
  };

  const toggleAssignment = async (templateId: string, empId: string) => {
    const currentAssignedTemplate = assignments[empId];
    if (currentAssignedTemplate === templateId) {
      await supabase.from('weekly_schedules').delete().match({ employee_id: empId });
      setAssignments(prev => { const next = { ...prev }; delete next[empId]; return next; });
    } else {
      const { error } = await supabase.from('weekly_schedules').upsert({
        store_id: currentStoreId,
        employee_id: empId,
        template_id: templateId
      }, { onConflict: 'employee_id' });
      if (!error) setAssignments(prev => ({ ...prev, [empId]: templateId }));
    }
  };

  const handleAutoGenerate = async () => {
    if (!genStartDate || !genEndDate) return alert('시작일과 종료일을 설정해주세요.');
    if (genStartDate > genEndDate) return alert('시작일이 종료일보다 늦을 수 없습니다.');
    if (selectedPatternIds.length === 0) return alert('생성할 패턴을 하나 이상 체크해주세요.');
    
    if (!confirm(`${genStartDate} ~ ${genEndDate}\n기간의 스케줄을 자동 생성하시겠습니까?\n(체크된 패턴만 생성됩니다)`)) return;

    setLoading(true);
    const start = new Date(genStartDate);
    const end = new Date(genEndDate);
    const newSchedules = [];

    const { data: existingData } = await supabase
      .from('schedules')
      .select('date, employee_id')
      .eq('store_id', currentStoreId)
      .gte('date', genStartDate)
      .lte('date', genEndDate);

    const existingSet = new Set(existingData?.map(s => `${s.date}_${s.employee_id}`));

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = formatDate(d);
      const dayOfWeek = d.getDay();

      for (const [empId, templateId] of Object.entries(assignments)) {
        if (!selectedPatternIds.includes(templateId)) continue;
        if (existingSet.has(`${dateStr}_${empId}`)) continue;

        const employee = employees.find(e => e.id === empId);
        if (employee && employee.end_date && dateStr > employee.end_date) continue;

        const pattern = patterns.find(p => p.id === templateId);
        if (!pattern || !pattern.weekly_rules) continue;

        const rule = pattern.weekly_rules[dayOfWeek];
        if (rule) {
          newSchedules.push({
            store_id: currentStoreId,
            employee_id: empId,
            date: dateStr,
            start_time: rule.start,
            end_time: rule.end,
            color: pattern.color || '#4ECDC4'
          });
        }
      }
    }

    if (newSchedules.length === 0) {
      alert('생성할 스케줄이 없거나, 이미 등록되어 있습니다.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('schedules').insert(newSchedules);
    setLoading(false);
    if (error) alert('생성 실패: ' + error.message);
    else {
      alert(`${newSchedules.length}개의 스케줄이 생성되었습니다!`);
      window.location.reload();
    }
  };

  const calculateHours = (start: string, end: string) => {
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    let minutes = (eH * 60 + eM) - (sH * 60 + sM);
    if (minutes < 0) minutes += 24 * 60;
    return (minutes / 60).toFixed(1);
  };

  const groupRulesByTime = (rules: Record<number, { start: string; end: string }>) => {
    const groups: Record<string, number[]> = {};
    Object.entries(rules).forEach(([dayStr, time]) => {
      const day = Number(dayStr);
      const timeKey = `${time.start} ~ ${time.end}`;
      if (!groups[timeKey]) groups[timeKey] = [];
      groups[timeKey].push(day);
    });
    return Object.entries(groups).map(([timeRange, dayNums]) => {
      dayNums.sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b));
      const labels = dayNums.map(d => DAYS.find(day => day.num === d)?.label).join(', ');
      const [start, end] = timeRange.split(' ~ ');
      const duration = calculateHours(start, end);
      return { timeRange, labels, duration };
    });
  };

  return (
    <div style={{ marginTop: 32, borderTop: '1px solid #ddd', paddingTop: 24 }}>
      <h3 style={{ fontSize: 20, marginBottom: 16, color: '#fff' }}>🔄 주간 반복 스케줄 설정 (패턴 배정)</h3>
      <p style={{ color: '#ddd', marginBottom: 24, fontSize: 14 }}>
        1. 근무 패턴(요일별 시간)을 만들고 → 2. 해당 패턴으로 근무할 직원을 체크하세요.
      </p>

      {/* ✅ 레이아웃 개선: 왼쪽(고정), 오른쪽(그리드) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
        
        {/* 왼쪽: 패턴 생성기 (Sticky 적용 - 스크롤 따라옴) */}
        <div style={{ 
            flex: '0 0 400px', // 너비 400px 고정
            maxWidth: '100%',
            position: 'sticky', // ✅ 스크롤 시 화면에 고정
            top: 200,            // 상단 여백
            backgroundColor: '#ffffff',
            borderRadius: 12,
            padding: 24,
            border: '1px solid #ddd',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <h4 style={{ marginTop: 0, marginBottom: 12, color: '#333' }}>
            {editingPatternId ? '🛠️ 패턴 수정하기' : '1. 근무 패턴 만들기'}
          </h4>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 4 }}>패턴 이름</label>
            <input 
              type="text" 
              placeholder="예: 평일 오픈조" 
              value={newPatternName} 
              onChange={(e) => setNewPatternName(e.target.value)} 
              style={inputStyle} 
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: 13, color: '#666' }}>요일 및 시간 설정</label>
              <div style={{ display: 'flex', gap: 4 }}>
                {[30, 10, 5].map((min) => (
                  <button key={min} onClick={() => setMinuteInterval(min)} style={{ padding: '2px 8px', fontSize: 11, borderRadius: 4, border: '1px solid #ccc', cursor: 'pointer', backgroundColor: minuteInterval === min ? 'dodgerblue' : '#f0f0f0', color: minuteInterval === min ? '#fff' : '#666' }}>{min}분</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DAYS.map(day => {
                const isChecked = selectedDays.includes(day.num);
                return (
                  <div key={day.num} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: isChecked ? 1 : 0.6 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, width: 50, cursor: 'pointer' }}>
                      <input type="checkbox" checked={isChecked} onChange={() => toggleDay(day.num)} style={{ accentColor: 'dodgerblue' }} />
                      <span style={{ color: isChecked ? 'dodgerblue' : '#888', fontWeight: isChecked ? 'bold' : 'normal' }}>{day.label}</span>
                    </label>
                    <TimeSelector value={timeRules[day.num]?.start || '10:00'} onChange={(val) => handleTimeChange(day.num, 'start', val)} interval={minuteInterval} />
                    <span style={{color: '#888'}}>~</span>
                    <TimeSelector value={timeRules[day.num]?.end || '16:00'} onChange={(val) => handleTimeChange(day.num, 'end', val)} interval={minuteInterval} />
                  </div>
                );
              })}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleSavePattern} style={addBtnStyle}>
              {editingPatternId ? '수정 완료' : '이 패턴 생성하기'}
            </button>
            {editingPatternId && (
              <button onClick={resetForm} style={{ ...addBtnStyle, backgroundColor: '#999' }}>
                취소
              </button>
            )}
          </div>
        </div>

        {/* 오른쪽: 직원 배정 (그리드 레이아웃 적용) */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          <h4 style={{ marginTop: 0, marginBottom: 12, color: '#fff' }}>2. 직원 배정하기</h4>
          
          {patterns.length === 0 ? (
             <div style={{ padding: 40, textAlign: 'center', color: '#ccc', border: '1px dashed #666', borderRadius: 8 }}>
                생성된 패턴이 없습니다. 왼쪽에서 패턴을 만들어주세요.
             </div>
          ) : (
             // ✅ 그리드 레이아웃: 카드가 자동으로 채워짐
             <div style={{ 
                 display: 'grid', 
                 gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', // 최소 320px, 공간 남으면 늘어남
                 gap: 16 
             }}>
                {patterns.map(pattern => {
                  const isSelected = selectedPatternIds.includes(pattern.id);
                  const isEditing = editingPatternId === pattern.id;

                  return (
                    <div key={pattern.id} style={{ 
                      backgroundColor: '#ffffff', 
                      // 수정 중이면 파란색 진한 테두리
                      border: isEditing ? '2px solid dodgerblue' : `1px solid ${isSelected ? 'dodgerblue' : '#ddd'}`, 
                      borderRadius: 12, 
                      overflow: 'hidden', 
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }}>
                      {/* 패턴 헤더 */}
                      <div style={{ padding: '10px 16px', backgroundColor: '#f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#333', fontWeight: 'bold' }}>
                          <input type="checkbox" checked={isSelected} onChange={() => togglePatternSelection(pattern.id)} style={{ width: 16, height: 16, accentColor: 'dodgerblue' }} />
                          {pattern.name}
                        </label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => handleEditPattern(pattern)} style={{ background: 'none', border: 'none', color: 'dodgerblue', cursor: 'pointer', fontWeight: 'bold', fontSize: 12 }}>수정</button>
                          <button onClick={() => handleDeletePattern(pattern.id)} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 12 }}>삭제</button>
                        </div>
                      </div>

                      {/* 시간 정보 */}
                      <div style={{ padding: '12px 16px', fontSize: 13, color: '#555', borderBottom: '1px solid #f0f0f0', backgroundColor: '#fff' }}>
                        {groupRulesByTime(pattern.weekly_rules).map((group, idx) => (
                          <div key={idx} style={{ marginBottom: 4 }}>
                            <strong style={{ color: 'dodgerblue', marginRight: 6 }}>{group.labels}</strong> 
                            {group.timeRange}
                            <span style={{ marginLeft: 8, color: '#999', fontSize: 12 }}>({group.duration}시간)</span>
                          </div>
                        ))}
                      </div>
                      
                      {/* 직원 배정 버튼들 */}
                      <div style={{ padding: '12px 16px', opacity: isSelected ? 1 : 0.5, pointerEvents: isSelected ? 'auto' : 'none', backgroundColor: '#fff' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {employees.map(emp => {
                            const assignedTmplId = assignments[emp.id];
                            const isAssignedHere = assignedTmplId === pattern.id;
                            const isAssignedElsewhere = assignedTmplId && !isAssignedHere;
                            return (
                              <button 
                                key={emp.id} 
                                onClick={() => toggleAssignment(pattern.id, emp.id)} 
                                disabled={!!isAssignedElsewhere} 
                                style={{ 
                                    padding: '6px 12px', 
                                    borderRadius: 20, 
                                    border: isAssignedHere ? '1px solid dodgerblue' : '1px solid #ddd', 
                                    backgroundColor: isAssignedHere ? '#e6f7ff' : '#fff', // 선택 시 연한 파랑 배경
                                    color: isAssignedHere ? 'dodgerblue' : isAssignedElsewhere ? '#ccc' : '#555', 
                                    cursor: isAssignedElsewhere ? 'not-allowed' : 'pointer', 
                                    textDecoration: isAssignedElsewhere ? 'line-through' : 'none',
                                    fontSize: 12,
                                    fontWeight: isAssignedHere ? 'bold' : 'normal'
                                }}
                              >
                                {emp.name} {isAssignedHere && '✓'}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
             </div>
          )}
        </div>
      </div>

      {/* 스마트 날짜 선택기 (흰색 카드) */}
      <div style={{ marginTop: 40, padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, backgroundColor: '#fff', borderRadius: 12, border: '1px solid #ddd', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ color: '#333', fontSize: 14, fontWeight: 'bold' }}>생성 기간:</label>
          <DateSelector value={genStartDate} onChange={handleStartDateChange} />
          <span style={{ color: '#888' }}>~</span>
          <DateSelector value={genEndDate} onChange={setGenEndDate} />
        </div>
        <button onClick={handleAutoGenerate} style={{ padding: '10px 24px', backgroundColor: '#27ae60', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 'bold', fontSize: 15, cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>스케줄 자동 생성</button>
      </div>
      <p style={{ textAlign: 'right', fontSize: 13, color: '#bbb', marginTop: 8 }}>
        * 직원의 퇴사일 이후 날짜는 자동으로 제외됩니다. <br/>
        * 체크된 패턴에 대해서만 스케줄이 생성됩니다.
      </p>
    </div>
  );
}

const inputStyle = { width: '100%', padding: 10, backgroundColor: '#fff', border: '1px solid #ccc', color: '#333', borderRadius: 4, boxSizing: 'border-box' as const, outline: 'none' };
const addBtnStyle = { flex: 1, padding: 12, backgroundColor: 'dodgerblue', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer', marginTop: 16, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' };