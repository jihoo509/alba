'use client';

import React, { useState } from 'react';
import type { Employee } from '@/app/dashboard/page';
import EmployeeEditModal from './EmployeeEditModal';
import DateSelector from './DateSelector';
import { format } from 'date-fns';

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
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // --- 상태 관리 ---
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpHireDate, setNewEmpHireDate] = useState(todayStr); 
  const [payType, setPayType] = useState<'time' | 'day' | 'month'>('time');
  const [newEmpWage, setNewEmpWage] = useState(''); 
  const [newDailyWage, setNewDailyWage] = useState(''); 
  const [newEmpMonthly, setNewEmpMonthly] = useState(''); 
  const [newEmpType, setNewEmpType] = useState<'freelancer_33' | 'four_insurance'>('four_insurance');

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isTypeOpen, setIsTypeOpen] = useState(false);

  // ✅ [신규] 퇴직 처리용 모달 상태
  const [isRetireModalOpen, setIsRetireModalOpen] = useState(false);
  const [retireTargetId, setRetireTargetId] = useState<string | null>(null);
  const [retireDate, setRetireDate] = useState(todayStr);

  // 퇴직 여부 필터링 (퇴사일이 없거나, 오늘보다 미래면 재직자)
  const activeEmployees = employees.filter(emp => !emp.end_date || emp.end_date >= todayStr);
  const retiredEmployees = employees.filter(emp => emp.end_date && emp.end_date < todayStr);

  if (!currentStoreId) return null;

  // --- 핸들러 ---
  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const raw = e.target.value.replace(/,/g, '');
    if (/^\d*$/.test(raw)) setter(raw === '' ? '' : Number(raw).toLocaleString());
  };

  const handleSelectType = (value: 'freelancer_33' | 'four_insurance') => {
    setNewEmpType(value); setIsTypeOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName.trim()) return alert('이름을 입력해주세요.');

    const wage = payType === 'time' ? Number(newEmpWage.replace(/,/g, '')) : 0;
    const dailyPay = payType === 'day' ? Number(newDailyWage.replace(/,/g, '')) : 0;
    const monthlyPay = payType === 'month' ? Number(newEmpMonthly.replace(/,/g, '')) : 0;

    if (payType === 'time' && !wage) return alert('시급을 입력해주세요.');
    if (payType === 'day' && !dailyPay) return alert('일당을 입력해주세요.');
    if (payType === 'month' && !monthlyPay) return alert('월급을 입력해주세요.');

    await onCreateEmployee({
      name: newEmpName, hourlyWage: wage, employmentType: newEmpType, hireDate: newEmpHireDate || undefined,
      pay_type: payType, default_daily_pay: dailyPay, monthlyWage: monthlyPay, 
    });

    setNewEmpName(''); setNewEmpWage(''); setNewDailyWage(''); setNewEmpMonthly('');
    setNewEmpType('four_insurance'); setNewEmpHireDate(todayStr); setPayType('time');
  };

  const handleEditClick = (emp: Employee) => { setSelectedEmployee(emp); setIsEditOpen(true); };

  // ✅ [신규] 퇴직 버튼 클릭 핸들러
  const handleRetireClick = (emp: Employee) => {
      setRetireTargetId(emp.id);
      setRetireDate(todayStr); // 기본값 오늘
      setIsRetireModalOpen(true);
  };

  // ✅ [신규] 퇴직 처리 확정
  const confirmRetire = async () => {
      if (!retireTargetId) return;
      await onUpdateEmployee(retireTargetId, { end_date: retireDate });
      setIsRetireModalOpen(false);
      setRetireTargetId(null);
  };

  // ✅ [신규] 퇴직 취소 (재입사 처리 - end_date 제거)
  const cancelRetire = async (empId: string) => {
      if(!confirm('해당 직원을 다시 근무 중 상태로 변경하시겠습니까?')) return;
      await onUpdateEmployee(empId, { end_date: '' }); // end_date를 비워서 복구
  };

  // --- 렌더링 ---
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
              {(emp.pay_type === 'month' || (emp.monthly_wage && emp.monthly_wage > 0)) ? (
                 <span style={{ color: 'dodgerblue', fontWeight: 'bold' }}>월 {Number(emp.monthly_wage).toLocaleString()}원</span>
              ) : (emp.pay_type === 'day' || emp.pay_type === '일당') ? (
                <span style={{ color: '#e67e22', fontWeight: 'bold' }}>일 {Number(emp.daily_wage || emp.default_daily_pay || 0).toLocaleString()}원</span>
              ) : (
                <span>시급 {Number(emp.hourly_wage || 0).toLocaleString()}원</span>
              )}
            </div>
          </div>
          
          <div className="emp-info-row">
            <div style={{ display: 'flex', gap: '10px', fontSize: '13px', color: '#666', alignItems: 'center' }}>
                {emp.hire_date && <span>📅 입사: {emp.hire_date.replace(/\-/g, '.')}</span>}
                {isRetired && emp.end_date && <span style={{color:'crimson'}}>⛔ 퇴사: {emp.end_date}</span>}
                {emp.phone_number && (
                    <>
                        <span style={{ width: '1px', height: '12px', background: '#ddd' }}></span>
                        <span>📞 {emp.phone_number}</span>
                    </>
                )}
            </div>
          </div>
          
          <div className="emp-actions">
            <button type="button" onClick={() => handleEditClick(emp)} className="btn-edit">수정</button>
            
            {/* ✅ 재직자일 땐 '퇴직' / 퇴사자일 땐 '복구' 및 '완전삭제' */}
            {!isRetired ? (
                <button type="button" onClick={() => handleRetireClick(emp)} className="btn-retire" style={{background:'#f39c12', color:'#fff', border:'none', borderRadius:4, padding:'6px 12px', cursor:'pointer', fontSize:13, fontWeight:'bold'}}>
                    퇴직
                </button>
            ) : (
                <button type="button" onClick={() => cancelRetire(emp.id)} className="btn-restore" style={{background:'#27ae60', color:'#fff', border:'none', borderRadius:4, padding:'6px 12px', cursor:'pointer', fontSize:13, fontWeight:'bold'}}>
                    복구
                </button>
            )}

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
        @media (min-width: 768px) { .form-grid-layout { grid-template-columns: 1fr 1fr; align-items: end; } .full-width { grid-column: span 2; } }
        .form-group { display: flex; flexDirection: column; gap: 6px; }
        .form-group label { fontSize: 13px; fontWeight: bold; color: #555; }
        .input-field { width: 100%; padding: 10px; border: 1px solid #ddd; borderRadius: 6px; fontSize: 14px; box-sizing: border-box; outline: none; background: #fff; }
        .input-field:focus { border-color: #0052cc; }
        .toggle-group { display: flex; background: #eee; padding: 2px; border-radius: 6px; flex-shrink: 0; }
        .toggle-btn { padding: 10px 12px; border: none; border-radius: 4px; font-size: 13px; cursor: pointer; background: transparent; color: #666; white-space: nowrap; }
        .toggle-btn.active { background: #fff; color: #0052cc; font-weight: bold; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .toggle-btn.active-orange { background: #fff; color: #e67e22; font-weight: bold; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .toggle-btn.active-blue { background: #fff; color: #3498db; font-weight: bold; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .btn-add { width: 100%; height: 42px; background: dodgerblue; color: #fff; border: none; borderRadius: 6px; font-weight: bold; cursor: pointer; margin-top: 10px; }
        
        /* 모달 스타일 */
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; justify-content: center; align-items: center; }
        .modal-content { background: #fff; padding: 24px; borderRadius: 12px; width: 90%; maxWidth: 320px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
      `}</style>

      {/* ... (직원 등록 폼: 기존 코드와 동일하여 생략, 위 코드 그대로 사용) ... */}
      <div className="new-employee-form-card">
        <h3 style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 16, color: '#333' }}>새 직원 등록</h3>
        <form onSubmit={handleSubmit} className="form-grid-layout">
          <div className="form-group">
            <label>이름</label>
            <input type="text" value={newEmpName} onChange={(e) => setNewEmpName(e.target.value)} placeholder="이름 입력" className="input-field" />
          </div>
          <div className="form-group" style={{ position: 'relative' }}>
            <label>고용 형태</label>
            <div onClick={() => setIsTypeOpen(!isTypeOpen)} className="input-field" style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{getEmploymentLabel(newEmpType)}</span><span style={{ fontSize: '10px', color: '#888' }}>▼</span>
            </div>
            {isTypeOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '6px', marginTop: '4px', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <div onClick={() => handleSelectType('four_insurance')} style={{ padding: '12px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', fontSize: '14px' }}>4대 보험</div>
                    <div onClick={() => handleSelectType('freelancer_33')} style={{ padding: '12px', cursor: 'pointer', fontSize: '14px' }}>3.3% 프리랜서</div>
                </div>
            )}
          </div>
          <div className="form-group full-width">
            <label>급여 설정</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div className="toggle-group">
                    <button type="button" className={`toggle-btn ${payType === 'time' ? 'active' : ''}`} onClick={() => setPayType('time')}>시급</button>
                    <button type="button" className={`toggle-btn ${payType === 'day' ? 'active-orange' : ''}`} onClick={() => setPayType('day')}>일당</button>
                    <button type="button" className={`toggle-btn ${payType === 'month' ? 'active-blue' : ''}`} onClick={() => setPayType('month')}>월급</button>
                </div>
                <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                    {payType === 'time' && <input type="text" value={newEmpWage} onChange={(e) => handleNumberInput(e, setNewEmpWage)} placeholder="0" className="input-field" style={{ textAlign:'right', paddingRight: '30px' }} />}
                    {payType === 'day' && <input type="text" value={newDailyWage} onChange={(e) => handleNumberInput(e, setNewDailyWage)} placeholder="0" className="input-field" style={{ textAlign:'right', paddingRight: '30px', borderColor:'#f39c12', background:'#fffbf0' }} />}
                    {payType === 'month' && <input type="text" value={newEmpMonthly} onChange={(e) => handleNumberInput(e, setNewEmpMonthly)} placeholder="0" className="input-field" style={{ textAlign:'right', paddingRight: '30px', borderColor:'#3498db', background:'#f0f9ff' }} />}
                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888', fontSize: '13px', pointerEvents: 'none' }}>원</span>
                </div>
            </div>
          </div>
          <div className="form-group">
            <label>입사일</label>
            <div style={{ width: '100%' }}><DateSelector value={newEmpHireDate} onChange={setNewEmpHireDate} /></div>
          </div>
          <div className="form-group">
            <button type="submit" className="btn-add">+ 직원 추가</button>
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

      {/* ✅ [신규] 퇴직 처리 모달 */}
      {isRetireModalOpen && (
          <div className="modal-overlay" onClick={() => setIsRetireModalOpen(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <h3 style={{ marginTop: 0, fontSize: 18, fontWeight: 'bold' }}>퇴직 처리</h3>
                  <p style={{ color: '#666', fontSize: 14, marginBottom: 16 }}>마지막 근무일(퇴사일)을 선택해주세요.<br/>해당 날짜 이후로는 스케줄이 생성되지 않습니다.</p>
                  
                  <div style={{ marginBottom: 20 }}>
                      <label style={{ display:'block', marginBottom: 6, fontWeight:'bold', fontSize:13 }}>마지막 근무일</label>
                      <DateSelector value={retireDate} onChange={setRetireDate} />
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setIsRetireModalOpen(false)} style={{ flex: 1, padding: 12, border: 'none', borderRadius: 6, background: '#f0f0f0', fontWeight: 'bold', cursor:'pointer' }}>취소</button>
                      <button onClick={confirmRetire} style={{ flex: 1, padding: 12, border: 'none', borderRadius: 6, background: 'crimson', color: '#fff', fontWeight: 'bold', cursor:'pointer' }}>퇴직 확정</button>
                  </div>
              </div>
          </div>
      )}
    </section>
  );
}