'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import type { ScheduleTemplate } from './TemplateSection'; // 타입 가져오기

type Props = {
  currentStoreId: string | null;
  selectedTemplate: ScheduleTemplate | null;
  onSelectTemplate: (template: ScheduleTemplate | null) => void;
};

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB'];

export default function ScheduleTemplateManager({ currentStoreId, selectedTemplate, onSelectTemplate }: Props) {
  const supabase = createSupabaseBrowserClient();
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  // 폼 상태
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  const loadTemplates = useCallback(async () => {
    if (!currentStoreId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('schedule_templates')
      .select('*')
      .eq('store_id', currentStoreId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setTemplates(data);
    }
    setLoading(false);
  }, [currentStoreId, supabase]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleAdd = async () => {
    if (!name.trim()) return alert('이름을 입력해주세요.');
    if (!currentStoreId) return;

    const { error } = await supabase.from('schedule_templates').insert({
      store_id: currentStoreId,
      name,
      start_time: startTime,
      end_time: endTime,
      color: selectedColor
    });

    if (error) alert('추가 실패: ' + error.message);
    else {
      setName('');
      loadTemplates();
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // 부모 클릭 이벤트 전파 방지 (선택 방지)
    if (!confirm('삭제하시겠습니까?')) return;
    const { error } = await supabase.from('schedule_templates').delete().eq('id', id);
    if (!error) {
      loadTemplates();
      if (selectedTemplate?.id === id) onSelectTemplate(null); // 선택된 거 삭제하면 선택 해제
    }
  };

  return (
    <div style={{ backgroundColor: '#222', padding: 20, borderRadius: 8, border: '1px solid #333' }}>
      <h3 style={{ marginTop: 0, marginBottom: 16, color: '#fff' }}>📌 근무 템플릿</h3>
      
      {/* 입력 폼 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24, padding: 12, backgroundColor: '#333', borderRadius: 6 }}>
        <input placeholder="이름 (예: 오픈, 마감)" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={inputStyle} />
          <span style={{ color: '#aaa', alignSelf: 'center' }}>~</span>
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {COLORS.map(c => (
            <div key={c} onClick={() => setSelectedColor(c)} style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: c, cursor: 'pointer', border: selectedColor === c ? '2px solid white' : '2px solid transparent' }} />
          ))}
        </div>
        <button onClick={handleAdd} style={btnStyle}>+ 템플릿 추가</button>
      </div>

      {/* 템플릿 목록 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {templates.map(t => {
          const isSelected = selectedTemplate?.id === t.id;
          return (
            <div 
              key={t.id} 
              onClick={() => onSelectTemplate(isSelected ? null : t)} // 클릭 시 선택/해제 토글
              style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px', borderRadius: 6, backgroundColor: isSelected ? '#444' : '#333', 
                borderLeft: `4px solid ${t.color || '#ccc'}`,
                border: isSelected ? `1px solid ${t.color}` : '1px solid transparent', // 선택 시 테두리 강조
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              <div>
                <div style={{ fontWeight: 'bold', color: '#fff' }}>{t.name}</div>
                <div style={{ fontSize: 12, color: '#aaa' }}>{t.start_time} ~ {t.end_time}</div>
              </div>
              <button onClick={(e) => handleDelete(e, t.id)} style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer' }}>x</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const inputStyle = { padding: 8, borderRadius: 4, border: '1px solid #555', background: '#222', color: '#fff', flex: 1 };
const btnStyle = { padding: 10, borderRadius: 4, border: 'none', background: 'royalblue', color: '#fff', fontWeight: 'bold', cursor: 'pointer', marginTop: 4 };