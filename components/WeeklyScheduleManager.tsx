'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import type { SimpleEmployee, ScheduleTemplate } from './TemplateSection';

type Props = {
  currentStoreId: string;
  employees: SimpleEmployee[];
};

// 요일 배열 (월~일 순서로 배치하는 게 관리하기 편함)
const DAYS = [
  { num: 1, label: '월' },
  { num: 2, label: '화' },
  { num: 3, label: '수' },
  { num: 4, label: '목' },
  { num: 5, label: '금' },
  { num: 6, label: '토' },
  { num: 0, label: '일' },
];

export default function WeeklyScheduleManager({ currentStoreId, employees }: Props) {
  const supabase = createSupabaseBrowserClient();
  
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([]);
  // weeklyData[employeeId][dayOfWeek] = templateId
  const [weeklyMap, setWeeklyMap] = useState<Record<string, Record<number, string>>>({});
  const [loading, setLoading] = useState(false);

  // 1. 템플릿 목록 & 기존 설정 불러오기
  const loadData = useCallback(async () => {
    setLoading(true);
    
    // 템플릿 로딩
    const { data: tmplData } = await supabase
      .from('schedule_templates')
      .select('*')
      .eq('store_id', currentStoreId);
    if (tmplData) setTemplates(tmplData);

    // 주간 설정 로딩
    const { data: weeklyData } = await supabase
      .from('weekly_schedules')
      .select('*')
      .eq('store_id', currentStoreId);

    if (weeklyData) {
      const map: Record<string, Record<number, string>> = {};
      weeklyData.forEach((item) => {
        if (!map[item.employee_id]) map[item.employee_id] = {};
        map[item.employee_id][item.day_of_week] = item.template_id;
      });
      setWeeklyMap(map);
    }
    setLoading(false);
  }, [currentStoreId, supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 2. 설정 변경 시 바로 DB 저장 (자동 저장)
  const handleChange = async (empId: string, day: number, templateId: string) => {
    // 화면 먼저 업데이트 (Optimistic UI)
    setWeeklyMap((prev) => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        [day]: templateId
      }
    }));

    if (templateId === '') {
      // 선택 해제 시 삭제
      await supabase.from('weekly_schedules').delete()
        .match({ store_id: currentStoreId, employee_id: empId, day_of_week: day });
    } else {
      // 선택 시 저장 (Upsert)
      await supabase.from('weekly_schedules').upsert({
        store_id: currentStoreId,
        employee_id: empId,
        day_of_week: day,
        template_id: templateId
      }, { onConflict: 'store_id, employee_id, day_of_week' });
    }
  };

  // 3. 스케줄 자동 생성 (이번 달 달력에 덮어쓰기)
  const handleAutoGenerate = async () => {
    const year = new Date().getFullYear();
    const month = new Date().getMonth(); // 0~11 (현재 월)
    
    if (!confirm(`${year}년 ${month + 1}월 스케줄을 자동으로 생성하시겠습니까?\n(기존에 설정된 고정 스케줄이 해당 월 날짜에 일괄 등록됩니다)`)) return;

    setLoading(true);

    // 1일부터 말일까지 루프
    const lastDay = new Date(year, month + 1, 0).getDate();
    const newSchedules = [];

    for (let d = 1; d <= lastDay; d++) {
      const date = new Date(year, month, d);
      const dayOfWeek = date.getDay(); // 0(일) ~ 6(토)
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

      // 직원 루프
      for (const emp of employees) {
        const templateId = weeklyMap[emp.id]?.[dayOfWeek];
        if (templateId) {
          const tmpl = templates.find(t => t.id === templateId);
          if (tmpl) {
            newSchedules.push({
              store_id: currentStoreId,
              employee_id: emp.id,
              date: dateStr,
              start_time: tmpl.start_time,
              end_time: tmpl.end_time,
              color: tmpl.color
            });
          }
        }
      }
    }

    if (newSchedules.length === 0) {
      alert('설정된 주간 스케줄이 없습니다.');
      setLoading(false);
      return;
    }

    // 일괄 삽입
    const { error } = await supabase.from('schedules').insert(newSchedules);
    
    setLoading(false);
    if (error) alert('생성 실패: ' + error.message);
    else {
      alert('성공적으로 생성되었습니다! 달력을 확인하세요.');
      // 페이지 새로고침 혹은 부모 리로드 필요
      window.location.reload(); 
    }
  };

  return (
    <div style={{ marginTop: 32, borderTop: '1px solid #444', paddingTop: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 20, margin: 0 }}>📅 주간 고정 근무 설정</h3>
        <button onClick={handleAutoGenerate} style={{ padding: '10px 20px', background: 'dodgerblue', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 'bold', cursor: 'pointer' }}>
          이번 달 스케줄 자동 생성하기
        </button>
      </div>
      
      <p style={{ color: '#aaa', marginBottom: 20, fontSize: 14 }}>
        직원별로 요일마다 어떤 템플릿(근무조)으로 일하는지 설정해두면, 위 버튼 한 번으로 한 달 치 스케줄을 꽉 채워줍니다.
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 800 }}>
          <thead>
            <tr>
              <th style={thStyle}>직원명</th>
              {DAYS.map(day => (
                <th key={day.num} style={thStyle}>{day.label}요일</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id}>
                <td style={{ ...tdStyle, fontWeight: 'bold', color: '#ddd' }}>{emp.name}</td>
                {DAYS.map(day => {
                  const currentTmplId = weeklyMap[emp.id]?.[day.num] || '';
                  const currentTmpl = templates.find(t => t.id === currentTmplId);
                  
                  return (
                    <td key={day.num} style={{ ...tdStyle, backgroundColor: currentTmpl ? currentTmpl.color + '33' : 'transparent' }}>
                      <select
                        value={currentTmplId}
                        onChange={(e) => handleChange(emp.id, day.num, e.target.value)}
                        style={{
                          width: '100%', padding: 6, borderRadius: 4, border: '1px solid #555',
                          backgroundColor: '#222', color: '#fff', fontSize: 12
                        }}
                      >
                        <option value="">(휴무)</option>
                        {templates.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.start_time.slice(0,5)}~)
                          </option>
                        ))}
                      </select>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thStyle = { padding: '12px', border: '1px solid #444', background: '#333', color: '#fff', textAlign: 'center' as const };
const tdStyle = { padding: '8px', border: '1px solid #444', textAlign: 'center' as const };