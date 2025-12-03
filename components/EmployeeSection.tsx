'use client';

import React, { useState } from 'react';
import type { Employee } from '@/app/dashboard/page';
import EmployeeEditModal from './EmployeeEditModal';
import DateSelector from './DateSelector';

type Props = {
  currentStoreId: string | null;
  wageSystem: 'hourly' | 'daily'; // ✅ [추가] 매장 급여 시스템 정보
  employees: Employee[];
  loadingEmployees: boolean;
  onCreateEmployee: (payload: any) => void | Promise<void>;
  onDeleteEmployee: (employeeId: string) => void | Promise<void>;
  onUpdateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
};

function getEmploymentLabel(type: string) {
  if (type === 'four_insurance' || type === 'employee' || type === 'insured') return '4대 보험';
  if (type === 'freelancer_33' || type === 'freelancer') return '3.3%';
  return type;
}

export function EmployeeSection({
  currentStoreId,
  wageSystem, // ✅ 구조 분해 할당
  employees,
  loadingEmployees,
  onCreateEmployee,
  onDeleteEmployee,
  onUpdateEmployee,
}: Props) {
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpWage, setNewEmpWage] = useState('');
  const [newEmpType, setNewEmpType] = useState<'freelancer_33' | 'four_insurance'>('four_insurance');
  const [newEmpHireDate, setNewEmpHireDate] = useState('');

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const activeEmployees = employees.filter(emp => !emp.end_date || emp.end_date >= today);
  const retiredEmployees = employees.filter(emp => emp.end_date && emp.end_date < today);

  if (!currentStoreId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEmpName.trim()) return alert('이름을 입력해주세요.');

    // ✅ [수정] 일당제 로직 분기 처리
    let finalWage = 0;

    if (wageSystem === 'hourly') {
        // 시급제일 때만 시급 입력값 체크
        if (!newEmpWage) return alert('시급을 입력해주세요.');
        finalWage = Number(newEmpWage.replace(/,/g, ''));
    } else {
        // 일당제일 때는 시급을 0으로 처리 (스케줄에서 관리)
        finalWage = 0;
    }

    await onCreateEmployee({
      name: newEmpName,
      hourlyWage: finalWage,          
      employmentType: newEmpType, 
      hireDate: newEmpHireDate || undefined,
    });

    setNewEmpName('');
    setNewEmpWage('');
    setNewEmpType('four_insurance'); 
    setNewEmpHireDate('');
  };

  const handleEditClick = (emp: Employee) => {
    setSelectedEmployee(emp);
    setIsEditOpen(true);
  };

  const renderList = (list: Employee[], isRetired = false) => (
    <div className="employee-list-container">
      {list.map((emp) => (
        <div key={emp.id} className={`employee-card ${isRetired ? 'retired' : ''}`}>
          
          {/* 1. 상단: 이름 & 시급 */}
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
            {/* ✅ [수정] 일당제일 경우 시급 금액 대신 '일당제' 텍스트 노출 */}
            <div className="emp-wage">
              {wageSystem === 'hourly' 
                ? `${emp.hourly_wage?.toLocaleString()}원`
                : <span style={{fontSize: 13, color:'#999'}}>일당제</span>
              }
            </div>
          </div>

          {/* 2. 중단: 상세 정보 (전화번호, 입사일) */}
          <div className="emp-info-row">
            {emp.phone_number ? (
              <span className="emp-phone">{emp.phone_number}</span>
            ) : (
              <span className="emp-no-phone">(연락처 미입력)</span>
            )}
            
            {emp.hire_date && (
              <span className="emp-date">
                입사: {emp.hire_date.replace(/\-/g, '.')}
              </span>
            )}
          </div>

          {/* 3. 하단: 버튼 그룹 */}
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
            
            {/* ✅ [수정] 시급제(hourly)일 때만 시급 입력칸 노출 */}
            {wageSystem === 'hourly' && (
                <div className="form-group">
                <label>시급 (원)</label>
                <input type="number" value={newEmpWage} onChange={(e) => setNewEmpWage(e.target.value)} placeholder="10030" />
                </div>
            )}

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

      {/* 근무 중인 직원 */}
      <div style={{ marginBottom: 40 }}>
        <h3 style={{ fontSize: 20, marginBottom: 12, borderBottom: '2px solid rgba(255,255,255,0.2)', paddingBottom: 8, color: '#fff', display: 'flex', alignItems: 'center' }}>
          근무 중인 직원 <span style={{ fontSize: 14, color: '#54a0ff', marginLeft: 8, backgroundColor: 'rgba(84, 160, 255, 0.1)', padding: '2px 8px', borderRadius: 10 }}>{activeEmployees.length}명</span>
        </h3>
        {loadingEmployees ? <p style={{color:'#ddd'}}>로딩 중...</p> : activeEmployees.length === 0 ? <p style={{ color: '#ddd' }}>근무 중인 직원이 없습니다.</p> : 
          renderList(activeEmployees)
        }
      </div>

      {/* 퇴사한 직원 */}
      {retiredEmployees.length > 0 && (
        <div style={{ opacity: 0.8 }}>
          <h3 style={{ fontSize: 18, marginBottom: 12, color: '#ccc', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8 }}>
            퇴사한 직원 <span style={{ fontSize: 14, marginLeft: 8 }}>{retiredEmployees.length}명</span>
          </h3>
          {renderList(retiredEmployees, true)}
        </div>
      )}

      {selectedEmployee && (
        <EmployeeEditModal 
            isOpen={isEditOpen} 
            onClose={() => setIsEditOpen(false)} 
            employee={selectedEmployee} 
            onUpdate={onUpdateEmployee} 
            wageSystem={wageSystem} // ✅ [주의] EmployeeEditModal에도 wageSystem을 받아 처리하도록 수정 필요
        />
      )}
    </section>
  );
}