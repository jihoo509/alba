'use client';

import React, { useEffect, useMemo, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import UserBar from '@/components/UserBar';
import { StoreSelector } from '@/components/StoreSelector';
import { EmployeeSection } from '@/components/EmployeeSection';
import TemplateSection from '@/components/TemplateSection'; 
import PayrollSection from '@/components/PayrollSection';
import { format } from 'date-fns';
import { calculateMonthlyPayroll } from '@/lib/payroll';

type Store = { id: string; name: string; };

type TabKey = 'home' | 'employees' | 'schedules' | 'payroll';

export type Employee = {
  id: string; name: string; hourly_wage: number; employment_type: 'freelancer' | 'employee';
  is_active: boolean; hire_date?: string; phone_number?: string; birth_date?: string;
  bank_name?: string; account_number?: string; end_date?: string;
};

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [currentStoreId, setCurrentStoreId] = useState<string | null>(null);
  const [creatingStore, setCreatingStore] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  const [currentTab, setCurrentTab] = useState<TabKey>(
    (searchParams.get('tab') as TabKey) || 'home'
  );

  const [todayWorkers, setTodayWorkers] = useState<any[]>([]);
  const [monthlyEstPay, setMonthlyEstPay] = useState<number>(0);

  const updateUrl = (tab: TabKey, storeId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab) params.set('tab', tab);
    if (storeId) params.set('storeId', storeId);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleTabChange = (tab: TabKey) => {
    setCurrentTab(tab);
    updateUrl(tab, currentStoreId);
  };

  const handleStoreChange = (storeId: string) => {
    setCurrentStoreId(storeId);
    setCurrentTab('home'); 
    updateUrl('home', storeId);
  };

  const loadStores = useCallback(async (userId: string) => {
    const { data, error } = await supabase.from('stores').select('*').eq('owner_id', userId);
    if (error) { setErrorMsg('매장 로딩 실패'); return; }
    const list = (data ?? []).map((row: any) => ({ id: String(row.id), name: row.name }));
    setStores(list);

    const urlStoreId = searchParams.get('storeId');
    const targetStore = list.find(s => s.id === urlStoreId);

    if (targetStore) {
      setCurrentStoreId(targetStore.id);
    } else if (list.length > 0 && !currentStoreId) {
      setCurrentStoreId(list[0].id);
    }
  }, [supabase, currentStoreId, searchParams]);

  const handleDeleteStore = useCallback(async (storeId: string) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('stores').delete().eq('id', storeId);
    if (error) alert('삭제 실패');
    else {
      setStores((prev) => prev.filter((s) => s.id !== storeId));
      if (currentStoreId === storeId) { setCurrentStoreId(null); setEmployees([]); }
    }
  }, [supabase, currentStoreId]);

  const loadEmployees = useCallback(async (storeId: string) => {
    setLoadingEmployees(true);
    const { data } = await supabase.from('employees').select('*').eq('store_id', storeId).order('created_at', { ascending: true });
    if (data) {
      setEmployees(data.map((row: any) => ({
        id: String(row.id), name: row.name, hourly_wage: row.hourly_wage, employment_type: row.employment_type,
        is_active: row.is_active, hire_date: row.hire_date, phone_number: row.phone_number,
        birth_date: row.birth_date, bank_name: row.bank_name, account_number: row.account_number, end_date: row.end_date,
      })));
    }
    setLoadingEmployees(false);
  }, [supabase]);

  const loadHomeStats = useCallback(async (storeId: string) => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');

    const { data: todayData } = await supabase
      .from('schedules')
      .select('*, employees(name, phone_number)')
      .eq('store_id', storeId)
      .eq('date', todayStr)
      .order('start_time', { ascending: true });

    if (todayData) setTodayWorkers(todayData);
    else setTodayWorkers([]);

    const { data: storeSettings } = await supabase.from('stores').select('*').eq('id', storeId).single();
    const { data: allEmployees } = await supabase.from('employees').select('*').eq('store_id', storeId);
    
    const fetchStart = format(new Date(today.getFullYear(), today.getMonth() - 1, 20), 'yyyy-MM-dd');
    const fetchEnd = format(new Date(today.getFullYear(), today.getMonth() + 1, 10), 'yyyy-MM-dd');

    const { data: monthSchedules } = await supabase
      .from('schedules')
      .select('*')
      .eq('store_id', storeId)
      .gte('date', fetchStart)
      .lte('date', fetchEnd);

    if (storeSettings && allEmployees && monthSchedules) {
      const payrollResult = calculateMonthlyPayroll(
        today.getFullYear(), today.getMonth() + 1, allEmployees, monthSchedules, storeSettings
      );
      const totalEst = payrollResult.reduce((acc, p) => acc + p.totalPay, 0);
      setMonthlyEstPay(totalEst);
    }

  }, [supabase]);

  const handleCreateEmployee = useCallback(async (payload: any) => {
    if (!currentStoreId) return;
    const { error } = await supabase.from('employees').insert({
      store_id: currentStoreId,
      name: payload.name,
      hourly_wage: payload.hourlyWage,
      employment_type: payload.employmentType,
      hire_date: payload.hireDate || null,
      is_active: true,
    });
    if (error) alert('추가 실패'); else await loadEmployees(currentStoreId);
  }, [currentStoreId, supabase, loadEmployees]);

  const handleDeleteEmployee = useCallback(async (id: string) => {
    if (!confirm('삭제?')) return;
    await supabase.from('employees').delete().eq('id', id);
    if (currentStoreId) await loadEmployees(currentStoreId);
  }, [currentStoreId, supabase, loadEmployees]);

  const handleUpdateEmployee = useCallback(async (id: string, updates: Partial<Employee>) => {
    await supabase.from('employees').update(updates).eq('id', id);
    if (currentStoreId) await loadEmployees(currentStoreId);
  }, [supabase, currentStoreId, loadEmployees]);

  const handleCreateStore = useCallback(async (name: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('stores').insert({ name, owner_id: user.id }).select().single();
    if (data) {
      const newStore = { id: String(data.id), name: data.name };
      setStores(prev => [...prev, newStore]);
      handleStoreChange(String(data.id));
    }
  }, [supabase]);

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

  useEffect(() => {
    if (currentStoreId) {
      loadEmployees(currentStoreId);
      loadHomeStats(currentStoreId);
    }
  }, [currentStoreId, loadEmployees, loadHomeStats]);

  const renderTabContent = () => {
    if (!currentStoreId) return <p style={{ color: '#ddd', textAlign: 'center', marginTop: 40 }}>매장을 선택해주세요.</p>;

    if (currentTab === 'home') {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0, marginBottom: 16, borderBottom: '1px solid #eee', paddingBottom: 8, color: '#000' }}>
              📅 오늘 근무자 <span style={{fontSize:14, color:'dodgerblue'}}>({todayWorkers.length}명)</span>
            </h3>
            {todayWorkers.length === 0 ? (
              <p style={{ color: '#888', textAlign: 'center', padding: 20 }}>오늘 예정된 근무가 없습니다.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {todayWorkers.map(w => (
                  <li key={w.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #eee' }}>
                    <div>
                      <strong style={{ fontSize: 16, color: '#000' }}>{w.employees?.name || '미배정'}</strong>
                      <span style={{ color: '#666', fontSize: 13, marginLeft: 8 }}>{w.employees?.phone_number}</span>
                    </div>
                    <div style={{ color: 'dodgerblue', fontWeight: 'bold' }}>
                      {w.start_time.slice(0,5)} ~ {w.end_time.slice(0,5)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 16, color: '#555' }}>💰 11월 예상 급여 지출 (세전)</h3>
            <div style={{ fontSize: 32, fontWeight: 'bold', color: '#000' }}>{monthlyEstPay.toLocaleString()} <span style={{ fontSize: 20 }}>원</span></div>
          </div>
        </div>
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
          onUpdateEmployee={handleUpdateEmployee}
        />
      );
    }
    if (currentTab === 'schedules') {
      return (
        <div>
          <h2 style={{ fontSize: 24, marginBottom: 8, color: '#fff', fontWeight: 'bold' }}>스케줄 관리</h2>
          <p style={{ color: '#ddd', marginBottom: 32 }}>월간 스케줄을 확인하고 관리합니다.</p>
          
          <TemplateSection currentStoreId={currentStoreId} />
        </div>
      );
    }
    if (currentTab === 'payroll') {
      return <PayrollSection currentStoreId={currentStoreId} />;
    }
  };

  if (loading) return <main style={{ padding: 40, color: '#fff' }}>로딩 중...</main>;

  return (
    <main style={{ padding: '40px 20px', maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ 
          fontSize: 36,         
          color: '#fff',        
          fontWeight: '900',    
          letterSpacing: '-1px',
          margin: 0,
          fontFamily: 'sans-serif' 
        }}>
          Easy Alba
        </h1>
        <UserBar email={userEmail} />
      </header>

      {errorMsg && <div style={{ marginBottom: 16, color: 'salmon' }}>{errorMsg}</div>}

      <section>
        <StoreSelector
          stores={stores}
          currentStoreId={currentStoreId}
          onChangeStore={handleStoreChange}
          creatingStore={creatingStore}
          onCreateStore={handleCreateStore}
          onDeleteStore={handleDeleteStore}
        />

        {stores.length > 0 && currentStoreId && (
          <div>
            {/* ✅ [수정] 탭 메뉴: 가운데 정렬, 여백 추가, 이모티콘, 모바일 줄바꿈(wrap) */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', // 가운데 정렬
              flexWrap: 'wrap',         // 모바일 등 공간 부족 시 줄바꿈
              gap: 20,                  // 버튼 사이 간격 늘림
              marginTop: 40,            // 위쪽 여백 넉넉하게
              marginBottom: 40,         // 아래쪽 여백 넉넉하게
              borderBottom: '1px solid rgba(255,255,255,0.2)', 
              paddingBottom: 20         // 구분선과 버튼 사이 간격
            }}>
              {[
                { key: 'home', label: '🏠 홈' },
                { key: 'employees', label: '👥 직원 관리' },     // 이모티콘 추가
                { key: 'schedules', label: '🗓️ 스케줄 관리' },   // 이모티콘 추가
                { key: 'payroll', label: '💰 급여 / 정산' }      // 이모티콘 추가
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key as TabKey)}
                  style={{
                    padding: '12px 24px', 
                    border: 'none',
                    borderBottom: currentTab === tab.key ? '3px solid dodgerblue' : '3px solid transparent',
                    background: 'transparent',
                    color: currentTab === tab.key ? '#fff' : '#aaa', // 활성 흰색, 비활성 회색
                    cursor: 'pointer',
                    fontSize: 16, // 글자 크기 적절히
                    fontWeight: currentTab === tab.key ? 'bold' : 'normal',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap' // 텍스트 줄바꿈 방지
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

// ✅ 카드 스타일
const cardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: 8,
  padding: 24,
  border: '1px solid #ddd',
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: '#fff' }}>대시보드 로딩 중...</div>}>
      <DashboardContent />
    </Suspense>
  );
}