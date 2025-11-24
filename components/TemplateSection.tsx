'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import ScheduleCalendar from '@/components/ScheduleCalendar';
import WeeklyScheduleManager from '@/components/WeeklyScheduleManager';
import type { Employee } from '@/app/dashboard/page';

type Props = {
  currentStoreId: string;
};

export type ScheduleTemplate = {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  color: string;
};

export default function TemplateSection({ currentStoreId }: Props) {
  const supabase = createSupabaseBrowserClient();
  const [employees, setEmployees] = useState<Employee[]>([]);

  const fetchEmployees = useCallback(async () => {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('store_id', currentStoreId)
      .eq('is_active', true);

    if (!error && data) {
      // 데이터 매핑 (필요시)
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
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 14, color: '#ccc', margin: 0 }}>
          월간 스케줄을 확인하고 관리합니다.
        </p>
      </div>

      {/* ✅ [위치 변경] 주간 스케줄 설정 (위로 올림) */}
      <div style={{ marginBottom: 40 }}>
        <WeeklyScheduleManager 
          currentStoreId={currentStoreId} 
          employees={employees} 
        />
      </div>

      {/* ✅ [위치 변경] 캘린더 (아래로 내림) */}
      <ScheduleCalendar 
        currentStoreId={currentStoreId} 
        selectedTemplate={null} 
        employees={employees} 
      />
    </div>
  );
}