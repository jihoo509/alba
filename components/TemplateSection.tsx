'use client';

import React, { useState } from 'react';
import ScheduleCalendar from '@/components/ScheduleCalendar';
import ScheduleTemplateManager from '@/components/ScheduleTemplateManager';

type Props = {
  currentStoreId: string;
};

// 템플릿 타입 정의 (공유해서 쓰기 위함)
export type ScheduleTemplate = {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  color: string;
};

export default function TemplateSection({ currentStoreId }: Props) {
  // ✅ 현재 선택된 템플릿 (이게 있으면 달력 클릭 시 스케줄이 생성됨)
  const [selectedTemplate, setSelectedTemplate] = useState<ScheduleTemplate | null>(null);

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
              <span style={{ marginLeft: 8, color: '#888' }}>→ 달력 날짜를 클릭하세요!</span>
            </span>
          ) : (
            "오른쪽에서 템플릿을 선택하고, 달력 날짜를 클릭하여 배정하세요."
          )}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 20, alignItems: 'start' }}>
        
        {/* 1. 달력 (선택된 템플릿 정보를 넘겨줌) */}
        <div>
          <ScheduleCalendar 
            currentStoreId={currentStoreId} 
            selectedTemplate={selectedTemplate} 
          />
        </div>

        {/* 2. 템플릿 관리 (선택 기능 추가) */}
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