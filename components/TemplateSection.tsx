'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';

type Template = {
  id: string;
  store_id: number;        // 정수
  name: string;
  days: number[];
  start_time: string;
  end_time: string;
  end_next_day: boolean;
  break_minutes: number;
  color: string | null;
  is_active: boolean;
};

type Props = {
  currentStoreId: string | null; // 대시보드에서 그냥 넘겨주는 값 (문자열이어도 됨)
};

const DAY_LABELS: Record<number, string> = {
  1: '월',
  2: '화',
  3: '수',
  4: '목',
  5: '금',
  6: '토',
  7: '일',
};

// '10:00' + '16:00' + break → 순수 근무시간(시간 단위, 소수점)
function calcWorkHours(start: string, end: string, endNext: boolean, breakMin: number) {
  const [sH, sM] = start.split(':').map(Number);
  const [eH, eM] = end.split(':').map(Number);

  let startMinutes = sH * 60 + sM;
  let endMinutes = eH * 60 + eM;

  if (endNext) {
    // 익일이면 24시간 더해줌
    endMinutes += 24 * 60;
  }

  let total = endMinutes - startMinutes - breakMin;
  if (total < 0) total = 0;

  return total / 60;
}

export default function TemplateSection({ currentStoreId }: Props) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 폼 상태
  const [name, setName] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([1]); // 기본 월
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('16:00');
  const [endNextDay, setEndNextDay] = useState(false);
  const [breakMinutes, setBreakMinutes] = useState('0');
  const [color, setColor] = useState('#1e90ff');

  // 요일 토글
  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b),
    );
  };

  // 템플릿 불러오기
