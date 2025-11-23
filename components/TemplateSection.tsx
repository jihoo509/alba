'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import ScheduleCalendar from '@/components/ScheduleCalendar';
import WeeklyScheduleManager from '@/components/WeeklyScheduleManager';

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

export type SimpleEmployee = {
  id: string;
  name: string;
};

export default function TemplateSection({ currentStoreId }: Props) {
  const supabase = createSupabaseBrowserClient();
  const [employees, setEmployees] = useState<SimpleEmployee[]>([]);

  const fetchEmployees = useCallback(async () => {
    const { data, error } = await supabase
      .from('employees')
      .select('id, name')
      .eq('store_id', currentStoreId)
      .eq('is_active', true);

    if (!error && data) {
      setEmployees(data);
    }
  }, [currentStoreId, supabase]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return (
    <div>
      {/* 상단 안내 */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 14, color: '#ccc', margin: 0 }}>
          월간 스케줄을 확인하고 관리합니다. 하단에서 <strong>[자동 생성 설정]</strong>을 할 수 있습니다.
        </p>
      </div>

      {/* ✅ [수정] 2열 레이아웃 삭제 -> 달력 단독 배치 (Full Width) */}
      <div style={{ marginBottom: 40 }}>
        <ScheduleCalendar 
          currentStoreId={currentStoreId} 
          selectedTemplate={null} // 이제 개별 찍기 모드는 안 쓰므로 null
          employees={employees} 
        />
      </div>

      {/* 하단: 주간 스케줄 관리자 */}
      <WeeklyScheduleManager 
        currentStoreId={currentStoreId} 
        employees={employees} 
      />
    </div>
  );
}