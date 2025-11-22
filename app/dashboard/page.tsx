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
import TemplateSection from '@/components/TemplateSection';

// ✅ 대시보드에서 사용하는 형태
// DB: store_id / store_name / user_id

type Store = {
  id: string;
  name: string;
};

type TabKey = 'employees' | 'schedules' | 'payroll';

// ✅ [추가] 여기에 Employee 타입을 추가하세요! (export 필수)
export type Employee = {
  id: string;
  name: string;
  hourly_wage: number;
  employment_type: 'freelancer' | 'employee';
  is_active: boolean;
  hire_date?: string;
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
  const [creatingStore, setCreatingStore] = useState(false);

  // ---- 직원 관련 상태 ----
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // ---- 탭 상태 ----
  const [currentTab, setCurrentTab] = useState<TabKey>('employees');

// -------- 매장 목록 불러오기 --------
const loadStores = useCallback(
  async (userId: string) => {
    // 1) 일단 모든 컬럼 가져오기 (*)
const { data, error } = await supabase
  .from('stores')
  .select('*')
  .eq('owner_id', userId); // <--- ✅ 실제 DB 컬럼명으로 변경

    if (error) {
      console.error('loadStores real error:', error);
      setErrorMsg('매장 목록을 불러오는 데 실패했습니다.');
      setStores([]);
      setCurrentStoreId(null);
      return;
    }

    const rows = (data ?? []) as any[];
    console.log('stores rows from DB:', rows); // 👉 어떤 컬럼이 실제로 오는지 확인용

    // 2) 실제 오는 컬럼 이름에 맞춰서 매핑
const list: Store[] = rows.map((row) => ({
  id: String(row.id),  // (참고: store_id도 없다면 row.id로 통일)
  // 👇 깔끔하게 수정
  name: row.name as string,
}));

    setStores(list);

    // 3) 처음 들어왔는데 선택된 매장이 없으면 첫 번째 매장을 선택
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
  .select('*')
  .eq('store_id', storeId)          // <--- ✅ 그냥 문자열(UUID) 그대로 전달
  .order('created_at', { ascending: true });

      if (error) {
        console.error('loadEmployees error:', error);
        setErrorMsg('직원 목록을 불러오는 데 실패했습니다.');
        setEmployees([]);
        setLoadingEmployees(false);
        return;
      }

const list: Employee[] = (data ?? []).map((row: any) => ({
  // ✅ row.id가 있으면 쓰고, 혹시나 row.employee_id가 있으면 그걸 씀
  id: String(row.id ?? row.employee_id), 
  name: row.name,
  hourly_wage: row.hourly_wage,
  employment_type: row.employment_type,
  is_active: true,
  hire_date: row.hire_date,
      }));

      setEmployees(list);
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

      // ✅ 로그인한 유저 아이디 기준으로 매장 로딩
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

const { data: storeRow, error: storeError } = await supabase
  .from('stores')
  .insert({
    name: storeName.trim(),        // ✅ 올바른 컬럼명으로 수정
    owner_id: user.id,
  })
  .select('*')
  .single();

if (storeError || !storeRow) {
  console.error('create store error:', storeError);
  setCreatingStore(false);
  setErrorMsg('매장 생성에 실패했습니다.');
  return;
}

const newStore: Store = {
  id: String((storeRow as any).id),
  // 👇 깔끔하게 수정
  name: (storeRow as any).name as string,
};

      // 로컬 상태에 추가
      setStores((prev) => [...prev, newStore]);
      setCreatingStore(false);

      // 새 매장을 현재 선택값으로
      setCurrentStoreId(newStore.id);
      setCurrentTab('employees');
    },
    [supabase],
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
  store_id: currentStoreId,         // <--- ✅ Number() 제거
  name: name.trim(),
        hourly_wage: hourlyWage,
        employment_type:
          employmentType === 'freelancer_33' ? 'freelancer' : 'employee',
        hire_date: hireDate || null,
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

  // -------- 탭 렌더링 --------
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
        <StoreSelector
          stores={stores}
          currentStoreId={currentStoreId}
          onChangeStore={(storeId) => {
            setCurrentStoreId(storeId);
            setCurrentTab('employees');
          }}
          creatingStore={creatingStore}
          onCreateStore={handleCreateStore}
        />

        {stores.length > 0 && currentStoreId && (
          <div>
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

            <div>{renderTabContent()}</div>
          </div>
        )}
      </section>
    </main>
  );
}
