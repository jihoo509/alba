'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import type { ScheduleTemplate } from './TemplateSection'; 

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
    e.stopPropagation(); 
    if (!confirm('삭제하시겠습니까?')) return;
    const { error } = await supabase.from('schedule_templates').delete().eq('id', id);
    if (!error) {
      loadTemplates();
      if (selectedTemplate?.id === id) onSelectTemplate(null); 
    }
  };

  return (
    // ✅ 흰색 카드 스타일
    <div style={{ backgroundColor: '#ffffff', padding: 20, borderRadius: 12, border: '1px solid #ddd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <h3 style={{ marginTop: 0, marginBottom: 16, color: '#333' }}>📌 근무 템플릿</h3>
      
      {/* 입력 폼 (밝은 회색 배경) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24, padding: 16, backgroundColor: '#f9f9f9', borderRadius: 8, border: '1px solid #eee' }}>
        <input placeholder="이름 (예: 오픈, 마감)" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={inputStyle} />
          <span style={{ color: '#666', alignSelf: 'center' }}>~</span>
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {COLORS.map(c => (
            <div 
                key={c} 
                onClick={() => setSelectedColor(c)} 
                style={{ 
                    width: 24, height: 24, borderRadius: '50%', backgroundColor: c, cursor: 'pointer', 
                    // 선택된 컬러는 진한 테두리
                    border: selectedColor === c ? '2px solid #333' : '2px solid transparent',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }} 
            />
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
              onClick={() => onSelectTemplate(isSelected ? null : t)} 
              style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px', borderRadius: 8, 
                // ✅ 선택 시 아주 연한 파랑 배경, 아니면 흰색
                backgroundColor: isSelected ? '#f0f9ff' : '#ffffff', 
                borderLeft: `5px solid ${t.color || '#ccc'}`,
                border: isSelected ? `1px solid ${t.color}` : '1px solid #eee', 
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              <div>
                <div style={{ fontWeight: 'bold', color: '#333' }}>{t.name}</div>
                <div style={{ fontSize: 12, color: '#666' }}>{t.start_time.slice(0,5)} ~ {t.end_time.slice(0,5)}</div>
              </div>
              <button onClick={(e) => handleDelete(e, t.id)} style={{ background: 'transparent', border: 'none', color: '#999', cursor: 'pointer', fontSize: 16 }}>×</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ✅ 입력 필드 스타일: 흰색 배경, 회색 테두리
const inputStyle = { padding: 10, borderRadius: 6, border: '1px solid #ccc', background: '#fff', color: '#333', flex: 1, outline: 'none' };
const btnStyle = { padding: 10, borderRadius: 6, border: 'none', background: 'dodgerblue', color: '#fff', fontWeight: 'bold', cursor: 'pointer', marginTop: 4 };