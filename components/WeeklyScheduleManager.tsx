'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

  // 패턴 생성 폼 상태
  const [newPatternName, setNewPatternName] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [timeRules, setTimeRules] = useState<Record<number, { start: string; end: string }>>({});
  const [lastInputTime, setLastInputTime] = useState({ start: '10:00', end: '16:00' });
  
  // ✅ [복구] 시간 간격 설정 상태
  const [minuteInterval, setMinuteInterval] = useState(30);

  // ✅ 패턴 선택 상태 (자동 생성 필터용)
  const [selectedPatternIds, setSelectedPatternIds] = useState<string[]>([]);

  // 생성 기간 (오늘 ~ 말일)
  const today = new Date();
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const formatDate = (d: Date) => d.toISOString().split('T')[0]; // 헬퍼 함수
  
  const [genStartDate, setGenStartDate] = useState(formatDate(today));
  const [genEndDate, setGenEndDate] = useState(formatDate(endOfMonth));

  // 데이터 불러오기
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
      // 불러온 패턴들은 기본적으로 모두 '선택됨' 상태로
      setSelectedPatternIds(loadedPatterns.map(p => p.id));
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

  // 패턴 선택 토글
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

  const handleAddPattern = async () => {
    if (!newPatternName.trim()) return alert('패턴 이름을 입력해주세요.');
    if (selectedDays.length === 0) return alert('요일을 하나 이상 선택해주세요.');

    const { error } = await supabase.from('schedule_templates').insert({
      store_id: currentStoreId,
      name: newPatternName,
      weekly_rules: timeRules,
      start_time: '00:00', end_time: '00:00', color: '#4ECDC4'
    });

    if (error) alert('저장 실패: ' + error.message);
    else {
      alert('패턴이 생성되었습니다.');
      setNewPatternName('');
      setSelectedDays([]);
      setTimeRules({});
      loadData();
    }
  };

  const handleDeletePattern = async (id: string) => {
    if (!confirm('이 패턴을 삭제하시겠습니까?')) return;
    await supabase.from('schedule_templates').delete().eq('id', id);
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
      const dateStr = d.toISOString().split('T')[0];
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
    <div style={{ marginTop: 32, borderTop: '1px solid #444', paddingTop: 24 }}>
      <h3 style={{ fontSize: 20, marginBottom: 16 }}>🔄 주간 반복 스케줄 설정 (패턴 배정)</h3>
      <p style={{ color: '#aaa', marginBottom: 24, fontSize: 14 }}>
        1. 근무 패턴(요일별 시간)을 만들고 → 2. 해당 패턴으로 근무할 직원을 체크하세요.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        
        {/* 왼쪽: 패턴 생성기 */}
        <div style={{ backgroundColor: '#222', padding: 20, borderRadius: 8, border: '1px solid #444' }}>
          <h4 style={{ marginTop: 0, marginBottom: 12, color: '#fff' }}>1. 근무 패턴 만들기</h4>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#aaa', marginBottom: 4 }}>패턴 이름</label>
            <input type="text" placeholder="예: 평일 오픈조" value={newPatternName} onChange={(e) => setNewPatternName(e.target.value)} style={inputStyle} />
          </div>

          <div style={{ marginBottom: 16 }}>
            {/* ✅ [복구] 시간 간격 선택 버튼 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: 13, color: '#aaa' }}>요일 및 시간 설정</label>
              <div style={{ display: 'flex', gap: 4 }}>
                {[30, 10, 5].map((min) => (
                  <button key={min} onClick={() => setMinuteInterval(min)} style={{ padding: '2px 8px', fontSize: 11, borderRadius: 4, border: '1px solid #555', cursor: 'pointer', backgroundColor: minuteInterval === min ? 'dodgerblue' : '#333', color: minuteInterval === min ? '#fff' : '#aaa' }}>{min}분</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DAYS.map(day => {
                const isChecked = selectedDays.includes(day.num);
                return (
                  <div key={day.num} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: isChecked ? 1 : 0.4 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, width: 50, cursor: 'pointer' }}>
                      <input type="checkbox" checked={isChecked} onChange={() => toggleDay(day.num)} />
                      <span style={{ color: isChecked ? 'dodgerblue' : '#aaa' }}>{day.label}</span>
                    </label>
                    {/* ✅ [연결] TimeSelector에 interval 전달 */}
                    <TimeSelector value={timeRules[day.num]?.start || '10:00'} onChange={(val) => handleTimeChange(day.num, 'start', val)} interval={minuteInterval} />
                    <span>~</span>
                    <TimeSelector value={timeRules[day.num]?.end || '16:00'} onChange={(val) => handleTimeChange(day.num, 'end', val)} interval={minuteInterval} />
                  </div>
                );
              })}
            </div>
          </div>
          <button onClick={handleAddPattern} style={addBtnStyle}>이 패턴 생성하기</button>
        </div>

        {/* 오른쪽: 직원 배정 (패턴 체크박스 포함) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h4 style={{ marginTop: 0, marginBottom: 0, color: '#fff' }}>2. 직원 배정하기</h4>
          {patterns.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: '#666', border: '1px dashed #444', borderRadius: 8 }}>생성된 패턴이 없습니다.</div> : 
            patterns.map(pattern => {
              const isSelected = selectedPatternIds.includes(pattern.id);
              return (
                <div key={pattern.id} style={{ backgroundColor: '#1f1f1f', border: `1px solid ${isSelected ? 'dodgerblue' : '#444'}`, borderRadius: 8, overflow: 'hidden', transition: 'border 0.2s' }}>
                  {/* ✅ 패턴 헤더 + 체크박스 + 안내 문구 */}
                  <div style={{ padding: '10px 16px', backgroundColor: '#333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#fff', fontWeight: 'bold' }}>
                      <input type="checkbox" checked={isSelected} onChange={() => togglePatternSelection(pattern.id)} style={{ width: 16, height: 16, accentColor: 'dodgerblue' }} />
                      {pattern.name}
                      <span style={{ fontSize: 12, color: '#aaa', fontWeight: 'normal', marginLeft: 4 }}>(자동 생성 포함)</span>
                    </label>
                    <button onClick={() => handleDeletePattern(pattern.id)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }}>삭제</button>
                  </div>

                  <div style={{ padding: '12px 16px', fontSize: 13, color: '#ccc', borderBottom: '1px solid #444' }}>
                    {groupRulesByTime(pattern.weekly_rules).map((group, idx) => (
                      <div key={idx} style={{ marginBottom: 4 }}>
                        <strong style={{ color: 'dodgerblue', marginRight: 6 }}>{group.labels}</strong> 
                        {group.timeRange}
                        <span style={{ marginLeft: 8, color: '#777', fontSize: 12 }}>({group.duration}시간)</span>
                      </div>
                    ))}
                  </div>
                  
                  <div style={{ padding: '12px 16px', opacity: isSelected ? 1 : 0.5, pointerEvents: isSelected ? 'auto' : 'none' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {employees.map(emp => {
                        const assignedTmplId = assignments[emp.id];
                        const isAssignedHere = assignedTmplId === pattern.id;
                        const isAssignedElsewhere = assignedTmplId && !isAssignedHere;
                        return (
                          <button key={emp.id} onClick={() => toggleAssignment(pattern.id, emp.id)} disabled={!!isAssignedElsewhere} style={{ padding: '6px 12px', borderRadius: 20, border: isAssignedHere ? '1px solid dodgerblue' : '1px solid #555', backgroundColor: isAssignedHere ? 'rgba(30, 144, 255, 0.2)' : 'transparent', color: isAssignedHere ? 'dodgerblue' : isAssignedElsewhere ? '#444' : '#aaa', cursor: isAssignedElsewhere ? 'not-allowed' : 'pointer', textDecoration: isAssignedElsewhere ? 'line-through' : 'none' }}>{emp.name} {isAssignedHere && '✓'}</button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          }
        </div>
      </div>

      {/* ✅ [복구] 날짜 선택기 사용 */}
      <div style={{ marginTop: 40, padding: 20, backgroundColor: '#222', borderRadius: 8, border: '1px solid #444', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ color: '#ddd', fontSize: 14, fontWeight: 'bold' }}>생성 기간:</label>
          <DateSelector value={genStartDate} onChange={setGenStartDate} />
          <span style={{ color: '#aaa' }}>~</span>
          <DateSelector value={genEndDate} onChange={setGenEndDate} />
        </div>
        <button onClick={handleAutoGenerate} style={{ padding: '10px 24px', backgroundColor: 'seagreen', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 'bold', fontSize: 15, cursor: 'pointer' }}>스케줄 자동 생성</button>
      </div>
      <p style={{ textAlign: 'right', fontSize: 13, color: '#888', marginTop: 8 }}>
        * 직원의 퇴사일 이후 날짜는 자동으로 제외됩니다. <br/>
        * 체크된 패턴에 대해서만 스케줄이 생성됩니다.
      </p>
    </div>
  );
}

const inputStyle = { width: '100%', padding: 10, backgroundColor: '#333', border: '1px solid #555', color: '#fff', borderRadius: 4, boxSizing: 'border-box' as const };
const addBtnStyle = { width: '100%', padding: 12, backgroundColor: 'royalblue', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer', marginTop: 16 };