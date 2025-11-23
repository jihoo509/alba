'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import ScheduleCalendar from '@/components/ScheduleCalendar';
import WeeklyScheduleManager from '@/components/WeeklyScheduleManager';
import type { Employee } from '@/app/dashboard/page'; // ✅ 타입 가져오기 위치 수정

type Props = {
  currentStoreId: string;
};

// 템플릿 타입 정의
export type ScheduleTemplate = {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  color: string;
};

// (SimpleEmployee 타입 삭제 -> Employee로 통일)

export default function TemplateSection({ currentStoreId }: Props) {
  const supabase = createSupabaseBrowserClient();
  const [employees, setEmployees] = useState<Employee[]>([]); // ✅ Employee 타입 사용

  // ✅ 직원 목록 불러오기 (모든 정보 포함)
  const fetchEmployees = useCallback(async () => {
    const { data, error } = await supabase
      .from('employees')
      .select('*') // ✅ id, name 뿐만 아니라 end_date 등 모든 정보 가져오기
      .eq('store_id', currentStoreId)
      .eq('is_active', true);

    if (!error && data) {
      // DB 데이터 타입 매핑 (필요시)
      const mappedData: Employee[] = data.map((row: any) => ({
        id: String(row.id),
        name: row.name,
        hourly_wage: row.hourly_wage,
        employment_type: row.employment_type,
        is_active: row.is_active,
        hire_date: row.hire_date,
        end_date: row.end_date, // 퇴사일 포함
        // 나머지 필드도 필요하면 매핑
      }));
      setEmployees(mappedData);
    }
  }, [currentStoreId, supabase]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 14, color: '#ccc', margin: 0 }}>
          월간 스케줄을 확인하고 관리합니다. 하단에서 <strong>[자동 생성 설정]</strong>을 할 수 있습니다.
        </p>
      </div>

      <div style={{ marginBottom: 40 }}>
        <ScheduleCalendar 
          currentStoreId={currentStoreId} 
          selectedTemplate={null} 
          employees={employees} 
        />
      </div>

      <WeeklyScheduleManager 
        currentStoreId={currentStoreId} 
        employees={employees} 
      />
    </div>
  );
}