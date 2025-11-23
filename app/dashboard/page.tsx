'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import UserBar from '@/components/UserBar';
import { StoreSelector } from '@/components/StoreSelector';
import { EmployeeSection } from '@/components/EmployeeSection';
import TemplateSection from '@/components/TemplateSection';
// ✅ [변경] StoreSettings 대신 PayrollSection을 가져옵니다.
import PayrollSection from '@/components/PayrollSection';

type Store = {
  id: string;
  name: string;
};

type TabKey = 'employees' | 'schedules' | 'payroll';

// 직원 타입
export type Employee = {
  id: string;
  name: string;
  hourly_wage: number;
  employment_type: 'freelancer' | 'employee';
  is_active: boolean;
  hire_date?: string;
  phone_number?: string;
  birth_date?: string;
  bank_name?: string;
  account_number?: string;
  end_date?: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [stores, setStores] = useState<Store[]>([]);
  const [currentStoreId, setCurrentStoreId] = useState<string | null>(null);
  const [creatingStore, setCreatingStore] = useState(false);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  const [currentTab, setCurrentTab] = useState<TabKey>('employees');

  // 매장 목록 로딩
  const loadStores = useCallback(async (userId: string) => {
    const { data, error } = await supabase.from('stores').select('*').eq('owner_id', userId);
    if (error) {
      console.error('loadStores error:', error);
      setErrorMsg('매장 목록 로딩 실패');
      return;
    }
    const list = (data ?? []).map((row: any) => ({ id: String(row.id), name: row.name }));
    setStores(list);
    if (list.length > 0 && !currentStoreId) setCurrentStoreId(list[0].id);
  }, [supabase, currentStoreId]);

  // 매장 삭제
  const handleDeleteStore = useCallback(async (storeId: string) => {
    if (!window.confirm('정말 삭제하시겠습니까? 모든 데이터가 삭제됩니다.')) return;
    const { error } = await supabase.from('stores').delete().eq('id', storeId);
    if (error) { alert('삭제 실패: ' + error.message); return; }
    setStores((prev) => prev.filter((s) => s.id !== storeId));
    if (currentStoreId === storeId) { setCurrentStoreId(null); setEmployees([]); }
    alert('삭제되었습니다.');
  }, [supabase, currentStoreId]);

  // 직원 목록 로딩
  const loadEmployees = useCallback(async (storeId: string) => {
    setLoadingEmployees(true);
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('loadEmployees error:', error);
      setEmployees([]);
    } else {
      const list: Employee[] = (data ?? []).map((row: any) => ({
        id: String(row.id),
        name: row.name,
        hourly_wage: row.hourly_wage,
        employment_type: row.employment_type,
        is_active: row.is_active,
        hire_date: row.hire_date,
        phone_number: row.phone_number,
        birth_date: row.birth_date,
        bank_name: row.bank_name,
        account_number: row.account_number,
        end_date: row.end_date,
      }));
      setEmployees(list);
    }
    setLoadingEmployees(false);
  }, [supabase]);

  // 직원 추가
  const handleCreateEmployee = useCallback(async (payload: any) => {
    if (!currentStoreId) return;
    const { error } = await supabase.from('employees').insert({
      store_id: currentStoreId,
      name: payload.name,
      hourly_wage: payload.hourlyWage,
      employment_type: payload.employmentType === 'freelancer_33' ? 'freelancer' : 'employee',
      hire_date: payload.hireDate || null,
      is_active: true,
    });
    if (error) alert('추가 실패: ' + error.message);
    else await loadEmployees(currentStoreId);
  }, [currentStoreId, supabase, loadEmployees]);

  // 직원 삭제
  const handleDeleteEmployee = useCallback(async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return;
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) alert('삭제 실패: ' + error.message);
    else if (currentStoreId) await loadEmployees(currentStoreId);
  }, [currentStoreId, supabase, loadEmployees]);

  // 직원 수정
  const handleUpdateEmployee = useCallback(async (id: string, updates: Partial<Employee>) => {
    const { error } = await supabase.from('employees').update(updates).eq('id', id);
    if (error) {
      alert('수정 실패: ' + error.message);
    } else {
      alert('수정되었습니다.');
      if (currentStoreId) await loadEmployees(currentStoreId);
    }
  }, [supabase, currentStoreId, loadEmployees]);

  // 매장 생성
  const handleCreateStore = useCallback(async (name: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from('stores').insert({ name, owner_id: user.id }).select().single();
    if (error || !data) alert('생성 실패');
    else {
      const newStore = { id: String(data.id), name: data.name };
      setStores(prev => [...prev, newStore]);
      setCurrentStoreId(newStore.id);
      setCurrentTab('employees');
    }
  }, [supabase]);

  // 초기 로딩
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/'); return; }
      setUserEmail(user.email || '');
      await loadStores(user.id);
      setLoading(false);
    }
    init();
  }, [supabase, router, loadStores]);

  // 매장 변경 시
  useEffect(() => {
    if (currentStoreId) loadEmployees(currentStoreId);
  }, [currentStoreId, loadEmployees]);


  // 탭 렌더링
  const renderTabContent = () => {
    if (!currentStoreId) return <p style={{ color: '#aaa' }}>매장을 선택해주세요.</p>;

    if (currentTab === 'employees') {
      return (
        <EmployeeSection
          currentStoreId={currentStoreId}
          employees={employees}
          loadingEmployees={loadingEmployees}
          onCreateEmployee={handleCreateEmployee}
          onDeleteEmployee={handleDeleteEmployee}
          onUpdateEmployee={handleUpdateEmployee}
        />
      );
    }
    if (currentTab === 'schedules') {
      return (
        <div>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>스케줄 관리</h2>
          <TemplateSection currentStoreId={currentStoreId} />
        </div>
      );
    }
    
    // ✅ [수정됨] 급여 탭: StoreSettings를 지우고 PayrollSection으로 교체!
    if (currentTab === 'payroll') {
      return (
        <PayrollSection currentStoreId={currentStoreId} />
      );
    }
  };

  if (loading) return <main style={{ padding: 40, color: '#fff' }}>로딩 중...</main>;

  return (
    <main style={{ padding: 40, color: '#fff' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1>사장님 대시보드</h1>
        <UserBar email={userEmail} />
      </header>
      <section style={{ maxWidth: 900 }}>
        <StoreSelector
          stores={stores}
          currentStoreId={currentStoreId}
          onChangeStore={(id) => { setCurrentStoreId(id); setCurrentTab('employees'); }}
          creatingStore={creatingStore}
          onCreateStore={handleCreateStore}
          onDeleteStore={handleDeleteStore}
        />
        {stores.length > 0 && currentStoreId && (
          <div>
            <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #333', marginBottom: 16 }}>
              {[
                { key: 'employees', label: '직원 관리' },
                { key: 'schedules', label: '스케줄 관리' },
                { key: 'payroll', label: '급여 / 정산' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setCurrentTab(tab.key as TabKey)}
                  style={{
                    padding: '8px 14px',
                    borderBottom: currentTab === tab.key ? '2px solid dodgerblue' : '2px solid transparent',
                    background: 'transparent', color: currentTab === tab.key ? '#fff' : '#aaa',
                    border: 'none', cursor: 'pointer', fontWeight: currentTab === tab.key ? 600 : 400
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div>{renderTabContent()}</div>
          </div>
        )}
      </section>
    </main>
  );
}