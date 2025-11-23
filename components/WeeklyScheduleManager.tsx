'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import type { SimpleEmployee } from './TemplateSection';

type Props = {
  currentStoreId: string;
  employees: SimpleEmployee[];
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

// 근무 패턴 타입
type ShiftPattern = {
  id: string;
  name: string;
  // ✅ DB 컬럼명과 일치시킴 (weekly_rules)
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

  // 시간 간격 설정 (기본 30분)
  const [minuteInterval, setMinuteInterval] = useState(30);

  // 간격에 따라 시간 목록 동적 생성
  const timeOptions = useMemo(() => {
    const options = [];
    for (let i = 0; i < 24 * 60; i += minuteInterval) {
      const h = Math.floor(i / 60);
      const m = i % 60;
      const label = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      options.push(label);
    }
    return options;
  }, [minuteInterval]);

  // 1. 데이터 불러오기
  const loadData = useCallback(async () => {
    if (!currentStoreId) return;
    setLoading(true);
    
    // 패턴 목록 로딩
    const { data: tmplData } = await supabase
      .from('schedule_templates')
      .select('*')
      .eq('store_id', currentStoreId)
      .not('weekly_rules', 'is', null)
      .order('created_at', { ascending: true });

    if (tmplData) setPatterns(tmplData as any[]);

    // 직원 배정 로딩
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

  // 요일 체크 토글
  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(prev => prev.filter(d => d !== day));
      const newRules = { ...timeRules };
      delete newRules[day];
      setTimeRules(newRules);
    } else {
      setSelectedDays(prev => [...prev, day]);
      setTimeRules(prev => ({ 
        ...prev, 
        [day]: { start: lastInputTime.start, end: lastInputTime.end } 
      }));
    }
  };

  // 시간 변경
  const handleTimeChange = (day: number, type: 'start' | 'end', value: string) => {
    setTimeRules(prev => ({
      ...prev,
      [day]: { ...prev[day], [type]: value }
    }));
    setLastInputTime(prev => ({ ...prev, [type]: value }));
  };

  // 패턴 생성
  const handleAddPattern = async () => {
    if (!newPatternName.trim()) return alert('패턴 이름을 입력해주세요.');
    if (selectedDays.length === 0) return alert('요일을 하나 이상 선택해주세요.');

    const { error } = await supabase.from('schedule_templates').insert({
      store_id: currentStoreId,
      name: newPatternName,
      weekly_rules: timeRules,
      start_time: '00:00',
      end_time: '00:00',
      color: '#4ECDC4'
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

  // 패턴 삭제
  const handleDeletePattern = async (id: string) => {
    if (!confirm('이 패턴을 삭제하시겠습니까?')) return;
    await supabase.from('schedule_templates').delete().eq('id', id);
    loadData();
  };

  // 직원 배정
  const toggleAssignment = async (templateId: string, empId: string) => {
    const currentAssignedTemplate = assignments[empId];

    if (currentAssignedTemplate === templateId) {
      await supabase.from('weekly_schedules').delete().match({ employee_id: empId });
      setAssignments(prev => {
        const next = { ...prev };
        delete next[empId];
        return next;
      });
    } else {
      const { error } = await supabase.from('weekly_schedules').upsert({
        store_id: currentStoreId,
        employee_id: empId,
        template_id: templateId
      }, { onConflict: 'employee_id' });

      if (!error) {
        setAssignments(prev => ({ ...prev, [empId]: templateId }));
      }
    }
  };

  // 스케줄 자동 생성
  const handleAutoGenerate = async () => {
    const year = new Date().getFullYear();
    const month = new Date().getMonth();
    
    if (!confirm(`${year}년 ${month + 1}월 스케줄을 자동 생성하시겠습니까?\n(설정된 패턴대로 달력에 채워집니다)`)) return;

    setLoading(true);
    const lastDay = new Date(year, month + 1, 0).getDate();
    const newSchedules = [];

    for (const [empId, templateId] of Object.entries(assignments)) {
      const pattern = patterns.find(p => p.id === templateId);
      if (!pattern || !pattern.weekly_rules) continue;

      for (let d = 1; d <= lastDay; d++) {
        const date = new Date(year, month, d);
        const dayOfWeek = date.getDay();
        const rule = pattern.weekly_rules[dayOfWeek];

        if (rule) {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
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
      alert('배정된 직원이 없거나 패턴이 없습니다.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('schedules').insert(newSchedules);
    setLoading(false);
    
    if (error) alert('생성 실패: ' + error.message);
    else {
      alert('성공적으로 생성되었습니다! 달력을 확인하세요.');
      window.location.reload();
    }
  };

  // 요일 그룹화
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
      return { timeRange, labels };
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
            <input 
              type="text" 
              placeholder="예: 평일 오픈조, 주말 마감조" 
              value={newPatternName}
              onChange={(e) => setNewPatternName(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: 13, color: '#aaa' }}>요일 및 시간 설정</label>
              <div style={{ display: 'flex', gap: 4 }}>
                {[30, 10, 5].map((min) => (
                  <button
                    key={min}
                    onClick={() => setMinuteInterval(min)}
                    style={{
                      padding: '2px 8px',
                      fontSize: 11,
                      borderRadius: 4,
                      border: '1px solid #555',
                      cursor: 'pointer',
                      backgroundColor: minuteInterval === min ? 'dodgerblue' : '#333',
                      color: minuteInterval === min ? '#fff' : '#aaa',
                    }}
                  >
                    {min}분
                  </button>
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
                    
                    <select 
                      disabled={!isChecked}
                      value={timeRules[day.num]?.start || ''}
                      onChange={(e) => handleTimeChange(day.num, 'start', e.target.value)}
                      style={{ ...timeSelectStyle, backgroundColor: isChecked ? '#333' : '#222' }}
                    >
                      {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <span>~</span>
                    <select 
                      disabled={!isChecked}
                      value={timeRules[day.num]?.end || ''}
                      onChange={(e) => handleTimeChange(day.num, 'end', e.target.value)}
                      style={{ ...timeSelectStyle, backgroundColor: isChecked ? '#333' : '#222' }}
                    >
                      {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>

          <button onClick={handleAddPattern} style={addBtnStyle}>
            이 패턴 생성하기
          </button>
        </div>

        {/* 오른쪽: 직원 배정 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h4 style={{ marginTop: 0, marginBottom: 0, color: '#fff' }}>2. 직원 배정하기</h4>
          
          {patterns.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#666', border: '1px dashed #444', borderRadius: 8 }}>
              생성된 패턴이 없습니다.
            </div>
          ) : (
            patterns.map(pattern => (
              <div key={pattern.id} style={{ backgroundColor: '#1f1f1f', border: '1px solid #444', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ padding: '10px 16px', backgroundColor: '#333', display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ color: '#fff' }}>{pattern.name}</strong>
                  <button onClick={() => handleDeletePattern(pattern.id)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }}>삭제</button>
                </div>

                {/* ✅ [수정됨] schedule_rules -> weekly_rules로 변경 완료 */}
                <div style={{ padding: '12px 16px', fontSize: 13, color: '#ccc', borderBottom: '1px solid #444' }}>
                  {groupRulesByTime(pattern.weekly_rules).map((group, idx) => (
                    <div key={idx} style={{ marginBottom: 4 }}>
                      <strong style={{ color: 'dodgerblue', marginRight: 6 }}>{group.labels}</strong> 
                      {group.timeRange}
                    </div>
                  ))}
                </div>

                <div style={{ padding: '12px 16px' }}>
                  <p style={{ fontSize: 12, color: '#888', margin: '0 0 8px 0' }}>이 패턴으로 근무할 직원 선택:</p>
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
                            border: isAssignedHere ? '1px solid dodgerblue' : '1px solid #555',
                            backgroundColor: isAssignedHere ? 'rgba(30, 144, 255, 0.2)' : 'transparent',
                            color: isAssignedHere ? 'dodgerblue' : isAssignedElsewhere ? '#444' : '#aaa',
                            cursor: isAssignedElsewhere ? 'not-allowed' : 'pointer',
                            textDecoration: isAssignedElsewhere ? 'line-through' : 'none'
                          }}
                        >
                          {emp.name} {isAssignedHere && '✓'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ marginTop: 32, textAlign: 'right' }}>
        <button 
          onClick={handleAutoGenerate}
          style={{ 
            padding: '12px 24px', backgroundColor: 'seagreen', color: '#fff', 
            border: 'none', borderRadius: 6, fontWeight: 'bold', fontSize: 16, cursor: 'pointer' 
          }}
        >
          이 설정대로 이번 달 스케줄 자동 생성하기
        </button>
      </div>
    </div>
  );
}

const inputStyle = { width: '100%', padding: 10, backgroundColor: '#333', border: '1px solid #555', color: '#fff', borderRadius: 4, boxSizing: 'border-box' as const };
const timeSelectStyle = { padding: '6px', borderRadius: 4, border: '1px solid #555', color: '#fff', width: 120 }; 
const addBtnStyle = { width: '100%', padding: 12, backgroundColor: 'royalblue', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer', marginTop: 16 };