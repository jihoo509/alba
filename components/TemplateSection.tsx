'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';

type TemplateRow = {
  id: string;
  name: string;
  days: number[] | null; // smallint[]
  start_time: string;
  end_time: string;
  break_minutes: number;
  color: string | null;
};

const DAY_LABELS: { value: number; label: string }[] = [
  { value: 1, label: '월' },
  { value: 2, label: '화' },
  { value: 3, label: '수' },
  { value: 4, label: '목' },
  { value: 5, label: '금' },
  { value: 6, label: '토' },
  { value: 7, label: '일' },
];

function daysToLabel(days: number[] | null | undefined) {
  if (!days || days.length === 0) return '-';
  const sorted = [...days].sort((a, b) => a - b);
  return sorted
    .map((d) => DAY_LABELS.find((x) => x.value === d)?.label ?? '?')
    .join('·');
}

type TemplateSectionProps = {
  currentStoreId: string;
};

export function TemplateSection({ currentStoreId }: TemplateSectionProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 폼 상태
  const [name, setName] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([1]); // 기본 월
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('16:00');
  const [breakMinutes, setBreakMinutes] = useState('0');
  const [color, setColor] = useState('#4e7bff');

  // 수정 모드
  const [editingId, setEditingId] = useState<string | null>(null);
  const isEditing = !!editingId;

  // -------- 템플릿 로딩 --------
  const loadTemplates = async () => {
    setLoading(true);
    setErrorMsg(null);

    const { data, error } = await supabase
      .from('schedule_templates')
      .select(
        'id, name, days, start_time, end_time, break_minutes, color',
      )
      .eq('store_id', currentStoreId)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('loadTemplates error:', error);
      setErrorMsg('고정 스케줄을 불러오는 중 오류가 발생했습니다.');
      setTemplates([]);
      setLoading(false);
      return;
    }

    setTemplates((data ?? []) as TemplateRow[]);
    setLoading(false);
  };

  useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStoreId]);

  // -------- 요일 토글 --------
  const toggleDay = (day: number) => {
    setSelectedDays((prev) => {
      if (prev.includes(day)) {
        return prev.filter((d) => d !== day);
      }
      return [...prev, day].sort((a, b) => a - b);
    });
  };

  // -------- 폼 리셋 --------
  const resetForm = () => {
    setName('');
    setSelectedDays([1]);
    setStartTime('10:00');
    setEndTime('16:00');
    setBreakMinutes('0');
    setColor('#4e7bff');
    setEditingId(null);
  };

  // -------- 템플릿 생성 --------
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('고정 스케줄 이름을 입력해주세요.');
      return;
    }
    if (selectedDays.length === 0) {
      setErrorMsg('적어도 1개 이상의 요일을 선택해주세요.');
      return;
    }

    const breakMin = Number(breakMinutes || '0');
    if (Number.isNaN(breakMin) || breakMin < 0) {
      setErrorMsg('휴게 시간은 0 이상 숫자로 입력해주세요.');
      return;
    }

    const { error } = await supabase.from('schedule_templates').insert({
      store_id: currentStoreId,
      name: name.trim(),
      days: selectedDays,
      start_time: startTime,
      end_time: endTime,
      break_minutes: breakMin,
      color,
      is_active: true,
    } as any);

    if (error) {
      console.error('create schedule template error:', error);
      setErrorMsg('고정 스케줄 생성에 실패했습니다.');
      return;
    }

    resetForm();
    await loadTemplates();
  };

  // -------- 템플릿 삭제 --------
  const handleDelete = async (id: string) => {
    setErrorMsg(null);
    const ok = window.confirm('이 고정 스케줄을 삭제하시겠습니까?');
    if (!ok) return;

    const { error } = await supabase
      .from('schedule_templates')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('delete schedule template error:', error);
      setErrorMsg('고정 스케줄 삭제에 실패했습니다.');
      return;
    }

    if (editingId === id) {
      resetForm();
    }

    await loadTemplates();
  };

  // -------- 수정 모드 진입 --------
  const startEdit = (row: TemplateRow) => {
    setEditingId(row.id);
    setName(row.name);
    setSelectedDays(
      (row.days && row.days.length > 0 ? row.days : [1]).sort(
        (a, b) => a - b,
      ),
    );
    setStartTime(row.start_time.slice(0, 5));
    setEndTime(row.end_time.slice(0, 5));
    setBreakMinutes(String(row.break_minutes ?? 0));
    setColor(row.color || '#4e7bff');
  };

  // -------- 템플릿 업데이트 --------
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('고정 스케줄 이름을 입력해주세요.');
      return;
    }
    if (selectedDays.length === 0) {
      setErrorMsg('적어도 1개 이상의 요일을 선택해주세요.');
      return;
    }

    const breakMin = Number(breakMinutes || '0');
    if (Number.isNaN(breakMin) || breakMin < 0) {
      setErrorMsg('휴게 시간은 0 이상 숫자로 입력해주세요.');
      return;
    }

    const { error } = await supabase
      .from('schedule_templates')
      .update({
        name: name.trim(),
        days: selectedDays,
        start_time: startTime,
        end_time: endTime,
        break_minutes: breakMin,
        color,
      })
      .eq('id', editingId);

    if (error) {
      console.error('update schedule template error:', error);
      setErrorMsg('고정 스케줄 수정에 실패했습니다.');
      return;
    }

    resetForm();
    await loadTemplates();
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <h2 style={{ fontSize: 20, marginBottom: 8 }}>고정 스케줄 관리</h2>
      <p style={{ fontSize: 14, color: '#ccc', marginBottom: 16 }}>
        예: &ldquo;월·수·금 오전 10:00~16:00&rdquo; 같은 패턴을 고정 스케줄로
        만들어 두고, 나중에 주간 캘린더에서 직원들을 배정할 때 사용합니다.
      </p>

      {errorMsg && (
        <div style={{ marginBottom: 12, color: 'salmon', fontSize: 14 }}>
          {errorMsg}
        </div>
      )}

      {/* === 폼 === */}
      <form
        onSubmit={isEditing ? handleUpdate : handleCreate}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          padding: 16,
          border: '1px solid #333',
          borderRadius: 6,
          marginBottom: 24,
          background: '#111',
        }}
      >
        {/* 이름 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 13 }}>스케줄 이름</label>
          <input
            type="text"
            placeholder="예: 평일 오전조"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              padding: 8,
              color: '#000',
              borderRadius: 4,
              border: '1px solid #555',
            }}
          />
        </div>

        {/* 요일 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 13 }}>요일 선택</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {DAY_LABELS.map((d) => {
              const active = selectedDays.includes(d.value);
              return (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => toggleDay(d.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 4,
                    border: active ? '1px solid #4e7bff' : '1px solid #555',
                    background: active ? '#4e7bff' : 'transparent',
                    color: active ? '#fff' : '#ddd',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 11, color: '#aaa' }}>
            여러 요일을 선택하면 한 고정 스케줄에 묶여서 저장됩니다. (예:
            월·수·금)
          </div>
        </div>

        {/* 시간 + 휴게 + 색상 */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              minWidth: 120,
            }}
          >
            <label style={{ fontSize: 13 }}>시작 시간</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              style={{
                padding: 6,
                color: '#000',
                borderRadius: 4,
                border: '1px solid #555',
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              minWidth: 120,
            }}
          >
            <label style={{ fontSize: 13 }}>종료 시간</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              style={{
                padding: 6,
                color: '#000',
                borderRadius: 4,
                border: '1px solid #555',
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              minWidth: 140,
              flex: 1,
            }}
          >
            <label style={{ fontSize: 13 }}>휴게 시간 (분 단위)</label>
            <input
              type="number"
              min={0}
              placeholder="예: 30"
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(e.target.value)}
              style={{
                padding: 6,
                color: '#000',
                borderRadius: 4,
                border: '1px solid #555',
              }}
            />
            <span style={{ fontSize: 11, color: '#aaa' }}>
              예: 점심 1시간이면 60 입력
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              minWidth: 80,
            }}
          >
            <label style={{ fontSize: 13 }}>색상</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{ width: 40, height: 32, padding: 0 }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button
            type="submit"
            style={{
              padding: '8px 16px',
              background: isEditing ? 'orange' : 'dodgerblue',
              color: '#fff',
              border: 0,
              cursor: 'pointer',
              borderRadius: 4,
              fontSize: 13,
            }}
          >
            {isEditing ? '고정 스케줄 수정' : '템플릿 추가'}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={resetForm}
              style={{
                padding: '8px 12px',
                background: 'transparent',
                borderRadius: 4,
                border: '1px solid #555',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              수정 취소
            </button>
          )}
        </div>
      </form>

      {/* === 리스트 === */}
      <div>
        <h3 style={{ fontSize: 16, marginBottom: 8 }}>등록된 고정 스케줄</h3>
        {loading ? (
          <p>불러오는 중...</p>
        ) : templates.length === 0 ? (
          <p style={{ fontSize: 14, color: '#aaa' }}>
            아직 등록된 고정 스케줄이 없습니다.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {templates.map((t) => (
              <li
                key={t.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: '1px solid #333',
                  gap: 10,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span
                    style={{
                      width: 8,
                      height: 28,
                      borderRadius: 4,
                      background: t.color || '#4e7bff',
                      display: 'inline-block',
                    }}
                  />
                  <div>
                    <div>
                      <strong>{t.name}</strong>{' '}
                      <span style={{ color: '#ccc', marginLeft: 6 }}>
                        ({daysToLabel(t.days)}){' '}
                        {t.start_time.slice(0, 5)} ~ {t.end_time.slice(0, 5)}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#888' }}>
                      휴게 {t.break_minutes}분
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => startEdit(t)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 4,
                      border: '1px solid #555',
                      background: 'transparent',
                      color: '#fff',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(t.id)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 4,
                      border: '1px solid #924040',
                      background: '#a33',
                      color: '#fff',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <hr style={{ borderColor: '#333', marginTop: 24 }} />

      <div style={{ fontSize: 13, color: '#888', marginTop: 8 }}>
        ※ 다음 단계에서 &lsquo;스케줄 생성&rsquo;과 주간 캘린더 화면을
        구현해서, 이 고정 스케줄(시간 패턴)에 **직원들을 배정**하는 구조로
        갈 거야.  
        같은 시간대에 추가 인원이 필요하면 캘린더에서 직원 한 명 더
        선택해 넣는 방식으로 단순하게 만들자.
      </div>
    </div>
  );
}
