import React, { useState } from 'react';
import type { Employee } from '@/app/dashboard/page';
import EmployeeEditModal from './EmployeeEditModal'; // ✅ 모달 import

type Props = {
  currentStoreId: string | null;
  employees: Employee[];
  loadingEmployees: boolean;
  onCreateEmployee: (payload: any) => void | Promise<void>;
  onDeleteEmployee: (employeeId: string) => void | Promise<void>;
  onUpdateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>; // ✅ 수정 함수 추가
};

function getEmploymentLabel(type: string) {
  if (type === 'four_insurance') return '4대 보험';
  if (type === 'freelancer_33') return '3.3% 프리랜서';
  return type;
}

export function EmployeeSection({
  currentStoreId,
  employees,
  loadingEmployees,
  onCreateEmployee,
  onDeleteEmployee,
  onUpdateEmployee, // ✅
}: Props) {
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpWage, setNewEmpWage] = useState('');
  const [newEmpType, setNewEmpType] = useState<'freelancer_33' | 'four_insurance'>('freelancer_33');
  const [newEmpHireDate, setNewEmpHireDate] = useState('');

  // ✅ 수정 모달 상태
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  if (!currentStoreId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const wage = Number(newEmpWage.replace(/,/g, ''));
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

  return (
    <section>
      {/* 직원 추가 폼 */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, marginBottom: 8 }}>직원 추가</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input type="text" placeholder="직원 이름" value={newEmpName} onChange={(e) => setNewEmpName(e.target.value)} style={{ padding: 8, color: '#000', minWidth: 120 }} />
          <input type="number" placeholder="시급 (원)" value={newEmpWage} onChange={(e) => setNewEmpWage(e.target.value)} style={{ padding: 8, color: '#000', minWidth: 110 }} />
          <select value={newEmpType} onChange={(e) => setNewEmpType(e.target.value as any)} style={{ padding: 8, color: '#000', minWidth: 140 }}>
            <option value="freelancer_33">3.3% 프리랜서</option>
            <option value="four_insurance">4대 보험 직원</option>
          </select>
          <input type="date" value={newEmpHireDate} onChange={(e) => setNewEmpHireDate(e.target.value)} style={{ padding: 8, color: '#000' }} />
          <button type="submit" style={{ padding: '8px 16px', background: 'dodgerblue', color: '#fff', border: 0, cursor: 'pointer' }}>직원 추가</button>
        </form>
      </div>

      {/* 직원 리스트 */}
      <div>
        <h3 style={{ fontSize: 18, marginBottom: 8 }}>직원 목록</h3>
        {loadingEmployees ? (
          <p>목록 불러오는 중...</p>
        ) : employees.length === 0 ? (
          <p style={{ fontSize: 14, color: '#aaa' }}>등록된 직원이 없습니다.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {employees.map((emp) => (
              <li key={emp.id} style={{ padding: '12px 0', borderBottom: '1px solid #333', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: 16 }}>{emp.name}</strong>
                  <span style={{ color: '#ccc' }}>{emp.hourly_wage?.toLocaleString()}원</span>
                  <span style={{ fontSize: 12, padding: '2px 6px', borderRadius: 4, backgroundColor: emp.employment_type.includes('free') ? '#112a45' : '#133a1b', color: emp.employment_type.includes('free') ? '#40a9ff' : '#73d13d', border: `1px solid ${emp.employment_type.includes('free') ? '#1890ff' : '#52c41a'}` }}>
                    {getEmploymentLabel(emp.employment_type)}
                  </span>
                  {!emp.is_active && <span style={{ color: 'orange', fontSize: 12 }}>(퇴사)</span>}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" onClick={() => handleEditClick(emp)} style={{ padding: '4px 10px', fontSize: 13, background: '#444', color: '#fff', border: 0, cursor: 'pointer', borderRadius: 4 }}>수정</button>
                  <button type="button" onClick={() => onDeleteEmployee(emp.id)} style={{ padding: '4px 10px', fontSize: 13, background: '#c0392b', color: '#fff', border: 0, cursor: 'pointer', borderRadius: 4 }}>삭제</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ✅ 수정 모달 연결 */}
      {selectedEmployee && (
        <EmployeeEditModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          employee={selectedEmployee}
          onUpdate={onUpdateEmployee}
        />
      )}
    </section>
  );
}