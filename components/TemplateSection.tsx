'use client';

import React from 'react';
import ScheduleCalendar from '@/components/ScheduleCalendar';
import ScheduleTemplateManager from '@/components/ScheduleTemplateManager'; // 새로 만든 컴포넌트

type Props = {
  currentStoreId: string;
};

export default function TemplateSection({ currentStoreId }: Props) {
  return (
    <div>
      {/* 상단 안내 */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 14, color: '#ccc', margin: 0 }}>
          오른쪽에서 근무 템플릿(오픈, 마감 등)을 만들고, <strong>(기능 개발 예정) 달력 날짜를 클릭하여 배정하세요.</strong>
        </p>
      </div>

      {/* 2열 레이아웃 (왼쪽: 달력 / 오른쪽: 템플릿 관리) */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 20, alignItems: 'start' }}>
        
        {/* 1. 달력 영역 */}
        <div>
          <ScheduleCalendar currentStoreId={currentStoreId} />
        </div>

        {/* 2. 템플릿 관리 영역 (사이드바) */}
        <div>
          <ScheduleTemplateManager currentStoreId={currentStoreId} />
        </div>

      </div>
    </div>
  );
}