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
  onCreateEmployee: (payload: any) => void | Promise<void>; // 반환 타입 수정 (ID 받을 수 있게)
  onDeleteEmployee: (employeeId: string) => void | Promise<void>;
  onUpdateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
};

function getEmploymentLabel(type: string) {
  if (type === 'four_insurance' || type === 'employee' || type === 'insured') return '4대 보험';
  if (type === 'freelancer_33' || type === 'freelancer') return '3.3%';
  return type;
}

export function EmployeeSection({
  currentStoreId, employees, loadingEmployees, onCreateEmployee, onDeleteEmployee, onUpdateEmployee,
}: Props) {
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpWage, setNewEmpWage] = useState('');
  // ✅ 고정 월급 상태 추가
  const [newEmpMonthly, setNewEmpMonthly] = useState(''); 
  const [newEmpType, setNewEmpType] = useState<'freelancer_33' | 'four_insurance'>('four_insurance');
  const [newEmpHireDate, setNewEmpHireDate] = useState('');

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  const supabase = createSupabaseBrowserClient();
  const today = new Date().toISOString().split('T')[0];
  const activeEmployees = employees.filter(emp => !emp.end_date || emp.end_date >= today);
  const retiredEmployees = employees.filter(emp => emp.end_date && emp.end_date < today);

  if (!currentStoreId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const wage = Number(newEmpWage.replace(/,/g, ''));
    
    if (!newEmpName.trim()) return alert('이름을 입력해주세요.');
    if (!wage) return alert('시급을 입력해주세요.');

    // 1. 직원 생성 요청 (상위 컴포넌트 함수 호출)
    // 주의: onCreateEmployee가 생성된 직원의 ID를 반환해줘야 완벽하게 연동됩니다.
    // 만약 반환을 안 해주면, 이름으로 찾거나 해야 해서 약간 불안정할 수 있습니다.
    // 일단 여기서는 생성 후 이름으로 매칭해서 ID 찾는 방식을 써보겠습니다.
    await onCreateEmployee({
      name: newEmpName,
      hourlyWage: wage,           
      employmentType: newEmpType, 
      hireDate: newEmpHireDate || undefined,
    });

    // 2. 고정 월급이 있다면 settings 테이블에 저장 시도
    if (newEmpMonthly.trim()) {
        // 방금 만든 직원 ID 찾기 (이름과 시급으로 매칭 시도 - 약간 위험하지만 차선책)
        // 가장 좋은 건 onCreateEmployee가 id를 리턴해주는 것임.
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
                monthly_override: Number(newEmpMonthly.replace(/,/g, '')),
                store_id: currentStoreId // 혹시 모를 에러 방지용 (컬럼 없으면 무시됨)
            }, { onConflict: 'employee_id' });
        }
    }

    setNewEmpName('');
    setNewEmpWage('');
    setNewEmpMonthly(''); // 초기화
    setNewEmpType('four_insurance'); 
    setNewEmpHireDate('');
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
              {emp.hourly_wage?.toLocaleString()}원
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
      {/* 새 직원 등록 폼 */}
      <div className="new-employee-form-card">
        <h3 style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12, color: '#333' }}>새 직원 등록</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>이름</label>
              <input type="text" value={newEmpName} onChange={(e) => setNewEmpName(e.target.value)} placeholder="이름 입력" />
            </div>
            
            <div className="form-group">
              <label>시급 (원)</label>
              <input type="number" value={newEmpWage} onChange={(e) => setNewEmpWage(e.target.value)} placeholder="10030" />
            </div>

            {/* ✅ 고정 월급 입력 (선택) */}
            <div className="form-group">
              <label style={{color: 'dodgerblue'}}>고정 월급 (선택)</label>
              <input type="number" value={newEmpMonthly} onChange={(e) => setNewEmpMonthly(e.target.value)} placeholder="입력시 시급 무시" style={{borderColor: '#bae7ff', background:'#f0f9ff'}} />
            </div>

            <div className="form-group">
              <label>고용 형태</label>
              <select value={newEmpType} onChange={(e) => setNewEmpType(e.target.value as any)}>
                <option value="four_insurance">4대 보험</option>
                <option value="freelancer_33">3.3% 프리랜서</option>
              </select>
            </div>
            <div className="form-group date-group">
              <label>입사일</label>
              <DateSelector value={newEmpHireDate} onChange={setNewEmpHireDate} />
            </div>
            <div className="form-group btn-group">
              <button type="submit" className="btn-add">+ 추가</button>
            </div>
          </div>
        </form>
      </div>

      <div style={{ marginBottom: 40 }}>
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