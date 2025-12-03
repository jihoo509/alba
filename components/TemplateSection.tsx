'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import ScheduleCalendar from '@/components/ScheduleCalendar';
import WeeklyScheduleManager from '@/components/WeeklyScheduleManager';
import type { Employee } from '@/app/dashboard/page';

type Props = {
  currentStoreId: string;
  // ✅ [추가] 부모(Page)로부터 급여 체계 정보를 받습니다.
  wageSystem: 'hourly' | 'daily';
};

// 다른 컴포넌트에서 쓸 수도 있으므로 타입 정의 유지
export type ScheduleTemplate = {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  color: string;
  // ✅ [추가] 템플릿에도 일당 정보가 들어갈 수 있음
  daily_wage?: number; 
};

export default function TemplateSection({ currentStoreId, wageSystem }: Props) {
  const supabase = createSupabaseBrowserClient();
  const [employees, setEmployees] = useState<Employee[]>([]);

  // 직원 데이터 불러오는 로직 (유지)
  const fetchEmployees = useCallback(async () => {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('store_id', currentStoreId)
      .eq('is_active', true);

    if (!error && data) {
      const mappedData: Employee[] = data.map((row: any) => ({
        id: String(row.id),
        name: row.name,
        hourly_wage: row.hourly_wage,
        employment_type: row.employment_type,
        is_active: row.is_active,
        hire_date: row.hire_date,
        end_date: row.end_date,
        phone_number: row.phone_number,
        birth_date: row.birth_date,
        bank_name: row.bank_name,
        account_number: row.account_number,
      }));
      setEmployees(mappedData);
    }
  }, [currentStoreId, supabase]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return (
    <div>
      {/* 🟢 1. 스케줄 캘린더 */}
      <ScheduleCalendar 
        currentStoreId={currentStoreId} 
        selectedTemplate={null} 
        employees={employees} 
        wageSystem={wageSystem} // ✅ [전달] 일당제 여부를 넘겨줍니다
      />

      {/* 🔵 2. 주간 스케줄 설정(패턴 배정) */}
      <div style={{ marginTop: 40 }}>
        <WeeklyScheduleManager 
          currentStoreId={currentStoreId} 
          employees={employees} 
          wageSystem={wageSystem} // ✅ [전달] 일당제 여부를 넘겨줍니다
        />
      </div>
    </div>
  );
}