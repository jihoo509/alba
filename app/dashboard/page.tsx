'use client';

import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import UserBar from '@/components/UserBar';

type Store = {
  id: string;
  name: string;
};

// 직원 타입
type Employee = {
  id: string;
  name: string;
  hourly_wage: number | null;
  employment_type: string; // 'worker' | 'manager'
  is_active: boolean | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  // ---- 공통 상태 ----
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ---- 매장 관련 상태 ----
  const [stores, setStores] = useState<Store[]>([]);
  const [currentStoreId, setCurrentStoreId] = useState<string | null>(null);
  const [newStoreName, setNewStoreName] = useState('');
  const [creatingStore, setCreatingStore] = useState(false);

  // ---- 직원 관련 상태 ----
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // 새 직원 추가 폼
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpWage, setNewEmpWage] = useState('');
  const [newEmpType, setNewEmpType] = useState<'worker' | 'manager'>('worker');

  // 직원 수정 상태
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editName, setEditName] = useState('');
  const [editWage, setEditWage] = useState('');
  const [editType, setEditType] = useState<'worker' | 'manager'>('worker');
  const [editActive, setEditActive] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // -------- 매장 목록 불러오기 --------
  const loadStores = useCallback(
    async (userId: string) => {
      const { data, error } = await supabase
        .from('stores')
        .select('id, name')
        .eq('owner_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('loadStores error:', error);
        setErrorMsg('매장 목록을 불러오는 데 실패했습니다.');
        setStores([]);
        setCurrentStoreId(null);
        return;
      }

      const list = (data ?? []) as Store[];
      setStores(list);
      setCurrentStoreId(list[0]?.id ?? null);
    },
    [supabase],
  );

  // -------- 직원 목록 불러오기 (API 사용) --------
  const loadEmployees = useCallback(
    async (storeId: string) => {
      try {
        setLoadingEmployees(true);
        setErrorMsg(null);

        const res = await fetch(`/api/employees?storeId=${storeId}`);
        const data = await res.json();

        if (!res.ok) {
          console.error('loadEmployees error:', data.error);
          setErrorMsg(data.error || '직원 목록을 불러오는 데 실패했습니다.');
          setEmployees([]);
          return;
        }

        setEmployees((data.employees ?? []) as Employee[]);
      } catch (err: any) {
        console.error('loadEmployees fetch error:', err);
        setErrorMsg('직원 목록을 불러오는 중 오류가 발생했습니다.');
        setEmployees([]);
      } finally {
        setLoadingEmployees(false);
      }
    },
    [],
  );

  // -------- 로그인 확인 + 첫 로딩 --------
  useEffect(() => {
    async function init() {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        router.replace('/');
        return;
      }

      setUserEmail(data.user.email ?? '');
      await loadStores(data.user.id);
      setLoading(false);
    }

    init();
  }, [supabase, router, loadStores]);

  // -------- 매장 변경되면 직원 자동 로딩 --------
  useEffect(() => {
    if (!currentStoreId) return;
    loadEmployees(currentStoreId);
  }, [currentStoreId, loadEmployees]);

  // -------- 매장 생성 --------
  async function handleCreateStore(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!newStoreName.trim()) {
      setErrorMsg('매장 이름을 입력해주세요.');
      return;
    }

    setCreatingStore(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setCreatingStore(false);
      setErrorMsg('로그인이 필요합니다.');
      return;
    }

    const { data: store, error: storeError } = await supabase
      .from('stores')
      .insert({
        name: newStoreName.trim(),
        owner_id: user.id,
      })
      .select()
      .single();

    if (storeError || !store) {
      console.error('create store error:', storeError);
      setCreatingStore(false);
      setErrorMsg('매장 생성에 실패했습니다.');
      return;
    }

    await supabase.from('store_members').insert({
      store_id: store.id,
      user_id: user.id,
      role: 'owner',
    });

    setNewStoreName('');
    setCreatingStore(false);

    await loadStores(user.id);
  }

  // -------- 직원 추가 (API 사용) --------
  async function handleCreateEmployee(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!currentStoreId) {
      setErrorMsg('먼저 매장을 선택해주세요.');
      return;
    }
    if (!newEmpName.trim()) {
      setErrorMsg('직원 이름을 입력해주세요.');
      return;
    }
    if (!newEmpWage.trim()) {
      setErrorMsg('시급을 입력해주세요.');
      return;
    }

    const wage = Number(newEmpWage.replace(/,/g, ''));
    if (Number.isNaN(wage) || wage <= 0) {
      setErrorMsg('시급은 0보다 큰 숫자로 입력해주세요.');
      return;
    }

    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: currentStoreId,
          name: newEmpName.trim(),
          hourlyWage: wage,
          employmentType: newEmpType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('create employee error:', data.error);
        setErrorMsg(data.error || '직원 추가에 실패했습니다.');
        return;
      }

      setNewEmpName('');
      setNewEmpWage('');
      setNewEmpType('worker');

      await loadEmployees(currentStoreId);
    } catch (err: any) {
      console.error('create employee fetch error:', err);
      setErrorMsg('직원 추가 중 오류가 발생했습니다.');
    }
  }

  // -------- 직원 수정 시작 --------
  function handleStartEdit(emp: Employee) {
    setEditingEmployee(emp);
    setEditName(emp.name);
    setEditWage(
      emp.hourly_wage != null ? String(emp.hourly_wage) : '',
    );
    setEditType(emp.employment_type as 'worker' | 'manager');
    setEditActive(emp.is_active !== false); // null이면 true로 취급
  }

  // -------- 직원 수정 저장 (PUT /api/employees/[id]) --------
  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingEmployee) return;
    if (!currentStoreId) return;

    setErrorMsg(null);

    if (!editName.trim()) {
      setErrorMsg('직원 이름을 입력해주세요.');
      return;
    }
    if (!editWage.trim()) {
      setErrorMsg('시급을 입력해주세요.');
      return;
    }

    const wage = Number(editWage.replace(/,/g, ''));
    if (Number.isNaN(wage) || wage <= 0) {
      setErrorMsg('시급은 0보다 큰 숫자로 입력해주세요.');
      return;
    }

    try {
      setSavingEdit(true);

      const res = await fetch(`/api/employees/${editingEmployee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          hourly_wage: wage,
          employment_type: editType,
          is_active: editActive,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('update employee error:', data.error);
        setErrorMsg(data.error || '직원 수정에 실패했습니다.');
        return;
      }

      setEditingEmployee(null);
      await loadEmployees(currentStoreId);
    } catch (err: any) {
      console.error('update employee fetch error:', err);
      setErrorMsg('직원 수정 중 오류가 발생했습니다.');
    } finally {
      setSavingEdit(false);
    }
  }

  // -------- 직원 삭제 (DELETE /api/employees/[id]) --------
  async function handleDeleteEmployee(id: string) {
    if (!currentStoreId) return;

    const ok = window.confirm('정말 이 직원을 삭제하시겠습니까?');
    if (!ok) return;

    try {
      setErrorMsg(null);
      setDeletingId(id);

      const res = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('delete employee error:', data.error);
        setErrorMsg(data.error || '직원 삭제에 실패했습니다.');
        return;
      }

      await loadEmployees(currentStoreId);
    } catch (err: any) {
      console.error('delete employee fetch error:', err);
      setErrorMsg('직원 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingId(null);
    }
  }

  // -------- 로딩 중 UI --------
  if (loading) {
    return (
      <main style={{ padding: 40, color: '#fff' }}>
        로그인 상태 확인 중...
      </main>
    );
  }

  // -------- 화면 렌더링 --------
  return (
    <main style={{ padding: 40, color: '#fff' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <h1>사장님 대시보드</h1>
        <UserBar email={userEmail} />
      </header>

      {errorMsg && (
        <div style={{ marginBottom: 16, color: 'salmon' }}>{errorMsg}</div>
      )}

      {stores.length === 0 ? (
        // ---- 매장이 하나도 없을 때: 매장 생성 폼 ----
        <section style={{ maxWidth: 480 }}>
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>첫 매장 만들기</h2>
          <p style={{ marginBottom: 12 }}>
            현재 계정에 연결된 매장이 없습니다. 아래에서 첫 매장을 등록해주세요.
          </p>

          <form onSubmit={handleCreateStore}>
            <input
              type="text"
              placeholder="매장 이름 (예: 광주 수완지구 1호점)"
              value={newStoreName}
              onChange={(e) => setNewStoreName(e.target.value)}
              style={{
                width: '100%',
                padding: 10,
                marginBottom: 8,
                color: '#000',
              }}
            />
            <button
              type="submit"
              disabled={creatingStore}
              style={{
                padding: 10,
                minWidth: 160,
                background: 'seagreen',
                color: '#fff',
                border: 0,
                cursor: 'pointer',
              }}
            >
              {creatingStore ? '생성 중...' : '매장 생성'}
            </button>
          </form>
        </section>
      ) : (
        // ---- 매장이 있을 때: 선택 + 직원 관리 ----
        <section style={{ maxWidth: 640 }}>
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>내 매장 선택</h2>

          <select
            value={currentStoreId ?? ''}
            onChange={(e) => setCurrentStoreId(e.target.value)}
            style={{
              padding: 8,
              minWidth: 260,
              color: '#000',
              marginBottom: 16,
            }}
          >
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>

          <div style={{ marginTop: 8, marginBottom: 24 }}>
            <p>
              현재 선택된 매장:{' '}
              {stores.find((s) => s.id === currentStoreId)?.name}
            </p>
            <p style={{ marginTop: 4, fontSize: 14, color: '#aaa' }}>
              아래에서 이 매장의 직원 / 스케줄 / 급여를 관리하게 됩니다.
            </p>
          </div>

          {/* 직원 추가 폼 */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>직원 추가</h3>
            <form
              onSubmit={handleCreateEmployee}
              style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
            >
              <input
                type="text"
                placeholder="직원 이름"
                value={newEmpName}
                onChange={(e) => setNewEmpName(e.target.value)}
                style={{ padding: 8, color: '#000', minWidth: 140 }}
              />
              <input
                type="number"
                placeholder="시급 (원)"
                value={newEmpWage}
                onChange={(e) => setNewEmpWage(e.target.value)}
                style={{ padding: 8, color: '#000', minWidth: 120 }}
              />
              <select
                value={newEmpType}
                onChange={(e) =>
                  setNewEmpType(e.target.value as 'worker' | 'manager')
                }
                style={{ padding: 8, color: '#000', minWidth: 120 }}
              >
                <option value="worker">알바 / 스태프</option>
                <option value="manager">매니저</option>
              </select>
              <button
                type="submit"
                style={{
                  padding: '8px 16px',
                  background: 'dodgerblue',
                  color: '#fff',
                  border: 0,
                  cursor: 'pointer',
                }}
              >
                직원 추가
              </button>
            </form>
          </div>

          {/* 직원 리스트 */}
          <div>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>직원 목록</h3>
            {loadingEmployees ? (
              <p>직원 목록 불러오는 중...</p>
            ) : employees.length === 0 ? (
              <p style={{ fontSize: 14, color: '#aaa' }}>
                아직 등록된 직원이 없습니다.
              </p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {employees.map((emp) => (
                  <li
                    key={emp.id}
                    style={{
                      padding: '6px 0',
                      borderBottom: '1px solid #333',
                      fontSize: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <div>
                      <strong>{emp.name}</strong>{' '}
                      <span style={{ marginLeft: 8 }}>
                        {emp.hourly_wage != null
                          ? `${emp.hourly_wage.toLocaleString()}원`
                          : '-'}
                      </span>
                      <span style={{ marginLeft: 8 }}>
                        {emp.employment_type === 'manager'
                          ? '매니저'
                          : '직원'}
                      </span>
                      {!emp.is_active && (
                        <span style={{ marginLeft: 8, color: 'orange' }}>
                          (퇴사/비활성)
                        </span>
                      )}
                    </div>
                    <div>
                      <button
                        style={{
                          marginRight: 8,
                          padding: '4px 8px',
                          cursor: 'pointer',
                        }}
                        onClick={() => handleStartEdit(emp)}
                      >
                        수정
                      </button>
                      <button
                        style={{
                          padding: '4px 8px',
                          cursor: 'pointer',
                          opacity: deletingId === emp.id ? 0.6 : 1,
                        }}
                        onClick={() => handleDeleteEmployee(emp.id)}
                        disabled={deletingId === emp.id}
                      >
                        {deletingId === emp.id ? '삭제 중...' : '삭제'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {/* 직원 수정 모달 */}
      {editingEmployee && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              color: '#000',
              padding: 20,
              borderRadius: 8,
              minWidth: 320,
            }}
          >
            <h3 style={{ marginBottom: 12 }}>
              직원 수정 - {editingEmployee.name}
            </h3>
            <form
              onSubmit={handleSaveEdit}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <input
                type="text"
                placeholder="직원 이름"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={{ padding: 8 }}
              />
              <input
                type="number"
                placeholder="시급 (원)"
                value={editWage}
                onChange={(e) => setEditWage(e.target.value)}
                style={{ padding: 8 }}
              />
              <select
                value={editType}
                onChange={(e) =>
                  setEditType(e.target.value as 'worker' | 'manager')
                }
                style={{ padding: 8 }}
              >
                <option value="worker">알바 / 스태프</option>
                <option value="manager">매니저</option>
              </select>
              <label style={{ fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                  style={{ marginRight: 4 }}
                />
                재직 중(체크 해제 시 퇴사/비활성 처리)
              </label>

              <div
                style={{
                  marginTop: 16,
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 8,
                }}
              >
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  style={{ padding: '6px 12px', cursor: 'pointer' }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: 'dodgerblue',
                    color: '#fff',
                    border: 0,
                    cursor: 'pointer',
                    opacity: savingEdit ? 0.7 : 1,
                  }}
                >
                  {savingEdit ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
