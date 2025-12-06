'use client';

import React from 'react';
import ScheduleCalendar from '@/components/ScheduleCalendar';
import WeeklyScheduleManager from '@/components/WeeklyScheduleManager';
import type { Employee } from '@/app/dashboard/page';

type Props = {
  currentStoreId: string;
  employees: Employee[]; // ✅ 부모에게서 완벽한 직원 데이터를 받음
};

// 다른 컴포넌트에서 쓸 수도 있으므로 타입 정의 유지
export type ScheduleTemplate = {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  color: string;
};

export default function TemplateSection({ currentStoreId, employees }: Props) {
  // 💡 수정됨: 여기서 별도로 데이터를 로딩(fetch)하지 않고, 
  // DashboardPage에서 이미 잘 불러온 employees 데이터를 그대로 사용합니다.
  // 이렇게 하면 'pay_type' 정보가 중간에 사라지지 않습니다.

  return (
    <div>
      {/* 🟢 1. 스케줄 캘린더 */}
      <ScheduleCalendar 
        currentStoreId={currentStoreId} 
        selectedTemplate={null} 
        employees={employees} // 부모가 준 데이터를 그대로 전달
      />

      {/* 🔵 2. 주간 스케줄 설정(패턴 배정) */}
      <div style={{ marginTop: 40 }}>
        <WeeklyScheduleManager 
          currentStoreId={currentStoreId} 
          employees={employees} // 부모가 준 데이터를 그대로 전달
        />
      </div>
    </div>
  );
}