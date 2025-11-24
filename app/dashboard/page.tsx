'use client';

import React, { useEffect, useMemo, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import UserBar from '@/components/UserBar';
import { StoreSelector } from '@/components/StoreSelector';
import { EmployeeSection } from '@/components/EmployeeSection';
import TemplateSection from '@/components/TemplateSection';
import PayrollSection from '@/components/PayrollSection';
import { format, startOfMonth, endOfMonth } from 'date-fns'; // 날짜 헬퍼 추가
// ✅ [추가] 급여 계산 엔진 가져오기
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

  // 홈 화면용 상태
  const [todayWorkers, setTodayWorkers] = useState<any[]>([]);
  const [monthlyEstPay, setMonthlyEstPay] = useState<number>(0); // ✅ 이번 달 예상 급여

  const handleTabChange = (tab: TabKey) => {
    setCurrentTab(tab);
    router.replace(`${pathname}?tab=${tab}`);
  };

  const loadStores = useCallback(async (userId: string) => {
    const { data, error } = await supabase.from('stores').select('*').eq('owner_id', userId);
    if (error) { setErrorMsg('매장 로딩 실패'); return; }
    const list = (data ?? []).map((row: any) => ({ id: String(row.id), name: row.name }));
    setStores(list);
    if (list.length > 0 && !currentStoreId) setCurrentStoreId(list[0].id);
  }, [supabase, currentStoreId]);

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

  // ✅ [수정] 홈 화면 데이터 통합 로딩 (오늘 근무자 + 이번 달 급여)
  const loadHomeStats = useCallback(async (storeId: string) => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');

    // 1. 오늘 근무자 조회
    const { data: todayData } = await supabase
      .from('schedules')
      .select('*, employees(name, phone_number)')
      .eq('store_id', storeId)
      .eq('date', todayStr)
      .order('start_time', { ascending: true });

    if (todayData) setTodayWorkers(todayData);
    else setTodayWorkers([]);

    // 2. 이번 달 예상 급여 계산
    // (매장 설정 + 직원 목록 + 이번 달 전체 스케줄 필요)
    const { data: storeSettings } = await supabase.from('stores').select('*').eq('id', storeId).single();
    const { data: allEmployees } = await supabase.from('employees').select('*').eq('store_id', storeId);
    
    const startOfMonthStr = format(startOfMonth(today), 'yyyy-MM-dd');
    const endOfMonthStr = format(endOfMonth(today), 'yyyy-MM-dd');

    // 넉넉하게 전월 20일 ~ 익월 10일까지 가져와서 계산기에 넣음 (주휴수당 정확도 위해)
    // 하지만 홈 화면에서는 '대략적인 예상'이므로 이번 달 1일~말일 데이터만 있어도 충분히 유의미함.
    // 계산기 엔진(calculateMonthlyPayroll)을 재활용하기 위해 데이터를 맞춰줌.
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
        today.getFullYear(), 
        today.getMonth() + 1, 
        allEmployees, 
        monthSchedules, 
        storeSettings
      );
      
      // 총 지급액(세전) 합계
      const totalEst = payrollResult.reduce((acc, p) => acc + p.totalPay, 0);
      setMonthlyEstPay(totalEst);
    }

  }, [supabase]);

