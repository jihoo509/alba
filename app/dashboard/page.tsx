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
import TutorialModal from '@/components/TutorialModal';
// import StoreSettingsModal from '@/components/StoreSettingsModal'; // ✅ 추후 만들 설정 모달

// ✅ [변경] Store 타입에 wage_system, is_large_store 추가
type Store = { 
  id: string; 
  name: string; 
  wage_system: 'hourly' | 'daily'; // 시급제 vs 일당제
  is_large_store: boolean; // 5인 이상 여부
};

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

  // ✅ [추가] 매장 설정 모달 상태 (추후 구현할 컴포넌트용)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [currentTab, setCurrentTab] = useState<TabKey>(
    (searchParams.get('tab') as TabKey) || 'home'
  );

  const [todayWorkers, setTodayWorkers] = useState<any[]>([]);
  const [monthlyEstPay, setMonthlyEstPay] = useState<number>(0);

  // ✅ 현재 선택된 매장 객체 찾기 (편의용)
  const currentStore = useMemo(() => 
    stores.find(s => s.id === currentStoreId), 
  [stores, currentStoreId]);

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
    
    // ✅ [변경] DB에서 가져온 wage_system, is_large_store 매핑
    const list = (data ?? []).map((row: any) => ({ 
      id: String(row.id), 
      name: row.name,
      wage_system: row.wage_system || 'hourly', // 없으면 기본 시급제
      is_large_store: row.is_large_store || false // 없으면 기본 5인 미만
    }));
    setStores(list);

    const urlStoreId = searchParams.get('storeId');
    const targetStore = list.find((s: Store) => s.id === urlStoreId);

    if (targetStore) {
      setCurrentStoreId(targetStore.id);
    } else if (list.length > 0 && !currentStoreId) {
      setCurrentStoreId(list[0].id);
    }
  }, [supabase, currentStoreId, searchParams]);

  const handleDeleteStore = useCallback(async (storeId: string) => {
    if (!window.confirm('정말 매장을 삭제하시겠습니까? 모든 데이터가 사라집니다.')) return;
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
    if (!confirm('삭제하시겠습니까?')) return;
    await supabase.from('employees').delete().eq('id', id);
    if (currentStoreId) await loadEmployees(currentStoreId);
  }, [currentStoreId, supabase, loadEmployees]);

  const handleUpdateEmployee = useCallback(async (id: string, updates: Partial<Employee>) => {
    await supabase.from('employees').update(updates).eq('id', id);
    if (currentStoreId) await loadEmployees(currentStoreId);
  }, [supabase, currentStoreId, loadEmployees]);

  // ✅ [수정] 매장 생성 시 기본값 설정 (시급제/5인미만)
  const handleCreateStore = useCallback(async (name: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('stores')
      .insert({ 
        name, 
        owner_id: user.id,
        wage_system: 'hourly', // 기본값
        is_large_store: false  // 기본값
      })
      .select()
      .single();

    if (data) {
      const newStore = { 
        id: String(data.id), 
        name: data.name, 
        wage_system: 'hourly' as const, 
        is_large_store: false 
      };
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

  // ✅ [추가] 매장이 0개일 때 보여줄 'Empty State' 컴포넌트
  const renderEmptyState = () => (
    <div style={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
      minHeight: '80vh', textAlign: 'center', padding: 20 
    }}>
      <h2 style={{ fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 12 }}>
        환영합니다, 사장님! 🎉
      </h2>
      <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 32, lineHeight: 1.5 }}>
        아직 등록된 매장이 없습니다.<br/>
        매장을 추가하고 직원/급여 관리를 시작해보세요.
      </p>
      
      {/* 중앙 큰 버튼 (StoreSelector 내부 로직 재사용을 위해 임시 UI. 실제론 StoreSelector가 동작해야 함) */}
      <div style={{ backgroundColor: '#fff', padding: 30, borderRadius: 16, width: '100%', maxWidth: 400 }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>내 매장 만들기</h3>
        <StoreSelector
          stores={stores}
          currentStoreId={null} // 선택된 것 없음
          onChangeStore={() => {}}
          creatingStore={creatingStore}
          onCreateStore={handleCreateStore}
          onDeleteStore={() => {}}
          isFullWidth={true} // ✅ 스타일 확장을 위해 prop 추가 가능 (선택사항)
        />
      </div>
    </div>
  );

  const renderTabContent = () => {
    if (!currentStoreId) return <p style={{ color: '#ddd', textAlign: 'center', marginTop: 40 }}>매장을 선택해주세요.</p>;

    if (currentTab === 'home') {
      return (
        <div style={{ maxWidth: 1000, margin: '0 auto', width: '100%' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: 24, 
            alignItems: 'start' 
          }}>
            {/* 카드 1: 오늘 근무자 */}
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

            {/* 카드 2: 급여 지출 */}
            <div style={cardStyle}>
              <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 16, color: '#555' }}>💰 11월 예상 급여 지출 (세전)</h3>
              <div style={{ fontSize: 32, fontWeight: 'bold', color: '#000' }}>{monthlyEstPay.toLocaleString()} <span style={{ fontSize: 20 }}>원</span></div>
            </div>

            <div style={cardStyle}>
              <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 16, color: '#e67e22' }}>💡 사장님 필수 상식</h3>
              <p style={{ color: '#333', lineHeight: '1.6' }}>
                <strong>주휴수당이란?</strong><br/>
                1주일에 15시간 이상 근무하고 개근한 근로자에게는 하루치 임금을 추가로 지급해야 합니다.
              </p>
            </div>
          </div>
        </div>
      );
    }
    if (currentTab === 'employees') {
      return (
        <div style={{ maxWidth: 750, margin: '0 auto', width: '100%' }}>
          <EmployeeSection
            currentStoreId={currentStoreId}
            employees={employees}
            loadingEmployees={loadingEmployees}
            onCreateEmployee={handleCreateEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            onUpdateEmployee={handleUpdateEmployee}
          />
        </div>
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

  // ✅ [수정] 매장이 하나도 없으면 초기 화면(Empty State) 렌더링
  if (stores.length === 0) {
    return (
      <main style={{ width: '100%', minHeight: '100vh', backgroundColor: '#0064FF' }}> {/* 배경색은 global css에 있다면 제거 가능 */}
         {/* 간단한 헤더 */}
         <header style={{ padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontSize: 24, color: '#fff', fontWeight: 'bold', margin: 0 }}>Easy Alba</h1>
            <UserBar email={userEmail} />
         </header>
         {renderEmptyState()}
      </main>
    );
  }

  return (
    <main style={{ width: '100%', minHeight: '100vh', paddingBottom: 40 }}>
      
      {/* 🔴 [헤더 영역] */}
      <div className="header-wrapper">
        <div style={{ width: '100%', maxWidth: '750px', margin: '0 auto', boxSizing: 'border-box' }}>
          
          <div style={{ padding: '12px 20px 0 20px' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h1 className="mobile-logo-text" style={{ fontSize: 28, color: '#fff', fontWeight: '900', letterSpacing: '-1px', margin: 0, fontFamily: 'sans-serif' }}>
                Easy Alba
              </h1>
              <UserBar email={userEmail} />
            </header>

            {errorMsg && <div style={{ marginBottom: 10, color: 'salmon' }}>{errorMsg}</div>}

            {/* ✅ [수정] 상단 매장 정보 및 설정 버튼 영역 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <StoreSelector
                  stores={stores}
                  currentStoreId={currentStoreId}
                  onChangeStore={handleStoreChange}
                  creatingStore={creatingStore}
                  onCreateStore={handleCreateStore}
                  onDeleteStore={handleDeleteStore}
                />
              </div>
              
              {/* 매장 설정(수정) 버튼 */}
              {currentStore && (
                <div style={{ marginLeft: 10, textAlign: 'right' }}>
                   <div style={{ display: 'flex', gap: 6, marginBottom: 4, justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: 12, backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', padding: '2px 6px', borderRadius: 4 }}>
                        {currentStore.wage_system === 'daily' ? '일당제' : '시급제'}
                      </span>
                      <span style={{ fontSize: 12, backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', padding: '2px 6px', borderRadius: 4 }}>
                        {currentStore.is_large_store ? '5인이상' : '5인미만'}
                      </span>
                   </div>
                   <button 
                     onClick={() => setIsSettingsOpen(true)} // 여기서 모달 열기
                     style={{ 
                       background: 'none', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', 
                       fontSize: 12, padding: '4px 8px', borderRadius: 4, cursor: 'pointer' 
                     }}
                   >
                     ⚙️ 매장 설정
                   </button>
                </div>
              )}
            </div>
          </div>

          {/* 🟢 [메뉴 탭] */}
          {stores.length > 0 && currentStoreId && (
            <div className="mobile-sticky-nav">
              <div className="mobile-tab-container" style={{ 
                display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 15, 
                padding: '12px 20px', maxWidth: '750px', margin: '0 auto' 
              }}>
                {[
                  { key: 'home', label: '🏠 홈' },
                  { key: 'employees', label: '👥 직원' },     
                  { key: 'schedules', label: '🗓️ 스케줄' },   
                  { key: 'payroll', label: '💰 급여' }      
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => handleTabChange(tab.key as TabKey)}
                    className="mobile-tab-btn"
                    style={{
                      padding: '8px 16px', border: 'none', background: 'transparent', cursor: 'pointer', 
                      fontSize: 15, transition: 'all 0.2s', whiteSpace: 'nowrap',
                      borderBottom: currentTab === tab.key ? '3px solid #fff' : '3px solid transparent',
                      color: currentTab === tab.key ? '#fff' : 'rgba(255,255,255,0.7)', 
                      fontWeight: currentTab === tab.key ? 'bold' : 'normal',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 🔵 [콘텐츠 영역] */}
      <div 
        className="content-spacer"
        style={{ 
          width: '100%', maxWidth: '1000px', margin: '0 auto', 
          paddingLeft: '20px', paddingRight: '20px', 
          boxSizing: 'border-box' 
        }}
      >
        {stores.length > 0 && currentStoreId && (
          <div style={{ width: '100%' }} className={currentTab === 'schedules' ? 'shrink-on-mobile' : ''}>
            {renderTabContent()}
          </div>
        )}
      </div>

      <TutorialModal 
        tutorialKey="seen_home_tutorial_v1"
        steps={[
          {
            title: "환영합니다, 사장님! 👋",
            description: "Easy Alba에 오신 것을 환영합니다. 매장 관리의 모든 것을 쉽고 편하게 도와드릴게요.",
          },
          // ... 기존 튜토리얼 내용 유지
          {
            title: "준비 되셨나요?",
            description: "이제 복잡한 급여 계산과 스케줄 관리는 저희에게 맡기고, 사업에만 집중하세요!",
          }
        ]}
      />
      
      {/* ✅ [TODO] 매장 설정/수정 모달 위치
        <StoreSettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)}
          store={currentStore}
          onUpdate={loadStores} 
        />
      */}

    </main>
  );
}

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