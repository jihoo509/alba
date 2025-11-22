'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import ScheduleCalendar from '@/components/ScheduleCalendar';
import ScheduleTemplateManager from '@/components/ScheduleTemplateManager';

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

// 직원 타입 (간략화)
export type SimpleEmployee = {
  id: string;
  name: string;
};

export default function TemplateSection({ currentStoreId }: Props) {
  const supabase = createSupabaseBrowserClient();
  
  const [selectedTemplate, setSelectedTemplate] = useState<ScheduleTemplate | null>(null);
  const [employees, setEmployees] = useState<SimpleEmployee[]>([]);

  // ✅ 직원 목록 불러오기 (달력에 넘겨주기 위함)
  const fetchEmployees = useCallback(async () => {
    const { data, error } = await supabase
      .from('employees')
      .select('id, name')
      .eq('store_id', currentStoreId)
      .eq('is_active', true); // 퇴사자 제외

    if (!error && data) {
      setEmployees(data);
    }
  }, [currentStoreId, supabase]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 14, color: '#ccc', margin: 0 }}>
          {selectedTemplate ? (
            <span>
              현재 선택된 템플릿: 
              <strong style={{ color: selectedTemplate.color, marginLeft: 6 }}>
                {selectedTemplate.name} ({selectedTemplate.start_time}~{selectedTemplate.end_time})
              </strong>
              <span style={{ marginLeft: 8, color: '#888' }}>→ 달력 날짜를 클릭하세요! (중복 배정 가능)</span>
            </span>
          ) : (
            "오른쪽에서 템플릿을 선택하고, 달력 날짜를 클릭하여 배정하세요."
          )}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 20, alignItems: 'start' }}>
        
        {/* 1. 달력 (직원 목록 employees 전달!) */}
        <div>
          <ScheduleCalendar 
            currentStoreId={currentStoreId} 
            selectedTemplate={selectedTemplate}
            employees={employees} // 👈 추가됨
          />
        </div>

        {/* 2. 템플릿 관리 */}
        <div>
          <ScheduleTemplateManager 
            currentStoreId={currentStoreId} 
            selectedTemplate={selectedTemplate}
            onSelectTemplate={setSelectedTemplate}
          />
        </div>

      </div>
    </div>
  );
}