// [수정 후] - 이제 payload 안에 이미 올바른 이름이 들어있다고 가정합니다.
const handleCreateEmployee = useCallback(async (payload: any) => {
    if (!currentStoreId) return;
    
    const { error } = await supabase.from('employees').insert({
      store_id: currentStoreId,
      name: payload.name,
      hourly_wage: payload.hourly_wage,        // ✅ 그대로 사용
      employment_type: payload.employment_type, // ✅ 그대로 사용
      hire_date: payload.hire_date,             // ✅ 그대로 사용
      is_active: true,
    });

    if (error) {
      console.error('create employee error:', error);
      alert('직원 추가 실패: ' + error.message);
    } else {
      await loadEmployees(currentStoreId);
    }
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
      setCurrentStoreId(newStore.id);
      handleTabChange('employees');
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
      loadHomeStats(currentStoreId); // ✅ 홈 데이터 로딩
    }
  }, [currentStoreId, loadEmployees, loadHomeStats]);

  const renderTabContent = () => {
    if (!currentStoreId) return <p style={{ color: '#aaa', textAlign: 'center', marginTop: 40 }}>매장을 선택해주세요.</p>;

    if (currentTab === 'home') {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* 왼쪽: 오늘 근무자 */}
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0, marginBottom: 16, borderBottom: '1px solid #444', paddingBottom: 8 }}>
              📅 오늘 근무자 <span style={{fontSize:14, color:'dodgerblue'}}>({todayWorkers.length}명)</span>
            </h3>
            {todayWorkers.length === 0 ? (
              <p style={{ color: '#777', textAlign: 'center', padding: 20 }}>오늘 예정된 근무가 없습니다.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {todayWorkers.map(w => (
                  <li key={w.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #333' }}>
                    <div>
                      <strong style={{ fontSize: 16, color: '#fff' }}>{w.employees?.name || '미배정'}</strong>
                      <span style={{ color: '#aaa', fontSize: 13, marginLeft: 8 }}>{w.employees?.phone_number}</span>
                    </div>
                    <div style={{ color: 'dodgerblue', fontWeight: 'bold' }}>
                      {w.start_time.slice(0,5)} ~ {w.end_time.slice(0,5)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 오른쪽: 요약 및 공지 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* ✅ [추가] 이번 달 예상 급여 카드 */}
            <div style={cardStyle}>
              <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 16, color: '#aaa' }}>
                💰 11월 예상 급여 지출 (세전)
              </h3>
              <div style={{ fontSize: 32, fontWeight: 'bold', color: '#fff' }}>
                {monthlyEstPay.toLocaleString()} <span style={{ fontSize: 20 }}>원</span>
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: 13, color: '#666' }}>
                * 현재까지 확정된 스케줄 기준 (주휴/야간 포함)
              </p>
            </div>

            {/* 공지사항 */}
            <div style={cardStyle}>
              <h3 style={{ marginTop: 0, marginBottom: 12, borderBottom: '1px solid #444', paddingBottom: 8 }}>
                📢 시스템 공지사항
              </h3>
              <ul style={{ paddingLeft: 20, color: '#ccc', lineHeight: 1.6, fontSize: 14, margin: 0 }}>
                <li>[Tip] 급여 탭에서 <strong>명세서 이미지 저장</strong>이 가능합니다.</li>
                <li>[안내] <strong>주간 스케줄 자동 생성</strong> 기능이 추가되었습니다.</li>
              </ul>
            </div>
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
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>스케줄 관리</h2>
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
        <h1 style={{ fontSize: 24 }}>사장님 대시보드</h1>
        <UserBar email={userEmail} />
      </header>

      {errorMsg && <div style={{ marginBottom: 16, color: 'salmon' }}>{errorMsg}</div>}

      <section>
        <StoreSelector
          stores={stores}
          currentStoreId={currentStoreId}
          onChangeStore={(id) => { setCurrentStoreId(id); handleTabChange('home'); }}
          creatingStore={creatingStore}
          onCreateStore={handleCreateStore}
          onDeleteStore={handleDeleteStore}
        />

        {stores.length > 0 && currentStoreId && (
          <div>
            <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #333', marginBottom: 24 }}>
              {[
                { key: 'home', label: '🏠 홈' },
                { key: 'employees', label: '직원 관리' },
                { key: 'schedules', label: '스케줄 관리' },
                { key: 'payroll', label: '급여 / 정산' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key as TabKey)}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderBottom: currentTab === tab.key ? '3px solid dodgerblue' : '3px solid transparent',
                    background: 'transparent',
                    color: currentTab === tab.key ? '#fff' : '#888',
                    cursor: 'pointer',
                    fontSize: 15,
                    fontWeight: currentTab === tab.key ? 'bold' : 'normal'
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

const cardStyle = {
  backgroundColor: '#1f1f1f',
  borderRadius: 8,
  padding: 24,
  border: '1px solid #333',
  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: '#fff' }}>대시보드 로딩 중...</div>}>
      <DashboardContent />
    </Suspense>
  );
}