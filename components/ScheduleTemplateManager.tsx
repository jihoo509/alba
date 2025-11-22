'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';

type Props = {
  currentStoreId: string | null;
};

type Template = {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  color: string; // 템플릿 색상
};

// 색상 프리셋 (이 중에서 고르게 하면 예쁨)
const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB'];

export default function ScheduleTemplateManager({ currentStoreId }: Props) {
  const supabase = createSupabaseBrowserClient();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);

  // 입력 폼 상태
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  // 1. 템플릿 목록 불러오기
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

  // 2. 템플릿 추가하기
  const handleAdd = async () => {
    if (!name.trim()) return alert('템플릿 이름(예: 오픈조)을 입력해주세요.');
    if (!currentStoreId) return;

    const { error } = await supabase.from('schedule_templates').insert({
      store_id: Number(currentStoreId), // store_id가 숫자형이면 Number() 필수, uuid면 제거
      name,
      start_time: startTime,
      end_time: endTime,
      color: selectedColor // DB에 color 컬럼이 없으면 SQL로 추가해야 함 (아래 참조)
    });

    if (error) {
      console.error(error);
      alert('추가 실패: ' + error.message);
    } else {
      setName('');
      loadTemplates(); // 목록 갱신
    }
  };

  // 3. 템플릿 삭제하기
  const handleDelete = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return;
    const { error } = await supabase.from('schedule_templates').delete().eq('id', id);
    if (!error) loadTemplates();
  };

  return (
    <div style={{ backgroundColor: '#222', padding: 20, borderRadius: 8, border: '1px solid #333', height: '100%' }}>
      <h3 style={{ marginTop: 0, marginBottom: 16, color: '#fff' }}>📌 근무 템플릿</h3>
      
      {/* 입력 폼 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24, padding: 12, backgroundColor: '#333', borderRadius: 6 }}>
        <input 
          placeholder="이름 (예: 오픈, 마감)" 
          value={name} onChange={(e) => setName(e.target.value)} 
          style={inputStyle} 
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={inputStyle} />
          <span style={{ color: '#aaa', alignSelf: 'center' }}>~</span>
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={inputStyle} />
        </div>
        
        {/* 색상 선택기 */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {COLORS.map(c => (
            <div 
              key={c} 
              onClick={() => setSelectedColor(c)}
              style={{ 
                width: 24, height: 24, borderRadius: '50%', backgroundColor: c, cursor: 'pointer',
                border: selectedColor === c ? '2px solid white' : '2px solid transparent'
              }} 
            />
          ))}
        </div>

        <button onClick={handleAdd} style={btnStyle}>
          + 템플릿 추가
        </button>
      </div>

      {/* 목록 리스트 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? <p style={{ color: '#777' }}>로딩 중...</p> : templates.length === 0 ? <p style={{ color: '#777' }}>등록된 템플릿이 없습니다.</p> : null}
        
        {templates.map(t => (
          <div key={t.id} style={{ 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px', borderRadius: 6, backgroundColor: '#333', borderLeft: `4px solid ${t.color || '#ccc'}`
          }}>
            <div>
              <div style={{ fontWeight: 'bold', color: '#fff' }}>{t.name}</div>
              <div style={{ fontSize: 12, color: '#aaa' }}>{t.start_time} ~ {t.end_time}</div>
            </div>
            <button onClick={() => handleDelete(t.id)} style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer' }}>x</button>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputStyle = {
  padding: 8, borderRadius: 4, border: '1px solid #555', background: '#222', color: '#fff', flex: 1
};

const btnStyle = {
  padding: 10, borderRadius: 4, border: 'none', background: 'royalblue', color: '#fff', fontWeight: 'bold', cursor: 'pointer', marginTop: 4
};