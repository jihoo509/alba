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
  if (type === 'freelancer_33' || type === 'freelancer') return '프리랜서';
  return type;
}

export function EmployeeSection({
  currentStoreId, employees, loadingEmployees, onCreateEmployee, onDeleteEmployee, onUpdateEmployee,
}: Props) {
  const [newEmpName, setNewEmpName] = useState('');
  
  // 전화번호 3분할
  const [phone1, setPhone1] = useState('010');
  const [phone2, setPhone2] = useState('');
  const [phone3, setPhone3] = useState('');

  // 3단 토글용 상태
  const [payType, setPayType] = useState<'time' | 'day' | 'month'>('time');
  const [newEmpWage, setNewEmpWage] = useState(''); 
  const [newDailyWage, setNewDailyWage] = useState(''); 
  const [newEmpMonthly, setNewEmpMonthly] = useState(''); 

  const [newEmpType, setNewEmpType] = useState<'freelancer_33' | 'four_insurance'>('four_insurance');
  const [newEmpHireDate, setNewEmpHireDate] = useState('');

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
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

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void, maxLen: number) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length <= maxLen) setter(val);
  };

  const handleSelectType = (value: 'freelancer_33' | 'four_insurance') => {
    setNewEmpType(value);
    setIsTypeOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEmpName.trim()) return alert('이름을 입력해주세요.');

    const wage = payType === 'time' ? Number(newEmpWage.replace(/,/g, '')) : 0;
    const dailyPay = payType === 'day' ? Number(newDailyWage.replace(/,/g, '')) : 0;
    const monthlyPay = payType === 'month' ? Number(newEmpMonthly.replace(/,/g, '')) : 0;

    // 필수 입력 체크
    if (payType === 'time' && !wage) return alert('시급을 입력해주세요.');
    if (payType === 'day' && !dailyPay) return alert('일당을 입력해주세요.');
    if (payType === 'month' && !monthlyPay) return alert('월급을 입력해주세요.');

    const fullPhone = `${phone1}-${phone2}-${phone3}`;

    await onCreateEmployee({
      name: newEmpName,
      phone_number: fullPhone.length > 8 ? fullPhone : '',
      hourlyWage: wage, 
      employmentType: newEmpType,
      hireDate: newEmpHireDate || undefined,
      pay_type: payType, // 'time' | 'day' | 'month'
      default_daily_pay: dailyPay,
      monthlyWage: monthlyPay, 
    });

    // 초기화
    setNewEmpName('');
    setPhone1('010'); setPhone2(''); setPhone3('');
    setNewEmpWage(''); setNewDailyWage(''); setNewEmpMonthly('');
    setNewEmpType('four_insurance');
    setNewEmpHireDate('');
    setPayType('time');
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
              {/* ✅ 저장된 pay_type에 따라 정확하게 표시 */}
              {(emp.pay_type === 'month' || (emp.monthly_wage && emp.monthly_wage > 0)) ? (
                 <span style={{ color: 'dodgerblue', fontWeight: 'bold' }}>
                   월 {Number(emp.monthly_wage).toLocaleString()}원
                 </span>
              ) : (emp.pay_type === 'day' || emp.pay_type === '일당') ? (
                <span style={{ color: '#e67e22', fontWeight: 'bold' }}>
                  일 {Number(emp.daily_wage || emp.default_daily_pay || 0).toLocaleString()}원
                </span>
              ) : (
                <span>
                  시급 {Number(emp.hourly_wage || 0).toLocaleString()}원
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
        .form-grid-layout { display: grid; gap: 16px; grid-template-columns: 1fr; }
        @media (min-width: 768px) {
          .form-grid-layout { grid-template-columns: 1fr 1fr 1fr; align-items: end; }
          .pay-setting-group { grid-column: span 2; } /* 급여 설정 칸 넓게 */
        }
        
        /* 전화번호 스타일 */
        .phone-row { display: flex; align-items: center; gap: 4px; width: 100%; }
        .phone-input {
            flex: 1; min-width: 0; padding: 10px 0; border: 1px solid #ddd; border-radius: 6px;
            font-size: 14px; text-align: center; outline: none; background: #fff; box-sizing: border-box;
        }
        .phone-input:focus { border-color: #0052cc; }
        .dash { color: #888; font-weight: bold; flex-shrink: 0; }

        /* 토글 버튼 그룹 */
        .toggle-group { display: flex; background: #eee; padding: 2px; border-radius: 6px; flex-shrink: 0; }
        .toggle-btn {
          padding: 10px 12px; border: none; border-radius: 4px; font-size: 13px; cursor: pointer;
          background: transparent; color: #666;
        }
        .toggle-btn.active { background: #fff; color: #0052cc; font-weight: bold; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .toggle-btn.active-orange { background: #fff; color: #e67e22; font-weight: bold; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .toggle-btn.active-blue { background: #fff; color: #3498db; font-weight: bold; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
      `}</style>

      <div className="new-employee-form-card">
        <h3 style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 16, color: '#333' }}>새 직원 등록</h3>
        <form onSubmit={handleSubmit} className="form-grid-layout">
          
          <div className="form-group">
            <label>이름</label>
            <input type="text" value={newEmpName} onChange={(e) => setNewEmpName(e.target.value)} placeholder="이름 입력" style={{width:'100%', padding:'10px', border:'1px solid #ddd', borderRadius:'6px', boxSizing:'border-box'}} />
          </div>

          <div className="form-group">
            <label>전화번호</label>
            <div className="phone-row">
              <input className="phone-input" value={phone1} onChange={(e)=>handlePhoneInput(e, setPhone1, 3)} />
              <span className="dash">-</span>
              <input className="phone-input" value={phone2} onChange={(e)=>handlePhoneInput(e, setPhone2, 4)} />
              <span className="dash">-</span>
              <input className="phone-input" value={phone3} onChange={(e)=>handlePhoneInput(e, setPhone3, 4)} />
            </div>
          </div>

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
                    <div onClick={() => handleSelectType('four_insurance')} style={{ padding: '12px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', fontSize: '14px' }}>4대 보험</div>
                    <div onClick={() => handleSelectType('freelancer_33')} style={{ padding: '12px', cursor: 'pointer', fontSize: '14px' }}>3.3% 프리랜서</div>
                </div>
            )}
          </div>

          <div className="form-group date-group">
            <label>입사일</label>
            <DateSelector value={newEmpHireDate} onChange={setNewEmpHireDate} />
          </div>

          {/* ✅ 3단 토글 급여 설정 */}
          <div className="form-group pay-setting-group">
            <label>급여 방식</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div className="toggle-group">
                    <button type="button" className={`toggle-btn ${payType === 'time' ? 'active' : ''}`} onClick={() => setPayType('time')}>시급</button>
                    <button type="button" className={`toggle-btn ${payType === 'day' ? 'active-orange' : ''}`} onClick={() => setPayType('day')}>일당</button>
                    <button type="button" className={`toggle-btn ${payType === 'month' ? 'active-blue' : ''}`} onClick={() => setPayType('month')}>월급</button>
                </div>

                <div style={{ position: 'relative', flex: 1 }}>
                    {payType === 'time' && (
                        <input type="text" value={newEmpWage} onChange={(e) => handleNumberInput(e, setNewEmpWage)} placeholder="0" style={{ width: '100%', padding:'10px', border:'1px solid #ddd', borderRadius:'6px', boxSizing: 'border-box', textAlign:'right', paddingRight: '30px' }} />
                    )}
                    {payType === 'day' && (
                        <input type="text" value={newDailyWage} onChange={(e) => handleNumberInput(e, setNewDailyWage)} placeholder="0" style={{ width: '100%', padding:'10px', border:'1px solid #ffadd2', borderRadius:'6px', background:'#fff0f6', boxSizing: 'border-box', textAlign:'right', paddingRight: '30px' }} />
                    )}
                    {payType === 'month' && (
                        <input type="text" value={newEmpMonthly} onChange={(e) => handleNumberInput(e, setNewEmpMonthly)} placeholder="0" style={{ width: '100%', padding:'10px', border:'1px solid #bae7ff', borderRadius:'6px', background:'#f0f9ff', boxSizing: 'border-box', textAlign:'right', paddingRight: '30px' }} />
                    )}
                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888', fontSize: '13px', pointerEvents: 'none' }}>원</span>
                </div>
            </div>
          </div>

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