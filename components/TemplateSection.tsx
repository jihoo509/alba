'use client';

import React from 'react';
import ScheduleCalendar from '@/components/ScheduleCalendar'; // 달력 불러오기

type Props = {
  currentStoreId: string;
};

export default function TemplateSection({ currentStoreId }: Props) {
  return (
    <div>
      {/* 상단 안내 문구 */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 14, color: '#ccc', margin: 0 }}>
          직원별 근무 스케줄을 관리하는 캘린더입니다.
        </p>
        {/* 추후 여기에 '템플릿 관리', '자동 배정' 버튼 등이 추가될 예정 */}
      </div>

      {/* 📅 달력 컴포넌트 배치 */}
      <ScheduleCalendar currentStoreId={currentStoreId} />
      
      <div style={{ marginTop: 20, padding: 16, backgroundColor: '#1a1a1a', borderRadius: 8, border: '1px solid #333' }}>
        <h3 style={{ fontSize: 16, marginBottom: 8, color: '#ddd' }}>💡 사용 팁</h3>
        <ul style={{ fontSize: 13, color: '#aaa', paddingLeft: 20, lineHeight: 1.6 }}>
          <li>지금은 달력의 뼈대만 보이는 상태입니다.</li>
          <li>다음 단계에서 <strong>[근무 템플릿 만들기]</strong> 기능을 추가하여, 자주 쓰는 근무 시간(오픈조, 마감조 등)을 저장할 것입니다.</li>
          <li>그 후, 저장된 템플릿을 이 달력 날짜에 <strong>클릭 한 번으로 배정</strong>하는 기능을 구현할 예정입니다.</li>
        </ul>
      </div>
    </div>
  );
}