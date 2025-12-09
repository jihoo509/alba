'use client';

import React, { useState } from 'react';
import type { Employee } from '@/app/dashboard/page';
import EmployeeEditModal from './EmployeeEditModal';
import DateSelector from './DateSelector';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';

type Props = {
  currentStoreId: string | null;
  employees: Employee[];
  loadingEmployees: boolean;
  onCreateEmployee: (payload: any) => void | Promise<void>;
  onDeleteEmployee: (employeeId: string) => void | Promise<void>;
  onUpdateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
};

function getEmploymentLabel(type: string) {
  if (type === 'four_insurance' || type === 'employee' || type === 'insured') return '4대 보험';
  if (type === 'freelancer_33' || type === 'freelancer') return '3.3% 프리랜서';
  return type;
}

export function EmployeeSection({
  currentStoreId, employees, loadingEmployees, onCreateEmployee, onDeleteEmployee, onUpdateEmployee,
}: Props) {
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpWage, setNewEmpWage] = useState(''); 
  const [newEmpMonthly, setNewEmpMonthly] = useState(''); 
  const [payType, setPayType] = useState<'time' | 'day'>('time'); 
  const [newDailyWage, setNewDailyWage] = useState(''); 
  const [newEmpType, setNewEmpType] = useState<'freelancer_33' | 'four_insurance'>('four_insurance');
  const [newEmpHireDate, setNewEmpHireDate] = useState('');

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  // ✅ 고용 형태 드롭다운 열림 상태
  const [isTypeOpen, setIsTypeOpen] = useState(false);

  const supabase = createSupabaseBrowserClient();
  const today = new Date().toISOString().split('T')[0];
  const activeEmployees = employees.filter(emp => !emp.end_date || emp.end_date >= today);
  const retiredEmployees = employees.filter(emp => emp.end_date && emp.end_date < today);

  if (!currentStoreId) return null;

  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const raw = e.target.value.replace(/,/g, '');
    if (/^\d*$/.test(raw)) {
      setter(raw === '' ? '' : Number(raw).toLocaleString());
    }
  };

  // ✅ 고용 형태 선택 핸들러
  const handleSelectType = (value: 'freelancer_33' | 'four_insurance') => {
    setNewEmpType(value);
    setIsTypeOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const wage = Number(newEmpWage.replace(/,/g, ''));
    const dailyPay = Number(newDailyWage.replace(/,/g, ''));
    const monthlyPay = Number(newEmpMonthly.replace(/,/g, '')); // ✅ 고정 월급 숫자 변환

    if (!newEmpName.trim()) return alert('이름을 입력해주세요.');

    // ✅ [수정된 로직] 고정 월급이 없을 때만 시급/일당 필수 체크
    if (monthlyPay === 0) {
        if (payType === 'time' && !wage) return alert('시급 또는 고정 월급을 입력해주세요.');
        if (payType === 'day' && !dailyPay) return alert('일당 또는 고정 월급을 입력해주세요.');
    }

    await onCreateEmployee({
      name: newEmpName,
      hourlyWage: payType === 'time' ? wage : 0, 
      employmentType: newEmpType,
      hireDate: newEmpHireDate || undefined,
      pay_type: payType,
      default_daily_pay: payType === 'day' ? dailyPay : 0,
    });

    // 고정 월급 저장 로직
    if (newEmpMonthly.trim()) {
        const { data: createdEmp } = await supabase
            .from('employees')
            .select('id')
            .eq('name', newEmpName)
            .eq('store_id', currentStoreId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (createdEmp) {
            await supabase.from('employee_settings').upsert({
                employee_id: createdEmp.id,
                monthly_override: monthlyPay,
                store_id: currentStoreId
            }, { onConflict: 'employee_id' });
        }
    }

    setNewEmpName('');
    setNewEmpWage('');
    setNewEmpMonthly('');
    setNewEmpType('four_insurance');
    setNewEmpHireDate('');
    setPayType('time');
    setNewDailyWage('');
  };

  const handleEditClick = (emp: Employee) => { setSelectedEmployee(emp); setIsEditOpen(true); };

  const renderList = (list: Employee[], isRetired = false) => (
    <div className="employee-list-container">
      {list.map((emp) => (
        <div key={emp.id} className={`employee-card ${isRetired ? 'retired' : ''}`}>
          <div className="emp-header">
            <div className="emp-name-group">
              <strong className="emp-name">{emp.name}</strong>
              <span className="emp-type-badge" style={{
                backgroundColor: emp.employment_type.includes('free') ? '#e6f7ff' : '#f6ffed',
                color: emp.employment_type.includes('free') ? '#1890ff' : '#52c41a'
              }}>
                {getEmploymentLabel(emp.employment_type)}
              </span>
            </div>

            <div className="emp-wage">
              {(emp.pay_type === 'day' || emp.pay_type === '일당') ? (
                <span style={{ color: '#e67e22', fontWeight: 'bold' }}>
                  일 {Number(emp.daily_wage || emp.default_daily_pay || 0).toLocaleString()}원
                </span>
              ) : (
                <span>
                  {Number(emp.hourly_wage || 0).toLocaleString()}원
                </span>
              )}
            </div>

          </div>
          <div className="emp-info-row">
            {emp.phone_number ? <span className="emp-phone">{emp.phone_number}</span> : <span className="emp-no-phone">(연락처 미입력)</span>}
            {emp.hire_date && <span className="emp-date">입사: {emp.hire_date.replace(/\-/g, '.')}</span>}
          </div>
          <div className="emp-actions">
            <button type="button" onClick={() => handleEditClick(emp)} className="btn-edit">수정</button>
            <button type="button" onClick={() => onDeleteEmployee(emp.id)} className="btn-delete">삭제</button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <section>
      <style jsx>{`
        /* ✅ PC용 반응형 그리드 설정 */
        .form-grid-layout {
          display: grid;
          gap: 16px;
          /* 모바일: 1열 */
          grid-template-columns: 1fr; 
        }

        /* PC (768px 이상): 3열로 꽉 채우기 */
        @media (min-width: 768px) {
          .form-grid-layout {
            grid-template-columns: 1fr 1fr 1fr;
            align-items: end; /* 버튼 높이 맞춤 */
          }
          /* 급여 설정 부분은 좀 더 넓게 */
          .pay-setting-group {
            grid-column: span 1; 
          }
        }
      `}</style>

      <div className="new-employee-form-card">
        <h3 style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 16, color: '#333' }}>새 직원 등록</h3>
        <form onSubmit={handleSubmit} className="form-grid-layout">
          
          {/* 1. 이름 */}
          <div className="form-group">
            <label>이름</label>
            <input type="text" value={newEmpName} onChange={(e) => setNewEmpName(e.target.value)} placeholder="이름 입력" style={{width:'100%', boxSizing:'border-box'}} />
          </div>

          {/* 2. 고용 형태 (커스텀 드롭다운) */}
          <div className="form-group" style={{ position: 'relative' }}>
            <label>고용 형태</label>
            <div 
                onClick={() => setIsTypeOpen(!isTypeOpen)}
                style={{
                    width: '100%', padding: '10px 12px', boxSizing: 'border-box',
                    border: '1px solid #ddd', borderRadius: '6px', backgroundColor: '#fff',
                    cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontSize: '14px', color: '#333'
                }}
            >
                <span>{getEmploymentLabel(newEmpType)}</span>
                <span style={{ fontSize: '10px', color: '#888' }}>▼</span>
            </div>
            
            {isTypeOpen && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0, width: '100%',
                    backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '6px',
                    marginTop: '4px', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                    <div 
                        onClick={() => handleSelectType('four_insurance')}
                        style={{ padding: '12px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', fontSize: '14px' }}
                    >
                        4대 보험
                    </div>
                    <div 
                        onClick={() => handleSelectType('freelancer_33')}
                        style={{ padding: '12px', cursor: 'pointer', fontSize: '14px' }}
                    >
                        3.3% 프리랜서
                    </div>
                </div>
            )}
          </div>

          {/* 3. 입사일 */}
          <div className="form-group date-group">
            <label>입사일</label>
            <DateSelector value={newEmpHireDate} onChange={setNewEmpHireDate} />
          </div>

          {/* 4. 급여 방식 & 금액 */}
          <div className="form-group pay-setting-group">
            <label>급여 설정</label>
            <div style={{ display: 'flex', gap: 8 }}>
                {/* 토글 버튼 */}
                <div style={{ display: 'flex', backgroundColor: '#f0f2f5', padding: '2px', borderRadius: '6px', flexShrink: 0 }}>
                    <button type="button" onClick={() => setPayType('time')} style={{ padding: '8px 12px', borderRadius: '4px', border: 'none', backgroundColor: payType === 'time' ? '#fff' : 'transparent', color: payType === 'time' ? 'dodgerblue' : '#888', fontWeight: payType === 'time' ? 'bold' : 'normal', boxShadow: payType === 'time' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', fontSize: 13 }}>시급</button>
                    <button type="button" onClick={() => setPayType('day')} style={{ padding: '8px 12px', borderRadius: '4px', border: 'none', backgroundColor: payType === 'day' ? '#fff' : 'transparent', color: payType === 'day' ? '#e67e22' : '#888', fontWeight: payType === 'day' ? 'bold' : 'normal', boxShadow: payType === 'day' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', fontSize: 13 }}>일당</button>
                </div>

                {/* 금액 입력란 */}
                <div style={{ position: 'relative', flex: 1 }}>
                    {payType === 'time' ? (
                        <input 
                            type="text" inputMode="numeric" value={newEmpWage} onChange={(e) => handleNumberInput(e, setNewEmpWage)} 
                            placeholder="0" style={{ width: '100%', boxSizing: 'border-box', paddingRight: '30px' }} 
                        />
                    ) : (
                        <input 
                            type="text" inputMode="numeric" value={newDailyWage} onChange={(e) => handleNumberInput(e, setNewDailyWage)} 
                            placeholder="0" style={{ width: '100%', boxSizing: 'border-box', borderColor: '#ffadd2', backgroundColor: '#fff0f6', paddingRight: '30px' }} 
                        />
                    )}
                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888', fontSize: '13px', pointerEvents: 'none' }}>원</span>
                </div>
            </div>
          </div>

          {/* 5. 고정 월급 */}
          <div className="form-group">
            <label style={{color: 'dodgerblue'}}>고정 월급 (선택)</label>
            <input 
                type="text" inputMode="numeric" value={newEmpMonthly} onChange={(e) => handleNumberInput(e, setNewEmpMonthly)} 
                placeholder="입력 시 자동계산 무시" style={{borderColor: '#bae7ff', background:'#f0f9ff', width:'100%', boxSizing:'border-box'}} 
            />
          </div>

          {/* 6. 추가 버튼 */}
          <div className="form-group btn-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="submit" className="btn-add" style={{width:'100%', height: '42px'}}>+ 직원 추가</button>
          </div>

        </form>
      </div>

      <div style={{ marginBottom: 40, marginTop: 40 }}>
        <h3 style={{ fontSize: 20, marginBottom: 12, borderBottom: '2px solid rgba(255,255,255,0.2)', paddingBottom: 8, color: '#fff', display: 'flex', alignItems: 'center' }}>
          근무 중인 직원 <span style={{ fontSize: 14, color: '#54a0ff', marginLeft: 8, backgroundColor: 'rgba(84, 160, 255, 0.1)', padding: '2px 8px', borderRadius: 10 }}>{activeEmployees.length}명</span>
        </h3>
        {loadingEmployees ? <p style={{color:'#ddd'}}>로딩 중...</p> : activeEmployees.length === 0 ? <p style={{ color: '#ddd' }}>근무 중인 직원이 없습니다.</p> : renderList(activeEmployees)}
      </div>

      {retiredEmployees.length > 0 && (
        <div style={{ opacity: 0.8 }}>
          <h3 style={{ fontSize: 18, marginBottom: 12, color: '#ccc', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8 }}>
            퇴사한 직원 <span style={{ fontSize: 14, marginLeft: 8 }}>{retiredEmployees.length}명</span>
          </h3>
          {renderList(retiredEmployees, true)}
        </div>
      )}

      {selectedEmployee && (
        <EmployeeEditModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} employee={selectedEmployee} onUpdate={onUpdateEmployee} />
      )}
    </section>
  );
}