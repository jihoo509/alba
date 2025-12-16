'use client';

import React, { useEffect, useMemo, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import UserBar from '@/components/UserBar';
import { StoreSelector } from '@/components/StoreSelector';
import { EmployeeSection } from '@/components/EmployeeSection';
import TemplateSection from '@/components/TemplateSection'; 
import PayrollSection from '@/components/PayrollSection';
import { format, startOfMonth, endOfMonth } from 'date-fns'; // ✅ [수정] 날짜 계산 함수 추가
import { calculatePayrollByRange } from '@/lib/payroll'; // ✅ [수정] 변경된 함수 임포트
import TutorialModal from '@/components/TutorialModal';
import AdditionalInfoModal from '@/components/AdditionalInfoModal';
import AccountSettingsModal from '@/components/AccountSettingsModal';
import InitialStoreSetup from '@/components/InitialStoreSetup'; 

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
  monthly_wage?: number;
};

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

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
    const { data, error } = await supabase.from('stores').select('*').eq('owner_id', uid);
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
    if (!window.confirm('정말 삭제하시겠습니까? (직원 및 스케줄 데이터가 모두 삭제됩니다)')) return;
    const { error } = await supabase.from('stores').delete().eq('id', storeId);
    if (error) alert('삭제 실패');
    else {
      setStores((prev) => prev.filter((s) => s.id !== storeId));
      if (currentStoreId === storeId) { setCurrentStoreId(null); setEmployees([]); }
    }
  }, [supabase, currentStoreId]);

  const loadEmployees = useCallback(async (storeId: string) => {
    setLoadingEmployees(true);
    const { data } = await supabase
        .from('employees')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: true });

    if (data) {
      setEmployees(data.map((row: any) => ({
        id: String(row.id), 
        name: row.name, 
        hourly_wage: row.hourly_wage, 
        employment_type: row.employment_type,
        is_active: row.is_active, 
        
        phone_number: row.phone_number, 
        bank_name: row.bank_name, 
        account_number: row.account_number, 
        
        hire_date: row.hire_date, 
        birth_date: row.birth_date, 
        end_date: row.end_date,
        
        pay_type: row.pay_type || 'time',
        daily_wage: row.daily_wage || 0,
        default_daily_pay: row.daily_wage || 0,
        monthly_wage: row.monthly_wage || 0,
      })));
    }
    setLoadingEmployees(false);
  }, [supabase]);

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

    // 2. 월 급여 예측을 위한 데이터 조회 (이번 달 1일 ~ 말일 기준)
    const { data: storeSettings } = await supabase.from('stores').select('*').eq('id', storeId).single();
    const { data: allEmployees } = await supabase.from('employees').select('*').eq('store_id', storeId);
    
    // ✅ [수정] 이번 달의 시작일과 종료일 계산
    const monthStartStr = format(startOfMonth(today), 'yyyy-MM-dd');
    const monthEndStr = format(endOfMonth(today), 'yyyy-MM-dd');

    const { data: monthSchedules } = await supabase
      .from('schedules')
      .select('*')
      .eq('store_id', storeId)
      .gte('date', monthStartStr)
      .lte('date', monthEndStr);

    if (storeSettings && allEmployees && monthSchedules) {
      // ✅ [수정] calculatePayrollByRange 호출 (기존 calculateMonthlyPayroll 대체)
      const payrollResult = calculatePayrollByRange(
        monthStartStr, 
        monthEndStr, 
        allEmployees, 
        monthSchedules, 
        storeSettings
      );
      
      // ✅ [수정] reduce 타입 에러 수정 (acc: number, p: any)
      const totalEst = payrollResult.reduce((acc: number, p: any) => acc + (p.totalPay || 0), 0);
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
      monthly_wage: payload.monthlyWage || 0,
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
      setUserId(user.id);

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

  const handleInitialSetupComplete = async () => {
    if (userId) {
      await loadStores(userId);
    }
  };

const renderTabContent = () => {
    if (!currentStoreId) return <div style={{textAlign:'center', marginTop: 40, color: '#fff'}}>관리할 매장을 선택해주세요.</div>;

    if (currentTab === 'home') {
      const tips = [
        { 
          id: 1,
          icon: "🛑",
          title: "퇴사하는 주에는 주휴수당 X", 
          desc: "주휴수당은 '다음 주 근무'를 전제로 합니다. 따라서 마지막 근무 주(퇴사 주)에는 발생하지 않습니다." 
        },
        { 
          id: 2,
          icon: "📢",
          title: "해고 예고는 30일 전에", 
          desc: "30일 전 예고하지 않으면 30일분 통상임금을 줘야 합니다. (단, 근무 기간 3개월 미만 직원은 즉시 해고 가능)" 
        },
        { 
          id: 3,
          icon: "🚑",
          title: "대타 근무와 주휴수당", 
          desc: "갑작스런 '대타' 근무는 소정근로시간에 포함되지 않아 주휴수당 대상이 아닌 경우가 많습니다." 
        },
        { 
          id: 4,
          icon: "👶",
          title: "수습기간 90% 급여 조건", 
          desc: "'1년 이상' 근로 계약을 체결한 경우에만 수습 3개월간 최저임금의 90% 지급이 가능합니다. (단순 노무직 제외)" 
        },
        { 
          id: 5,
          icon: "☕",
          title: "휴게시간은 필수입니다", 
          desc: "4시간 근무 시 30분, 8시간 근무 시 1시간 이상 휴게시간을 '근로시간 도중'에 줘야 합니다." 
        },
      ];

      return (
        <div style={{ maxWidth: 760, margin: '0 auto', width: '100%' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: 20, 
            alignItems: 'start'
          }}>
            
            {/* 1. [메인] 오늘 근무자 카드 */}
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

            {/* 2. [메인] 급여 지출 카드 */}
            <div style={cardStyle}>
              <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 16, color: '#555' }}>💰 {new Date().getMonth()+1}월 예상 급여 지출 (세전)</h3>
              <div style={{ fontSize: 32, fontWeight: 'bold', color: '#000' }}>{monthlyEstPay.toLocaleString()} <span style={{ fontSize: 20 }}>원</span></div>
            </div>

            {/* 3. [상식] 팁 카드들 */}
            {tips.map((tip) => (
              <div key={tip.id} style={cardStyle}>
                <h3 style={{ 
                  marginTop: 0, 
                  marginBottom: 12, 
                  fontSize: 14, 
                  color: '#e67e22', 
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  💡 사장님 필수 상식
                </h3>
                
                <div>
                  <strong style={{ display:'block', fontSize: '15px', color: '#222', marginBottom:'8px' }}>
                    {tip.icon} {tip.title}
                  </strong>
                  <p style={{ margin: 0, fontSize: '13px', color: '#666', lineHeight: '1.5', wordBreak: 'keep-all' }}>
                    {tip.desc}
                  </p>
                </div>
              </div>
            ))}

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

          {/* 탭 메뉴 */}
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

        {/* 매장 없을 때 InitialStoreSetup */}
        {stores.length === 0 ? (
           userId ? (
             <InitialStoreSetup 
               userId={userId} 
               onComplete={handleInitialSetupComplete} 
             />
           ) : (
             <div style={{color:'#fff', textAlign:'center', marginTop: 40}}>로딩 중...</div>
           )
        ) : (
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

      {showAccountSettings && (
        <AccountSettingsModal 
          isOpen={showAccountSettings}
          onClose={() => setShowAccountSettings(false)}
          userEmail={userEmail}
          userPhone={userPhone}
        />
      )}

      {stores.length > 0 && (
        <TutorialModal 
          tutorialKey="seen_home_tutorial_v1"
          steps={[
            { title: "환영합니다, 사장님! 👋", description: "Easy Alba에 오신 것을 환영합니다." },
            { title: "1. 매장 등록하기", description: "가장 먼저 '매장 추가' 버튼을 눌러 사장님의 매장을 등록해주세요." },
            { title: "2. 직원 등록하기", description: "'직원' 탭에서 함께 일하는 직원들을 등록하고 시급을 설정해보세요." },
            { title: "3. 근무 패턴 등록하기", description: "월~수 오픈 등 반복적인 스케줄 생성 후 스케줄 자동 생성이 가능합니다!" },
            { title: "4. 스케줄 수정하기", description: "배정되어 있는 직원 클릭 시 근무 시간 수정 및 삭제 가능, 스케줄의 빈 칸 클릭 시 새 근무 생성이 가능합니다." },
            { title: "5. 급여 확인하기", description: "배정된 스케줄에 따라 정확한 급여가 표기됩니다. 이미지, 엑셀로 다운 받아 근무자 또는 세무서에 전달하세요!" },
            { title: "준비 되셨나요?", description: "이제 복잡한 급여 계산과 스케줄 관리는 저희에게 맡기고, 사업에만 집중하세요!" }
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