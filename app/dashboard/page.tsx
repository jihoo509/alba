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
import { StoreSelector } from '@/components/StoreSelector';
import { EmployeeSection } from '@/components/EmployeeSection';
import { TemplateSection } from '@/components/TemplateSection';

type Store = {
  id: string;
  name: string;
};

export type Employee = {
  id: string;
  name: string;
  hourly_wage: number | null;
  employment_type: string;
  is_active: boolean | null;
  hire_date?: string | null;
};

type TabKey = 'employees' | 'schedules' | 'payroll';

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
  const [creatingStore, setCreatingStore] = useState(false);

  // ---- 직원 관련 상태 ----
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // ---- 대시보드 탭 상태 ----
  const [currentTab, setCurrentTab] = useState<TabKey>('employees');

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

      // 매장이 있는데 currentStoreId가 비어있으면 첫 번째 매장으로 세팅
      if (list.length > 0 && !currentStoreId) {
        setCurrentStoreId(list[0].id);
      }
    },
    [supabase, currentStoreId],
  );

  // -------- 직원 목록 불러오기 --------
  const loadEmployees = useCallback(
    async (storeId: string) => {
      setLoadingEmployees(true);
      setErrorMsg(null);

      const { data, error } = await supabase
        .from('employees')
        .select(
          'id, name, hourly_wage, employment_type, is_active, hire_date',
        )
        .eq('store_id', storeId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('loadEmployees error:', error);
        setErrorMsg('직원 목록을 불러오는 데 실패했습니다.');
        setEmployees([]);
        setLoadingEmployees(false);
        return;
      }

      setEmployees((data ?? []) as Employee[]);
      setLoadingEmployees(false);
    },
    [supabase],
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
  const handleCreateStore = useCallback(
    async (storeName: string) => {
      setErrorMsg(null);

      if (!storeName.trim()) {
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
          name: storeName.trim(),
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

      // store_members에 owner 등록
      await supabase.from('store_members').insert({
        store_id: store.id,
        user_id: user.id,
        role: 'owner',
      });

      setCreatingStore(false);
      await loadStores(user.id);
      setCurrentStoreId(store.id);
      setCurrentTab('employees'); // 새 매장은 직원 관리부터 시작
    },
    [supabase, loadStores],
  );

  // -------- 직원 추가 --------
  const handleCreateEmployee = useCallback(
    async (payload: {
      name: string;
      hourlyWage: number;
      employmentType: 'freelancer_33' | 'four_insurance';
      hireDate?: string;
    }) => {
      const { name, hourlyWage, employmentType, hireDate } = payload;
      setErrorMsg(null);

      if (!currentStoreId) {
        setErrorMsg('먼저 매장을 선택해주세요.');
        return;
      }

      if (!name.trim()) {
        setErrorMsg('직원 이름을 입력해주세요.');
        return;
      }

      if (!hourlyWage || Number.isNaN(hourlyWage) || hourlyWage <= 0) {
        setErrorMsg('시급은 0보다 큰 숫자로 입력해주세요.');
        return;
      }

      const { error } = await supabase.from('employees').insert({
        store_id: currentStoreId,
        name: name.trim(),
        hourly_wage: hourlyWage,
        employment_type: employmentType,
        hire_date: hireDate || null,
        is_active: true,
      });

      if (error) {
        console.error('create employee error:', error);
        setErrorMsg('직원 추가에 실패했습니다.');
        return;
      }

      await loadEmployees(currentStoreId);
    },
    [currentStoreId, supabase, loadEmployees],
  );

  // -------- 직원 삭제 --------
  const handleDeleteEmployee = useCallback(
    async (employeeId: string) => {
      if (!currentStoreId) {
        setErrorMsg('먼저 매장을 선택해주세요.');
        return;
      }

      try {
        const res = await fetch(`/api/employees/${employeeId}`, {
          method: 'DELETE',
        });

        const data = await res.json();

        if (!res.ok) {
          console.error('delete employee error:', data);
          setErrorMsg(data?.error || '직원 삭제에 실패했습니다.');
          return;
        }

        await loadEmployees(currentStoreId);
      } catch (err: any) {
        console.error('delete employee fetch error:', err);
        setErrorMsg('직원 삭제 중 오류가 발생했습니다.');
      }
    },
    [currentStoreId, loadEmployees],
  );

  // -------- 탭 렌더링 함수 --------
  const renderTabContent = () => {
    if (!currentStoreId) {
      return (
        <p style={{ fontSize: 14, color: '#aaa' }}>
          먼저 매장을 생성하거나 선택해주세요.
        </p>
      );
    }

    if (currentTab === 'employees') {
      return (
        <EmployeeSection
          currentStoreId={currentStoreId}
          employees={employees}
          loadingEmployees={loadingEmployees}
          onCreateEmployee={handleCreateEmployee}
          onDeleteEmployee={handleDeleteEmployee}
        />
      );
    }

    if (currentTab === 'schedules') {
      return (
        <div>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>스케줄 관리</h2>
          <p style={{ fontSize: 14, color: '#ccc', marginBottom: 16 }}>
            템플릿을 만들어 두고, 나중에 주간 캘린더에 자동 배정하는 구조로 설계 중입니다.
          </p>
          <TemplateSection currentStoreId={currentStoreId} />
        </div>
      );
    }

    // currentTab === 'payroll'
    return (
      <div>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>급여 / 정산</h2>
        <p style={{ fontSize: 14, color: '#ccc', marginBottom: 8 }}>
          이 탭에서는 스케줄 데이터를 기반으로 월별 급여, 야간수당, 휴일수당, 주휴수당을 자동 계산할 예정입니다.
        </p>
        <p style={{ fontSize: 14, color: '#ccc' }}>
          다음 단계에서 매장별 급여 설정(5인 이상/미만, 수당 적용 여부)을 먼저 구현한 뒤,
          여기서 월 선택 + 급여표를 보여줄 수 있도록 할게요.
        </p>
      </div>
    );
  };

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

      <section style={{ maxWidth: 900 }}>
        {/* 매장 선택 / 생성 */}
        <StoreSelector
          stores={stores}
          currentStoreId={currentStoreId}
          onChangeStore={(storeId) => {
            setCurrentStoreId(storeId);
            setCurrentTab('employees'); // 매장 바꾸면 직원 탭부터 보여주기
          }}
          creatingStore={creatingStore}
          onCreateStore={handleCreateStore}
        />

        {/* 매장이 있을 때만 탭과 내용 표시 */}
        {stores.length > 0 && currentStoreId && (
          <div>
            {/* 탭 버튼 영역 */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                borderBottom: '1px solid #333',
                marginBottom: 16,
                marginTop: 8,
              }}
            >
              {(
                [
                  { key: 'employees', label: '직원 관리' },
                  { key: 'schedules', label: '스케줄 관리' },
                  { key: 'payroll', label: '급여 / 정산' },
                ] as { key: TabKey; label: string }[]
              ).map((tab) => {
                const isActive = currentTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setCurrentTab(tab.key)}
                    style={{
                      padding: '8px 14px',
                      border: 'none',
                      borderBottom: isActive
                        ? '2px solid dodgerblue'
                        : '2px solid transparent',
                      background: 'transparent',
                      color: isActive ? '#fff' : '#aaa',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* 탭별 내용 */}
            <div>{renderTabContent()}</div>
          </div>
        )}
      </section>
    </main>
  );
}