const loadTemplates = useCallback(
  async (storeId: string | null) => {
    if (!storeId) {
      setTemplates([]);
      return;
    }

    // 🔹 문자열 → 숫자로 변환 (stores.store_id 가 integer라서)
    const numericId = Number(storeId);
    if (Number.isNaN(numericId)) {
      console.error('loadTemplates: 잘못된 storeId 형식:', storeId);
      setTemplates([]);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const { data, error } = await supabase
      .from('schedule_templates')
      .select(
        'id, store_id, name, days, start_time, end_time, end_next_day, break_minutes, color, is_active'
      )
      .eq('store_id', numericId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('loadTemplates error detail:', error);
      setErrorMsg('고정 스케줄을 불러오는 중 오류가 발생했습니다.');
      setTemplates([]);
      setLoading(false);
      return;
    }

    setTemplates((data ?? []) as Template[]);
    setLoading(false);
  },
  [supabase],
);

  useEffect(() => {
    loadTemplates(currentStoreId);
  }, [currentStoreId, loadTemplates]);

  // 템플릿 추가
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

  if (!currentStoreId) {
    setErrorMsg('먼저 매장을 선택해주세요.');
    return;
  }


    if (!name.trim()) {
      setErrorMsg('스케줄 이름을 입력해주세요.');
      return;
    }
    if (selectedDays.length === 0) {
      setErrorMsg('요일을 한 개 이상 선택해주세요.');
      return;
    }

    const breakMinNum = Number(breakMinutes || '0');
    if (Number.isNaN(breakMinNum) || breakMinNum < 0) {
      setErrorMsg('휴게 시간은 0 이상의 숫자로 입력해주세요.');
      return;
    }

  if (!currentStoreId) {
    setErrorMsg('먼저 매장을 선택해주세요.');
    return;
  }

  const storeNumericId = Number(currentStoreId);
  if (Number.isNaN(storeNumericId)) {
    setErrorMsg('매장 ID 형식이 올바르지 않습니다.');
    return;
  }

  const { error } = await supabase.from('schedule_templates').insert({
    store_id: storeNumericId,   // 🔹 정수로 저장
    name: name.trim(),
    days: selectedDays,
    start_time: `${startTime}:00`,
    end_time: `${endTime}:00`,
    end_next_day: endNextDay,
    break_minutes: breakMinNum,
    color,
    is_active: true,
  });

    if (error) {
      console.error('create schedule template error:', error);
      setErrorMsg('고정 스케줄 생성에 실패했습니다.');
      return;
    }

    // 폼 초기화
    setName('');
    setSelectedDays([1]);
    setStartTime('10:00');
    setEndTime('16:00');
    setEndNextDay(false);
    setBreakMinutes('0');

    await loadTemplates(currentStoreId);
  };

  // 템플릿 삭제
  const handleDelete = async (id: string) => {
    if (!confirm('이 고정 스케줄을 삭제하시겠습니까?')) return;

    const { error } = await supabase.from('schedule_templates').delete().eq('id', id);

    if (error) {
      console.error('delete template error:', error);
      setErrorMsg('고정 스케줄 삭제에 실패했습니다.');
      return;
    }

    await loadTemplates(currentStoreId);
  };

  const totalHoursLabel = (t: Template) => {
    const hours = calcWorkHours(
      t.start_time.slice(0, 5),
      t.end_time.slice(0, 5),
      t.end_next_day,
      t.break_minutes,
    );
    return `휴게 ${t.break_minutes}분 / 일 ${hours.toFixed(1)}시간`;
  };

  return (
    <section style={{ marginTop: 32 }}>
      <h2 style={{ fontSize: 20, marginBottom: 8 }}>스케줄 관리</h2>
      <p style={{ fontSize: 14, color: '#aaa', marginBottom: 24 }}>
        템플릿을 만들어 두고, 나중에 주간 캘린더에 자동 배정하는 구조로 설계 중입니다.
      </p>

      {/* 에러 메시지 */}
      {errorMsg && (
        <div
          style={{
            marginBottom: 16,
            padding: '8px 12px',
            borderRadius: 4,
            background: '#442222',
            color: '#ffb3b3',
            fontSize: 14,
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* 템플릿 생성 폼 */}
      <div
        style={{
          border: '1px solid #333',
          borderRadius: 8,
          padding: 16,
          marginBottom: 24,
        }}
      >
        <h3 style={{ fontSize: 18, marginBottom: 12 }}>고정 스케줄 관리</h3>
        <p style={{ fontSize: 13, color: '#aaa', marginBottom: 12 }}>
          예: “월·수·금 오전 10:00~16:00” 같은 패턴을 고정 스케줄로 만들어 두고, 나중에 주간
          캘린더에 자동 배정할 때 사용할 예정입니다.
        </p>

        <form
          onSubmit={handleCreate}
          style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 900 }}
        >
          {/* 이름 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 14 }}>스케줄 이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 평일 오전조"
              style={{
                padding: 8,
                borderRadius: 4,
                border: '1px solid #444',
                background: '#111',
                color: '#fff',
              }}
            />
          </div>

          {/* 요일 선택 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 14 }}>요일 선택</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {Object.entries(DAY_LABELS).map(([value, label]) => {
                const day = Number(value);
                const active = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    style={{
                      padding: '6px 10px',
                      fontSize: 13,
                      borderRadius: 4,
                      border: '1px solid #444',
                      background: active ? '#1e90ff' : '#111',
                      color: active ? '#fff' : '#ccc',
                      cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <span style={{ fontSize: 12, color: '#777' }}>여러 요일을 선택하면 한 템플릿에 묶입니다.</span>
          </div>

          {/* 시간 + 익일 + 휴게 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 14 }}>시작 시간</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                style={{
                  padding: 6,
                  borderRadius: 4,
                  border: '1px solid #444',
                  background: '#111',
                  color: '#fff',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 14 }}>종료 시간</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                style={{
                  padding: 6,
                  borderRadius: 4,
                  border: '1px solid #444',
                  background: '#111',
                  color: '#fff',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 14 }}>익일 퇴근</label>
              <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="checkbox"
                  checked={endNextDay}
                  onChange={(e) => setEndNextDay(e.target.checked)}
                />
                <span>다음날로 넘어가는 근무 (예: 18:00 ~ 익일 02:00)</span>
              </label>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 14 }}>휴게 시간 (분)</label>
              <input
                type="number"
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(e.target.value)}
                style={{
                  padding: 6,
                  borderRadius: 4,
                  border: '1px solid #444',
                  background: '#111',
                  color: '#fff',
                }}
              />
            </div>
          </div>

          {/* 색상 + 버튼 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginTop: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 14 }}>색상</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{ width: 40, height: 28, padding: 0, border: 'none', background: 'none' }}
              />
            </div>

            <button
              type="submit"
              style={{
                padding: '8px 16px',
                borderRadius: 4,
                border: 'none',
                background: '#2ecc71',
                color: '#000',
                fontWeight: 600,
                cursor: 'pointer',
                minWidth: 120,
              }}
            >
              템플릿 추가
            </button>
          </div>
        </form>
      </div>

      {/* 템플릿 목록 */}
      <div
        style={{
          border: '1px solid #333',
          borderRadius: 8,
          padding: 16,
        }}
      >
        <h3 style={{ fontSize: 18, marginBottom: 12 }}>등록된 고정 스케줄</h3>

        {loading ? (
          <p style={{ fontSize: 14, color: '#aaa' }}>고정 스케줄을 불러오는 중...</p>
        ) : templates.length === 0 ? (
          <p style={{ fontSize: 14, color: '#777' }}>등록된 고정 스케줄이 없습니다.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {templates.map((t) => (
              <li
                key={t.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  borderBottom: '1px solid #333',
                  fontSize: 14,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: t.color || '#1e90ff',
                      }}
                    />
                    <strong>{t.name}</strong>
                    <span style={{ color: '#ccc' }}>
                      (
                      {t.days
                        .map((d) => DAY_LABELS[d])
                        .filter(Boolean)
                        .join('·')}
                      ){' '}
                      {t.start_time.slice(0, 5)} ~ {t.end_time.slice(0, 5)}
                      {t.end_next_day && ' (익일)'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                    {totalHoursLabel(t)}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  {/* 수정 기능은 나중에 추가할 예정 */}
                  <button
                    type="button"
                    onClick={() => handleDelete(t.id)}
                    style={{
                      padding: '4px 10px',
                      fontSize: 13,
                      borderRadius: 4,
                      border: '1px solid #444',
                      background: '#aa3333',
                      color: '#fff',
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

      <p style={{ fontSize: 12, color: '#777', marginTop: 12 }}>
        ※ 다음 단계에서 &quot;스케줄 생성&quot; 버튼을 추가해서, 위 고정 스케줄들을 기준으로 주간
        캘린더(엑셀처럼 보이는 화면)에 자동 배정되도록 구현할 예정입니다. 특수 상황에 따라 캘린더에서
        한 칸씩 수동 조정도 가능하게 만들 거예요.
      </p>
    </section>
  );
}
