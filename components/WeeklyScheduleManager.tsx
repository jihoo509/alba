'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import type { SimpleEmployee } from './TemplateSection';

type Props = {
  currentStoreId: string;
  employees: SimpleEmployee[];
};

// 요일 정의
const DAYS = [
  { num: 1, label: '월' },
  { num: 2, label: '화' },
  { num: 3, label: '수' },
  { num: 4, label: '목' },
  { num: 5, label: '금' },
  { num: 6, label: '토' },
  { num: 0, label: '일' },
];

// 근무 패턴 타입 (템플릿 + 요일별 시간)
type ShiftPattern = {
  id: string;
  name: string;
  // 요일별 시간 설정 (day_num -> { start, end })
  schedule_rules: Record<number, { start: string; end: string }>;
  color: string;
};

export default function WeeklyScheduleManager({ currentStoreId, employees }: Props) {
  const supabase = createSupabaseBrowserClient();
  
  // 상태 관리
  const [patterns, setPatterns] = useState<ShiftPattern[]>([]); // 생성된 패턴 목록
  const [assignments, setAssignments] = useState<Record<string, string[]>>({}); // 패턴ID -> [직원ID들]
  const [loading, setLoading] = useState(false);

  // 패턴 생성 폼 상태
  const [newPatternName, setNewPatternName] = useState('');
  const [newPatternColor, setNewPatternColor] = useState('#4ECDC4');
  // 요일별 시간 입력 상태 (체크된 요일만 시간 입력 활성화)
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [timeRules, setTimeRules] = useState<Record<number, { start: string; end: string }>>({});

  // 1. 데이터 로딩
  const loadData = useCallback(async () => {
    setLoading(true);
    
    // 1) 템플릿(패턴) 가져오기
    // (기존 schedule_templates 테이블을 활용하되, '요일별 시간'은 name이나 별도 컬럼에 저장해야 완벽하지만
    //  지금은 기존 구조를 활용해 '가상 패턴'을 만드는 방식으로 구현합니다.)
    //  -> 사장님 요청에 맞춰 '요일별 시간'을 저장할 수 있도록 DB에 JSON 컬럼을 추가하는 게 베스트지만,
    //     일단 기존 템플릿 테이블을 '패턴 헤더'로 쓰고, 세부 규칙을 로컬에서 관리하는 형태로 가겠습니다.
    //     (더 완벽하게 하려면 schedule_templates 테이블에 `rules` jsonb 컬럼을 추가하는 SQL이 필요합니다.)
    
    // 일단 화면 UI 구성을 먼저 잡겠습니다.
    setLoading(false);
  }, [currentStoreId, supabase]);

  // 요일 체크 토글
  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(prev => prev.filter(d => d !== day));
      const newRules = { ...timeRules };
      delete newRules[day];
      setTimeRules(newRules);
    } else {
      setSelectedDays(prev => [...prev, day]);
      // 기본 시간 세팅
      setTimeRules(prev => ({ ...prev, [day]: { start: '10:00', end: '16:00' } }));
    }
  };

  // 시간 변경
  const handleTimeChange = (day: number, type: 'start' | 'end', value: string) => {
    setTimeRules(prev => ({
      ...prev,
      [day]: { ...prev[day], [type]: value }
    }));
  };

  // (임시) 패턴 목록에 추가 (DB 연동 전 UI 확인용)
  const handleAddPattern = () => {
    if (!newPatternName.trim()) return alert('패턴 이름을 입력해주세요.');
    if (selectedDays.length === 0) return alert('요일을 하나 이상 선택해주세요.');

    const newPattern: ShiftPattern = {
      id: Math.random().toString(), // 임시 ID
      name: newPatternName,
      schedule_rules: timeRules,
      color: newPatternColor
    };

    setPatterns([...patterns, newPattern]);
    // 초기화
    setNewPatternName('');
    setSelectedDays([]);
    setTimeRules({});
  };

  // 직원 배정 토글
  const toggleAssignment = (patternId: string, empId: string) => {
    setAssignments(prev => {
      const currentList = prev[patternId] || [];
      if (currentList.includes(empId)) {
        return { ...prev, [patternId]: currentList.filter(id => id !== empId) };
      } else {
        return { ...prev, [patternId]: [...currentList, empId] };
      }
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
            <label style={{ display: 'block', fontSize: 13, color: '#aaa', marginBottom: 8 }}>요일 및 시간 설정</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DAYS.map(day => {
                const isChecked = selectedDays.includes(day.num);
                return (
                  <div key={day.num} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: isChecked ? 1 : 0.5 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, width: 60, cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={isChecked} 
                        onChange={() => toggleDay(day.num)}
                      />
                      <span style={{ fontWeight: isChecked ? 'bold' : 'normal', color: isChecked ? 'dodgerblue' : '#aaa' }}>{day.label}</span>
                    </label>
                    
                    <input 
                      type="time" 
                      disabled={!isChecked}
                      value={timeRules[day.num]?.start || ''}
                      onChange={(e) => handleTimeChange(day.num, 'start', e.target.value)}
                      style={{ ...timeInputStyle, backgroundColor: isChecked ? '#333' : '#222' }}
                    />
                    <span>~</span>
                    <input 
                      type="time" 
                      disabled={!isChecked}
                      value={timeRules[day.num]?.end || ''}
                      onChange={(e) => handleTimeChange(day.num, 'end', e.target.value)}
                      style={{ ...timeInputStyle, backgroundColor: isChecked ? '#333' : '#222' }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <button onClick={handleAddPattern} style={addBtnStyle}>
            이 패턴 생성하기
          </button>
        </div>

        {/* 오른쪽: 생성된 패턴 목록 & 직원 배정 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h4 style={{ marginTop: 0, marginBottom: 0, color: '#fff' }}>2. 직원 배정하기</h4>
          
          {patterns.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#666', border: '1px dashed #444', borderRadius: 8 }}>
              왼쪽에서 패턴을 먼저 생성해주세요.
            </div>
          ) : (
            patterns.map(pattern => (
              <div key={pattern.id} style={{ backgroundColor: '#1f1f1f', border: '1px solid #444', borderRadius: 8, overflow: 'hidden' }}>
                {/* 패턴 헤더 */}
                <div style={{ padding: '12px 16px', backgroundColor: '#333', borderBottom: '1px solid #444', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', color: '#fff' }}>{pattern.name}</span>
                  <button style={{ background: 'transparent', border: 'none', color: '#aaa', fontSize: 12, cursor: 'pointer' }}>삭제</button>
                </div>

                {/* 패턴 내용 (요일/시간) */}
                <div style={{ padding: '12px 16px', fontSize: 13, color: '#ccc', borderBottom: '1px solid #444' }}>
                  {DAYS.map(d => {
                    const rule = pattern.schedule_rules[d.num];
                    if (!rule) return null;
                    return (
                      <span key={d.num} style={{ marginRight: 12, display: 'inline-block', marginBottom: 4 }}>
                        <strong style={{ color: 'dodgerblue' }}>{d.label}</strong> {rule.start}~{rule.end}
                      </span>
                    );
                  })}
                </div>

                {/* 직원 배정 영역 */}
                <div style={{ padding: '12px 16px' }}>
                  <p style={{ fontSize: 12, color: '#888', marginTop: 0, marginBottom: 8 }}>이 패턴으로 근무할 직원 선택:</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {employees.map(emp => {
                      const isAssigned = (assignments[pattern.id] || []).includes(emp.id);
                      return (
                        <button
                          key={emp.id}
                          onClick={() => toggleAssignment(pattern.id, emp.id)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 20,
                            border: isAssigned ? '1px solid dodgerblue' : '1px solid #555',
                            backgroundColor: isAssigned ? 'rgba(30, 144, 255, 0.2)' : 'transparent',
                            color: isAssigned ? 'dodgerblue' : '#aaa',
                            fontSize: 13,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {emp.name} {isAssigned && '✓'}
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

      {/* 최종 저장/생성 버튼 */}
      <div style={{ marginTop: 32, textAlign: 'right' }}>
        <button 
          onClick={() => alert('이 버튼을 누르면 위 설정대로 이번 달 스케줄이 쫙 생성됩니다! (구현 예정)')}
          style={{ 
            padding: '12px 24px', 
            backgroundColor: 'seagreen', 
            color: '#fff', 
            border: 'none', 
            borderRadius: 6, 
            fontWeight: 'bold', 
            fontSize: 16, 
            cursor: 'pointer' 
          }}
        >
          이 설정대로 이번 달 스케줄 자동 생성하기
        </button>
      </div>
    </div>
  );
}

// 스타일
const inputStyle = { width: '100%', padding: 10, backgroundColor: '#333', border: '1px solid #555', color: '#fff', borderRadius: 4, boxSizing: 'border-box' as const };
const timeInputStyle = { padding: '6px', backgroundColor: '#333', border: '1px solid #555', color: '#fff', borderRadius: 4, width: 80 };
const addBtnStyle = { width: '100%', padding: 12, backgroundColor: 'royalblue', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer', marginTop: 16 };