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
import AdditionalInfoModal from '@/components/AdditionalInfoModal';
import AccountSettingsModal from '@/components/AccountSettingsModal';
import InitialStoreSetup from '@/components/InitialStoreSetup'; // ✅ [추가] 초기 설정 컴포넌트

type Store = { id: string; name: string; };

type TabKey = 'home' | 'employees' | 'schedules' | 'payroll';

export type Employee = {
  id: string; 
  name: string; 
  hourly_wage: number; 
  employment_type: 'freelancer' | 'employee' | 'freelancer_33' | 'four_insurance';
  is_active: boolean; 
  hire_date?: string; 
  phone_number?: string; 
  birth_date?: string;
  bank_name?: string; 
  account_number?: string; 
  end_date?: string;
  pay_type?: string;          
  daily_wage?: number;       
  default_daily_pay?: number; 
};

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null); // ✅ [추가] userId 상태
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState(''); 
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [currentStoreId, setCurrentStoreId] = useState<string | null>(null);
  const [creatingStore, setCreatingStore] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // 모달 상태들
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

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

  const loadStores = useCallback(async (uid: string) => {
    const { data, error } = await supabase.from('stores').select('*').eq('owner_id', uid); // ✅ user_id -> owner_id 확인 필요 (DB 컬럼명에 따름)
    if (error) { setErrorMsg('매장 로딩 실패'); return; }
    
    // id를 문자열로 변환
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
        pay_type: row.pay_type || 'time',
        daily_wage: row.daily_wage || 0,
        default_daily_pay: row.daily_wage || 0,
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
      pay_type: payload.pay_type || 'time',
      daily_wage: payload.default_daily_pay || 0,
    });
    if (error) alert('추가 실패'); else await loadEmployees(currentStoreId);
  }, [currentStoreId, supabase, loadEmployees]);

  const handleDeleteEmployee = useCallback(async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
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

  const handleUpdateInfo = async (password: string, phone: string) => {
    try {
      setUpdateLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: password,
        data: { phone: phone } 
      });
      if (error) throw error;
      
      alert('정보가 성공적으로 등록되었습니다.');
      setShowAdditionalInfo(false);
    } catch (e: any) {
      alert('정보 저장 중 오류가 발생했습니다: ' + e.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/'); return; }
      
      const user = session.user;
      setUserId(user.id); // ✅ [추가] userId 저장
      setUserEmail(user.email || '');
      setUserPhone(user.user_metadata?.phone || ''); 

      const userPhone = user.user_metadata?.phone;
      if (!userPhone) {
        setShowAdditionalInfo(true);
      }

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
    // ✅ [수정] 매장이 없는 경우의 UI는 메인 로직에서 InitialStoreSetup으로 대체됨
    // 여기서는 매장이 있지만 선택되지 않은 에러 상황만 처리
    if (!currentStoreId) return null;

    if (currentTab === 'home') {
      return (
        <div style={{ maxWidth: 1000, margin: '0 auto', width: '100%' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: 24, 
            alignItems: 'start'
          }}>
            
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
          <TemplateSection 
            currentStoreId={currentStoreId} 
            employees={employees} 
          />
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
      
      <div className="header-wrapper">
        <div style={{ width: '100%', maxWidth: '750px', margin: '0 auto', boxSizing: 'border-box' }}>
          
          <div style={{ padding: '12px 20px 0 20px' }}>
            <header style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              marginBottom: 12,
              gap: '16px',
              flexWrap: 'wrap'
            }}>
              <h1 className="mobile-logo-text" style={{ 
                fontSize: 28, 
                color: '#fff', 
                fontWeight: '900', 
                letterSpacing: '-1px', 
                margin: 0, 
                fontFamily: 'sans-serif'
              }}>
                Easy Alba
              </h1>
              <UserBar 
                email={userEmail} 
                onOpenSettings={() => setShowAccountSettings(true)} 
              />
            </header>

            {errorMsg && <div style={{ marginBottom: 10, color: 'salmon' }}>{errorMsg}</div>}

            {/* ✅ [수정] 매장이 하나라도 있을 때만 Selector 보여줌 */}
            {stores.length > 0 && (
              <StoreSelector
                stores={stores}
                currentStoreId={currentStoreId}
                onChangeStore={handleStoreChange}
                creatingStore={creatingStore}
                onCreateStore={handleCreateStore}
                onDeleteStore={handleDeleteStore}
              />
            )}
          </div>

          {/* 탭 버튼들도 매장이 있을 때만 표시 */}
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

      <div 
        className="content-spacer"
        style={{ 
          width: '100%', maxWidth: '1000px', margin: '0 auto', 
          paddingLeft: '20px', paddingRight: '20px', 
          boxSizing: 'border-box' 
        }}
      >
      <div className="mobile-only" style={{ height: '20px' }}></div>

        {/* ✅ [핵심 로직] 매장이 없을 경우 -> InitialStoreSetup 표시 */}
        {stores.length === 0 && userId ? (
           <InitialStoreSetup 
             userId={userId} 
             onComplete={() => loadStores(userId)} 
           />
        ) : (
           // 매장이 있을 경우 -> 대시보드 표시
           currentStoreId && (
            <div style={{ width: '100%' }} className={currentTab === 'schedules' ? 'shrink-on-mobile' : ''}>
              {renderTabContent()}
            </div>
           )
        )}
      </div>

      {showAdditionalInfo && (
        <AdditionalInfoModal 
          isOpen={showAdditionalInfo}
          onUpdate={handleUpdateInfo}
          loading={updateLoading}
        />
      )}

      <AccountSettingsModal 
        isOpen={showAccountSettings}
        onClose={() => setShowAccountSettings(false)}
        userEmail={userEmail}
        userPhone={userPhone}
      />

      <TutorialModal 
        tutorialKey="seen_home_tutorial_v1"
        steps={[
          {
            title: "환영합니다, 사장님! 👋",
            description: "Easy Alba에 오신 것을 환영합니다. 매장 관리의 모든 것을 쉽고 편하게 도와드릴게요.",
          },
          // ... (튜토리얼 내용 생략) ...
          {
            title: "준비 되셨나요?",
            description: "이제 복잡한 급여 계산과 스케줄 관리는 저희에게 맡기고, 사업에만 집중하세요!",
          }
        ]}
      />

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