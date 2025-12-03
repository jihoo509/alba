'use client';

import React, { useEffect, useMemo, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import { StoreSelector } from '@/components/StoreSelector';
import { EmployeeSection } from '@/components/EmployeeSection';
import TemplateSection from '@/components/TemplateSection'; 
import PayrollSection from '@/components/PayrollSection';
import { format } from 'date-fns';
import { calculateMonthlyPayroll } from '@/lib/payroll';
import TutorialModal from '@/components/TutorialModal';

// 아이콘 라이브러리가 없다면 텍스트로 대체하거나 lucide-react 설치 필요
// 편의상 이모지로 대체합니다.

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

// ----------------------------------------------------------------------
// ✅ [신규 컴포넌트] 계정 설정 모달
// ----------------------------------------------------------------------
function AccountModal({ isOpen, onClose, email, supabase }: any) {
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handlePasswordChange = async () => {
        if (!newPassword || newPassword.length < 6) {
            alert('비밀번호는 6자 이상이어야 합니다.');
            return;
        }
        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        setLoading(false);
        
        if (error) alert('비밀번호 변경 실패: ' + error.message);
        else {
            alert('비밀번호가 성공적으로 변경되었습니다!');
            setNewPassword('');
            onClose();
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    return (
        <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
                <h3 style={{marginTop:0}}>🔒 계정 설정</h3>
                
                <div style={{ marginBottom: 20 }}>
                    <label style={labelStyle}>내 아이디</label>
                    <div style={{ padding: 10, backgroundColor: '#f5f5f5', borderRadius: 4, color: '#555' }}>
                        {email}
                    </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                    <label style={labelStyle}>비밀번호 변경</label>
                    <input 
                        type="password" 
                        placeholder="새 비밀번호 (6자 이상)"
                        value={newPassword}
                        onChange={(e)=>setNewPassword(e.target.value)}
                        style={inputStyle}
                    />
                    <button 
                        onClick={handlePasswordChange}
                        disabled={loading}
                        style={{ marginTop: 8, width: '100%', padding: 8, backgroundColor: '#444', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                    >
                        {loading ? '변경 중...' : '비밀번호 변경하기'}
                    </button>
                </div>

                <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #eee' }} />
                
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button onClick={handleLogout} style={{ ...btnStyle, backgroundColor: '#ff6b6b', color: 'white' }}>로그아웃</button>
                    <button onClick={onClose} style={{ ...btnStyle, backgroundColor: '#ddd' }}>닫기</button>
                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------
// ✅ [신규 컴포넌트] 매장 설정 모달
// ----------------------------------------------------------------------
function StoreSettingsModal({ isOpen, onClose, store, onUpdate, onDelete, supabase }: any) {
    const [wageSystem, setWageSystem] = useState(store?.wage_system || 'hourly');
    const [isLarge, setIsLarge] = useState(store?.is_large_store || false);
    const [name, setName] = useState(store?.name || '');

    // store prop이 바뀔 때 state 동기화
    useEffect(() => {
        if (store) {
            setWageSystem(store.wage_system);
            setIsLarge(store.is_large_store);
            setName(store.name);
        }
    }, [store]);

    if (!isOpen || !store) return null;

    const handleSave = async () => {
        const { error } = await supabase
            .from('stores')
            .update({ name, wage_system: wageSystem, is_large_store: isLarge })
            .eq('id', store.id);

        if (error) alert('저장 실패');
        else {
            alert('매장 설정이 저장되었습니다.');
            onUpdate(); // 부모 컴포넌트 리로드
            onClose();
        }
    };

    return (
        <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
                <h3 style={{marginTop:0}}>⚙️ 매장 설정</h3>
                
                <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>매장 이름</label>
                    <input 
                        value={name} onChange={(e)=>setName(e.target.value)}
                        style={inputStyle}
                    />
                </div>

                <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>급여 방식</label>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button 
                             onClick={() => setWageSystem('hourly')}
                             style={wageSystem === 'hourly' ? activeOptionStyle : optionStyle}
                        >시급제</button>
                        <button 
                             onClick={() => setWageSystem('daily')}
                             style={wageSystem === 'daily' ? activeOptionStyle : optionStyle}
                        >일당제</button>
                    </div>
                    {wageSystem === 'daily' && store.wage_system === 'hourly' && (
                        <p style={{ fontSize: 12, color: 'orange', marginTop: 4 }}>
                            ⚠️ 주의: 일당제로 변경 시, 직원들의 '시급' 정보를 '일당' 금액으로 직접 수정해주셔야 합니다.
                        </p>
                    )}
                </div>

                <div style={{ marginBottom: 20 }}>
                    <label style={labelStyle}>사업장 규모</label>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button 
                             onClick={() => setIsLarge(false)}
                             style={!isLarge ? activeOptionStyle : optionStyle}
                        >5인 미만</button>
                        <button 
                             onClick={() => setIsLarge(true)}
                             style={isLarge ? activeOptionStyle : optionStyle}
                        >5인 이상</button>
                    </div>
                    <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                        * 5인 이상 선택 시 야간/연장/휴일 수당이 자동 적용됩니다.
                    </p>
                </div>

                <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #eee' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                     <button onClick={() => onDelete(store.id)} style={{ ...btnStyle, backgroundColor: '#fff', border: '1px solid tomato', color: 'tomato' }}>
                        매장 삭제
                     </button>
                     <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={onClose} style={{ ...btnStyle, backgroundColor: '#ddd' }}>취소</button>
                        <button onClick={handleSave} style={{ ...btnStyle, backgroundColor: '#0064FF', color: 'white' }}>저장</button>
                     </div>
                </div>
            </div>
        </div>
    );
}


// ----------------------------------------------------------------------
// 메인 대시보드 로직
// ----------------------------------------------------------------------

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

  // 모달 상태
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isStoreSettingsModalOpen, setIsStoreSettingsModalOpen] = useState(false);

  // 초기 생성 폼 상태
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
      alert('매장이 삭제되었습니다.');
      setIsStoreSettingsModalOpen(false); // 모달 닫기
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

  const handleSimpleCreateStore = useCallback(async (name: string) => {
    await handleCreateStoreInternal(name, 'hourly', false);
  }, []);

  const handleFirstCreateStore = async () => {
    if (!newStoreName.trim()) { alert('매장명을 입력해주세요.'); return; }
    setIsCreatingFirst(true);
    await handleCreateStoreInternal(newStoreName, newWageSystem, newIsLargeStore);
    setIsCreatingFirst(false);
  };

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

  // 모달 닫힐 때 데이터 갱신을 위해 래퍼 함수 사용
  const handleReloadStores = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await loadStores(user.id);
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

  const renderTabContent = () => {
    if (stores.length === 0) {
        return (
            <div style={{ maxWidth: 500, margin: '40px auto', padding: 30, backgroundColor: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <h2 style={{ textAlign: 'center', fontSize: 22, fontWeight: 'bold', marginBottom: 24, color: '#333' }}>
                    첫 번째 매장을 만들어볼까요? 🏪
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 8 }}>매장 이름</label>
                        <input 
                            type="text" placeholder="예: 무유무유 수원점" value={newStoreName} onChange={(e) => setNewStoreName(e.target.value)}
                            style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 16 }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 8 }}>급여 방식</label>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setNewWageSystem('hourly')} style={newWageSystem === 'hourly' ? activeOptionStyle : optionStyle}>⏱️ 시급제</button>
                            <button onClick={() => setNewWageSystem('daily')} style={newWageSystem === 'daily' ? activeOptionStyle : optionStyle}>🗓️ 일당제</button>
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 8 }}>사업장 규모</label>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setNewIsLargeStore(false)} style={!newIsLargeStore ? activeOptionStyle : optionStyle}>🐣 5인 미만</button>
                            <button onClick={() => setNewIsLargeStore(true)} style={newIsLargeStore ? activeOptionStyle : optionStyle}>🏢 5인 이상</button>
                        </div>
                    </div>
                    <button onClick={handleFirstCreateStore} disabled={isCreatingFirst} style={{ width: '100%', padding: '14px', backgroundColor: '#0064FF', color: '#fff', fontSize: 16, fontWeight: 'bold', borderRadius: 8, border: 'none', cursor: 'pointer', marginTop: 10 }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, alignItems: 'start' }}>
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
  wageSystem={currentStore?.wage_system || 'hourly'}  // 👈 이 줄을 꼭 추가해주세요!
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
              
              {/* ✅ [수정] 아이디 제거 & 버튼 2개 배치 */}
              <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    onClick={() => setIsAccountModalOpen(true)}
                    style={{ background: 'rgba(255,255,255,0.2)', border:'none', color:'#fff', padding:'6px 12px', borderRadius:20, fontSize:13, cursor:'pointer' }}
                  >
                    🔒 계정 설정
                  </button>
                  {stores.length > 0 && (
                     <button 
                        onClick={() => setIsStoreSettingsModalOpen(true)}
                        style={{ background: 'rgba(255,255,255,0.2)', border:'none', color:'#fff', padding:'6px 12px', borderRadius:20, fontSize:13, cursor:'pointer' }}
                    >
                        ⚙️ 매장 설정
                    </button>
                  )}
              </div>
            </header>

            {errorMsg && <div style={{ marginBottom: 10, color: 'salmon' }}>{errorMsg}</div>}

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
                </div>
            )}
          </div>

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

      <div className="content-spacer" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', paddingLeft: '20px', paddingRight: '20px', boxSizing: 'border-box' }}>
        <div style={{ width: '100%' }} className={currentTab === 'schedules' ? 'shrink-on-mobile' : ''}>
          {renderTabContent()}
        </div>
      </div>

      {stores.length > 0 && (
          <TutorialModal tutorialKey="seen_home_tutorial_v1" steps={[/* 기존 튜토리얼 유지 */]} />
      )}

      {/* 팝업 모달들 */}
      <AccountModal 
        isOpen={isAccountModalOpen} 
        onClose={() => setIsAccountModalOpen(false)} 
        email={userEmail}
        supabase={supabase}
      />

      <StoreSettingsModal 
        isOpen={isStoreSettingsModalOpen}
        onClose={() => setIsStoreSettingsModalOpen(false)}
        store={currentStore}
        onUpdate={handleReloadStores}
        onDelete={handleDeleteStore}
        supabase={supabase}
      />

    </main>
  );
}

// 스타일 정의
const cardStyle = { backgroundColor: '#ffffff', borderRadius: 8, padding: 24, border: '1px solid #ddd', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' };
const modalOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 };
const modalContentStyle: React.CSSProperties = { backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '90%', maxWidth: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 'bold', color: '#666', marginBottom: 8 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' as const }; // boxSizing 타입 오류 방지
const btnStyle: React.CSSProperties = { padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 14 };
const optionStyle: React.CSSProperties = { flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #ddd', backgroundColor: '#fff', color: '#666', cursor: 'pointer' };
const activeOptionStyle: React.CSSProperties = { ...optionStyle, backgroundColor: '#eef6ff', borderColor: '#0064FF', color: '#0064FF', fontWeight: 'bold' };

export default function DashboardPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: '#fff' }}>대시보드 로딩 중...</div>}>
      <DashboardContent />
    </Suspense>
  );
}