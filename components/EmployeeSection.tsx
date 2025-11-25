'use client';

import React, { useState } from 'react';
import type { Employee } from '@/app/dashboard/page';
import EmployeeEditModal from './EmployeeEditModal';
import DateSelector from './DateSelector';

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
  currentStoreId,
  employees,
  loadingEmployees,
  onCreateEmployee,
  onDeleteEmployee,
  onUpdateEmployee,
}: Props) {
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpWage, setNewEmpWage] = useState('');
  const [newEmpType, setNewEmpType] = useState<'freelancer_33' | 'four_insurance'>('freelancer_33');
  const [newEmpHireDate, setNewEmpHireDate] = useState('');

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const activeEmployees = employees.filter(emp => !emp.end_date || emp.end_date >= today);
  const retiredEmployees = employees.filter(emp => emp.end_date && emp.end_date < today);

  if (!currentStoreId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const wage = Number(newEmpWage.replace(/,/g, ''));
    
    if (!newEmpName.trim()) return alert('이름을 입력해주세요.');
    if (!wage) return alert('시급을 입력해주세요.');

    // ✅ 변수명 통일 (카멜케이스로 보냄 -> page.tsx에서 받아서 처리)
    await onCreateEmployee({
      name: newEmpName,
      hourlyWage: wage,           
      employmentType: newEmpType, 
      hireDate: newEmpHireDate || undefined,
    });

    setNewEmpName('');
    setNewEmpWage('');
    setNewEmpType('freelancer_33');
    setNewEmpHireDate('');
  };

  const handleEditClick = (emp: Employee) => {
    setSelectedEmployee(emp);
    setIsEditOpen(true);
  };

  const isFreelancer = (type: string) => type.includes('free'); 

  const renderList = (list: Employee[], isRetired = false) => (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {list.map((emp) => (
        <li key={emp.id} style={{ padding: '12px 0', borderBottom: '1px solid #333', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: isRetired ? 0.6 : 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <strong style={{ fontSize: 16, minWidth: 60 }}>{emp.name}</strong>
            <span style={{ color: '#ccc' }}>{emp.hourly_wage?.toLocaleString()}원</span>
            
            <span style={{ fontSize: 12, padding: '2px 6px', borderRadius: 4, backgroundColor: isFreelancer(emp.employment_type) ? '#112a45' : '#133a1b', color: isFreelancer(emp.employment_type) ? '#40a9ff' : '#73d13d', border: `1px solid ${isFreelancer(emp.employment_type) ? '#1890ff' : '#52c41a'}` }}>
              {getEmploymentLabel(emp.employment_type)}
            </span>

            {/* 전화번호 표시 */}
            {emp.phone_number && (
               <span style={{ fontSize: 13, color: '#ddd', fontFamily: 'monospace' }}>
                 📞 {emp.phone_number}
               </span>
            )}

            {emp.hire_date && (
              <span style={{ fontSize: 12, color: '#888' }}>
                (입사: {emp.hire_date})
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" onClick={() => handleEditClick(emp)} style={{ padding: '4px 10px', fontSize: 13, background: '#444', color: '#fff', border: 0, cursor: 'pointer', borderRadius: 4 }}>수정</button>
            <button type="button" onClick={() => onDeleteEmployee(emp.id)} style={{ padding: '4px 10px', fontSize: 13, background: '#c0392b', color: '#fff', border: 0, cursor: 'pointer', borderRadius: 4 }}>삭제</button>
          </div>
        </li>
      ))}
    </ul>
  );

  return (
    <section>
      {/* 직원 등록 폼 (박스 스타일 복구) */}
      <div style={{ marginBottom: 32, padding: 20, backgroundColor: '#1a1a1a', borderRadius: 8, border: '1px solid #333' }}>
        <h3 style={{ fontSize: 16, marginBottom: 12, color: '#ddd', marginTop: 0 }}>새 직원 등록</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, color: '#aaa' }}>이름</label>
              <input type="text" value={newEmpName} onChange={(e) => setNewEmpName(e.target.value)} style={{ ...inputStyle, width: 100 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, color: '#aaa' }}>시급 (원)</label>
              <input type="number" value={newEmpWage} onChange={(e) => setNewEmpWage(e.target.value)} style={{ ...inputStyle, width: 100 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, color: '#aaa' }}>고용 형태</label>
              <select value={newEmpType} onChange={(e) => setNewEmpType(e.target.value as any)} style={{ ...inputStyle, width: 140 }}>
                <option value="freelancer_33">3.3% 프리랜서</option>
                <option value="four_insurance">4대 보험</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, color: '#aaa' }}>입사일</label>
              <div style={{ minWidth: 240 }}>
                <DateSelector value={newEmpHireDate} onChange={setNewEmpHireDate} />
              </div>
            </div>
            <button type="submit" style={{ padding: '10px 20px', background: 'dodgerblue', color: '#fff', border: 0, cursor: 'pointer', borderRadius: 4, fontWeight: 'bold', height: 38, marginBottom: 1 }}>+ 추가</button>
          </div>
        </form>
      </div>

      <div style={{ marginBottom: 40 }}>
        <h3 style={{ fontSize: 20, marginBottom: 10, borderBottom: '2px solid #fff', paddingBottom: 8 }}>
          근무 중인 직원 <span style={{ fontSize: 14, color: 'dodgerblue', marginLeft: 4 }}>{activeEmployees.length}명</span>
        </h3>
        {loadingEmployees ? <p>로딩 중...</p> : activeEmployees.length === 0 ? <p style={{ color: '#666' }}>근무 중인 직원이 없습니다.</p> : renderList(activeEmployees)}
      </div>

      {retiredEmployees.length > 0 && (
        <div>
          <h3 style={{ fontSize: 18, marginBottom: 10, color: '#aaa', borderBottom: '1px solid #555', paddingBottom: 8 }}>
            퇴사한 직원 <span style={{ fontSize: 14, marginLeft: 4 }}>{retiredEmployees.length}명</span>
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

const inputStyle = { padding: '10px', color: '#fff', borderRadius: 4, border: '1px solid #555', backgroundColor: '#333', fontSize: '14px', outline: 'none' };