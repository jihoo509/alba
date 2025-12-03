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

// ✅ 타입 정의
type Store = { 
  id: string; 
  name: string; 
  wage_system: 'hourly' | 'daily'; 
  is_large_store: boolean; 
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

  // ✅ 매장 설정 모달 상태
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // ✅ [신규] 초기 매장 생성 폼 상태
  const [newStoreName, setNewStoreName] = useState('');
  const [newWageSystem, setNewWageSystem] = useState<'hourly'|'daily'>('hourly');
  const [newIsLargeStore, setNewIsLargeStore] = useState(false);
  const [isCreatingFirst, setIsCreatingFirst] = useState(false);

  const [currentTab, setCurrentTab] = useState<TabKey>(
    (searchParams.get('tab') as TabKey) || 'home'
  );

  const [todayWorkers, setTodayWorkers] = useState<any[]>([]);
  const [monthlyEstPay, setMonthlyEstPay] = useState<number>(0);

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
    
    const list = (data ?? []).map((row: any) => ({ 
      id: String(row.id), 
      name: row.name,
      wage_system: row.wage_system || 'hourly', 
      is_large_store: row.is_large_store || false 
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
      const newStores = stores.filter((s) => s.id !== storeId);
      setStores(newStores);
      if (currentStoreId === storeId) { 
        setCurrentStoreId(newStores.length > 0 ? newStores[0].id : null); 
        setEmployees([]); 
      }
    }
  }, [supabase, currentStoreId, stores]);

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

  // ✅ [기존] StoreSelector용 (간편 생성 - 기본값 사용)
  const handleSimpleCreateStore = useCallback(async (name: string) => {
    await handleCreateStoreInternal(name, 'hourly', false);
  }, []);

  // ✅ [신규] 첫 매장 생성용 (상세 설정)
  const handleFirstCreateStore = async () => {
    if (!newStoreName.trim()) { alert('매장명을 입력해주세요.'); return; }
    setIsCreatingFirst(true);
    await handleCreateStoreInternal(newStoreName, newWageSystem, newIsLargeStore);
    setIsCreatingFirst(false);
  };

  // ✅ 통합 매장 생성 로직
  const handleCreateStoreInternal = async (name: string, wage: 'hourly'|'daily', large: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data, error } = await supabase
      .from('stores')
      .insert({ 
        name, 
        owner_id: user.id,
        wage_system: wage, 
        is_large_store: large
      })
      .select()
      .single();

    if (error) {
        alert('매장 생성 중 오류가 발생했습니다.');
        return;
    }

    if (data) {
      const newStore = { 
        id: String(data.id), 
        name: data.name, 
        wage_system: wage, 
        is_large_store: large 
      };
      setStores(prev => [...prev, newStore]);
      handleStoreChange(String(data.id));
    }
  };

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

  // ✅ [수정] 탭 내용 렌더링
  const renderTabContent = () => {
    // 1️⃣ 매장이 없는 경우: [초기 생성 카드] 표시 (가운데 영역)
    if (stores.length === 0) {
        return (
            <div style={{ maxWidth: 500, margin: '40px auto', padding: 30, backgroundColor: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <h2 style={{ textAlign: 'center', fontSize: 22, fontWeight: 'bold', marginBottom: 24, color: '#333' }}>
                    첫 번째 매장을 만들어볼까요? 🏪
                </h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* 매장명 */}
                    <div>
                        <label style={{ display: 'block', fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 8 }}>매장 이름</label>
                        <input 
                            type="text" 
                            placeholder="예: 무유무유 수원점"
                            value={newStoreName}
                            onChange={(e) => setNewStoreName(e.target.value)}
                            style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 16 }}
                        />
                    </div>

                    {/* 급여 방식 */}
                    <div>
                        <label style={{ display: 'block', fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 8 }}>급여 방식</label>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button 
                                onClick={() => setNewWageSystem('hourly')}
                                style={{ 
                                    flex: 1, padding: '10px', borderRadius: 8, border: '1px solid',
                                    backgroundColor: newWageSystem === 'hourly' ? '#eef6ff' : '#fff',
                                    borderColor: newWageSystem === 'hourly' ? '#0064FF' : '#ddd',
                                    color: newWageSystem === 'hourly' ? '#0064FF' : '#666',
                                    fontWeight: newWageSystem === 'hourly' ? 'bold' : 'normal',
                                    cursor: 'pointer'
                                }}
                            >
                                ⏱️ 시급제
                            </button>
                            <button 
                                onClick={() => setNewWageSystem('daily')}
                                style={{ 
                                    flex: 1, padding: '10px', borderRadius: 8, border: '1px solid',
                                    backgroundColor: newWageSystem === 'daily' ? '#eef6ff' : '#fff',
                                    borderColor: newWageSystem === 'daily' ? '#0064FF' : '#ddd',
                                    color: newWageSystem === 'daily' ? '#0064FF' : '#666',
                                    fontWeight: newWageSystem === 'daily' ? 'bold' : 'normal',
                                    cursor: 'pointer'
                                }}
                            >
                                🗓️ 일당제
                            </button>
                        </div>
                    </div>

                    {/* 규모 */}
                    <div>
                        <label style={{ display: 'block', fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 8 }}>사업장 규모</label>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button 
                                onClick={() => setNewIsLargeStore(false)}
                                style={{ 
                                    flex: 1, padding: '10px', borderRadius: 8, border: '1px solid',
                                    backgroundColor: !newIsLargeStore ? '#eef6ff' : '#fff',
                                    borderColor: !newIsLargeStore ? '#0064FF' : '#ddd',
                                    color: !newIsLargeStore ? '#0064FF' : '#666',
                                    fontWeight: !newIsLargeStore ? 'bold' : 'normal',
                                    cursor: 'pointer'
                                }}
                            >
                                🐣 5인 미만
                            </button>
                            <button 
                                onClick={() => setNewIsLargeStore(true)}
                                style={{ 
                                    flex: 1, padding: '10px', borderRadius: 8, border: '1px solid',
                                    backgroundColor: newIsLargeStore ? '#eef6ff' : '#fff',
                                    borderColor: newIsLargeStore ? '#0064FF' : '#ddd',
                                    color: newIsLargeStore ? '#0064FF' : '#666',
                                    fontWeight: newIsLargeStore ? 'bold' : 'normal',
                                    cursor: 'pointer'
                                }}
                            >
                                🏢 5인 이상
                            </button>
                        </div>
                        <p style={{ fontSize: 12, color: '#888', marginTop: 6 }}>
                            * 5인 이상일 경우 야간/연장/휴일 수당이 자동 계산됩니다.
                        </p>
                    </div>

                    <button 
                        onClick={handleFirstCreateStore}
                        disabled={isCreatingFirst}
                        style={{ 
                            width: '100%', padding: '14px', backgroundColor: '#0064FF', color: '#fff', 
                            fontSize: 16, fontWeight: 'bold', borderRadius: 8, border: 'none', cursor: 'pointer', marginTop: 10
                        }}
                    >
                        {isCreatingFirst ? '생성 중...' : '매장 만들기 완료'}
                    </button>
                </div>
            </div>
        );
    }

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

            {/* ✅ [수정] 매장이 있을 때만 상단 선택바 노출 (없으면 가운데 카드 사용) */}
            {stores.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <StoreSelector
                      stores={stores}
                      currentStoreId={currentStoreId}
                      onChangeStore={handleStoreChange}
                      creatingStore={creatingStore}
                      onCreateStore={handleSimpleCreateStore}
                      onDeleteStore={handleDeleteStore}
                    />
                  </div>
                  
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
                         onClick={() => setIsSettingsOpen(true)}
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
            )}
          </div>

          {/* 🟢 [메뉴 탭] (매장 있을 때만 노출) */}
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
        {/* 매장이 0개여도 렌더링 함수 실행 (거기서 분기 처리) */}
        <div style={{ width: '100%' }} className={currentTab === 'schedules' ? 'shrink-on-mobile' : ''}>
          {renderTabContent()}
        </div>
      </div>

      {/* 튜토리얼 (매장이 있을 때만) */}
      {stores.length > 0 && (
          <TutorialModal 
            tutorialKey="seen_home_tutorial_v1"
            steps={[
              {
                title: "환영합니다, 사장님! 👋",
                description: "Easy Alba에 오신 것을 환영합니다. 매장 관리의 모든 것을 쉽고 편하게 도와드릴게요.",
              },
              // ... 기존 내용 ...
              {
                title: "준비 되셨나요?",
                description: "이제 복잡한 급여 계산과 스케줄 관리는 저희에게 맡기고, 사업에만 집중하세요!",
              }
            ]}
          />
      )}

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