'use client';

import React, { useState } from 'react';
import type { Employee } from '@/app/dashboard/page';
import EmployeeEditModal from './EmployeeEditModal';
import DateSelector from './DateSelector'; // ✅ 날짜 선택기 가져오기

type Props = {
  currentStoreId: string | null;
  employees: Employee[];
  loadingEmployees: boolean;
  onCreateEmployee: (payload: any) => void | Promise<void>;
  onDeleteEmployee: (employeeId: string) => void | Promise<void>;
  onUpdateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
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
  onUpdateEmployee,
}: Props) {
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpWage, setNewEmpWage] = useState('');
  const [newEmpType, setNewEmpType] = useState<'freelancer_33' | 'four_insurance'>('freelancer_33');
  // ✅ 날짜 상태 (YYYY-MM-DD)
  const [newEmpHireDate, setNewEmpHireDate] = useState('');

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // 근무/퇴사자 분리
  const today = new Date().toISOString().split('T')[0];
  const activeEmployees = employees.filter(emp => !emp.end_date || emp.end_date >= today);
  const retiredEmployees = employees.filter(emp => emp.end_date && emp.end_date < today);

  if (!currentStoreId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const wage = Number(newEmpWage.replace(/,/g, ''));
    
    if (!newEmpName.trim()) return alert('이름을 입력해주세요.');
    if (!wage) return alert('시급을 입력해주세요.');
    // 날짜가 비어있으면 오늘 날짜로 넣거나, 입력을 강제할 수 있습니다. (여기선 선택 사항으로 둠)

    await onCreateEmployee({
      name: newEmpName,
      hourlyWage: wage,
      employmentType: newEmpType,
      hireDate: newEmpHireDate || undefined,
    });

    // 초기화
    setNewEmpName('');
    setNewEmpWage('');
    setNewEmpType('freelancer_33');
    setNewEmpHireDate('');
  };

  const handleEditClick = (emp: Employee) => {
    setSelectedEmployee(emp);
    setIsEditOpen(true);
  };

  const renderList = (list: Employee[], isRetired = false) => (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {list.map((emp) => (
        <li key={emp.id} style={{ padding: '12px 0', borderBottom: '1px solid #333', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: isRetired ? 0.6 : 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <strong style={{ fontSize: 16 }}>{emp.name}</strong>
            <span style={{ color: '#ccc' }}>{emp.hourly_wage?.toLocaleString()}원</span>
            
            <span style={{ fontSize: 12, padding: '2px 6px', borderRadius: 4, backgroundColor: emp.employment_type.includes('free') ? '#112a45' : '#133a1b', color: emp.employment_type.includes('free') ? '#40a9ff' : '#73d13d', border: `1px solid ${emp.employment_type.includes('free') ? '#1890ff' : '#52c41a'}` }}>
              {getEmploymentLabel(emp.employment_type)}
            </span>

            {emp.hire_date && (
              <span style={{ fontSize: 12, color: '#888' }}>
                {emp.hire_date} ~ {emp.end_date ? emp.end_date : '재직 중'}
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
      {/* ✅ 직원 등록 폼 (디자인 개선) */}
      <div style={{ marginBottom: 32, padding: 20, backgroundColor: '#1a1a1a', borderRadius: 8, border: '1px solid #333' }}>
        <h3 style={{ fontSize: 16, marginBottom: 12, color: '#ddd', marginTop: 0 }}>새 직원 등록</h3>
        
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            
            {/* 이름 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, color: '#aaa' }}>이름</label>
              <input 
                type="text" 
                value={newEmpName} 
                onChange={(e) => setNewEmpName(e.target.value)} 
                style={{ ...inputStyle, width: 100 }} 
              />
            </div>

            {/* 시급 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, color: '#aaa' }}>시급 (원)</label>
              <input 
                type="number" 
                value={newEmpWage} 
                onChange={(e) => setNewEmpWage(e.target.value)} 
                style={{ ...inputStyle, width: 100 }} 
              />
            </div>

            {/* 고용 형태 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, color: '#aaa' }}>고용 형태</label>
              <select 
                value={newEmpType} 
                onChange={(e) => setNewEmpType(e.target.value as any)} 
                style={{ ...inputStyle, width: 140 }}
              >
                <option value="freelancer_33">3.3% 프리랜서</option>
                <option value="four_insurance">4대 보험</option>
              </select>
            </div>

            {/* ✅ 입사일 (DateSelector 적용!) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, color: '#aaa' }}>입사일</label>
              <div style={{ minWidth: 240 }}>
                <DateSelector 
                  value={newEmpHireDate} 
                  onChange={setNewEmpHireDate} 
                />
              </div>
            </div>

            {/* 추가 버튼 */}
            <button 
              type="submit" 
              style={{ 
                padding: '10px 20px', 
                background: 'dodgerblue', 
                color: '#fff', 
                border: 0, 
                cursor: 'pointer', 
                borderRadius: 4, 
                fontWeight: 'bold',
                height: 38, // 높이 맞춤
                marginBottom: 1
              }}
            >
              + 추가
            </button>
          </div>
        </form>
      </div>

      {/* 근무 중인 직원 */}
      <div style={{ marginBottom: 40 }}>
        <h3 style={{ fontSize: 20, marginBottom: 10, borderBottom: '2px solid #fff', paddingBottom: 8 }}>
          근무 중인 직원 <span style={{ fontSize: 14, color: 'dodgerblue', marginLeft: 4 }}>{activeEmployees.length}명</span>
        </h3>
        {loadingEmployees ? <p>로딩 중...</p> : activeEmployees.length === 0 ? <p style={{ color: '#666' }}>근무 중인 직원이 없습니다.</p> : renderList(activeEmployees)}
      </div>

      {/* 퇴사한 직원 */}
      {retiredEmployees.length > 0 && (
        <div>
          <h3 style={{ fontSize: 18, marginBottom: 10, color: '#aaa', borderBottom: '1px solid #555', paddingBottom: 8 }}>
            퇴사한 직원 <span style={{ fontSize: 14, marginLeft: 4 }}>{retiredEmployees.length}명</span>
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
        />
      )}
    </section>
  );
}

const inputStyle = {
  padding: '10px', 
  color: '#fff', 
  borderRadius: 4, 
  border: '1px solid #555', 
  backgroundColor: '#333',
  fontSize: '14px',
  outline: 'none'
};