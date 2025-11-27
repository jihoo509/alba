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
        <li key={emp.id} style={{ padding: '12px 0', borderBottom: '1px solid #eee', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: isRetired ? 0.6 : 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* ✅ 이름: 검은색 */}
            <strong style={{ fontSize: 16, minWidth: 60, color: '#000' }}>{emp.name}</strong>
            <span style={{ color: '#666' }}>{emp.hourly_wage?.toLocaleString()}원</span>
            
            <span style={{ fontSize: 12, padding: '2px 6px', borderRadius: 4, backgroundColor: isFreelancer(emp.employment_type) ? '#e6f7ff' : '#f6ffed', color: isFreelancer(emp.employment_type) ? '#1890ff' : '#52c41a', border: `1px solid ${isFreelancer(emp.employment_type) ? '#91d5ff' : '#b7eb8f'}` }}>
              {getEmploymentLabel(emp.employment_type)}
            </span>

          {/* ✅ 전화번호: 진한 회색 (흰 배경에 잘 보이게) */}
          {emp.phone_number && (
              <span style={{ 
                  fontSize: 15,           
                  color: '#555',       
                  marginLeft: 10,       
                  fontWeight: 500,        
                  letterSpacing: '0.5px'  
              }}>
                 {emp.phone_number}
              </span>
          )}

            {emp.hire_date && (
              <span style={{ fontSize: 12, color: '#999' }}>
                (입사: {emp.hire_date})
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" onClick={() => handleEditClick(emp)} style={{ padding: '4px 10px', fontSize: 13, background: '#f0f0f0', color: '#333', border: '1px solid #ddd', cursor: 'pointer', borderRadius: 4 }}>수정</button>
            <button type="button" onClick={() => onDeleteEmployee(emp.id)} style={{ padding: '4px 10px', fontSize: 13, background: '#fff1f0', color: '#cf1322', border: '1px solid #ffa39e', cursor: 'pointer', borderRadius: 4 }}>삭제</button>
          </div>
        </li>
      ))}
    </ul>
  );

  return (
    <section>
      {/* ✅ 직원 등록 폼: 흰색 카드 스타일 */}
      <div style={{ marginBottom: 32, padding: 24, backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #ddd', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontSize: 16, marginBottom: 16, color: '#000', marginTop: 0 }}>새 직원 등록</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, color: '#666' }}>이름</label>
              <input type="text" value={newEmpName} onChange={(e) => setNewEmpName(e.target.value)} style={{ ...inputStyle, width: 100 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, color: '#666' }}>시급 (원)</label>
              <input type="number" value={newEmpWage} onChange={(e) => setNewEmpWage(e.target.value)} style={{ ...inputStyle, width: 100 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, color: '#666' }}>고용 형태</label>
              <select value={newEmpType} onChange={(e) => setNewEmpType(e.target.value as any)} style={{ ...inputStyle, width: 140 }}>
                <option value="freelancer_33">3.3% 프리랜서</option>
                <option value="four_insurance">4대 보험</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, color: '#666' }}>입사일</label>
              <div style={{ minWidth: 240 }}>
                <DateSelector value={newEmpHireDate} onChange={setNewEmpHireDate} />
              </div>
            </div>
            <button type="submit" style={{ padding: '10px 20px', background: 'dodgerblue', color: '#fff', border: 0, cursor: 'pointer', borderRadius: 4, fontWeight: 'bold', height: 38, marginBottom: 1 }}>+ 추가</button>
          </div>
        </form>
      </div>

      <div style={{ marginBottom: 40 }}>
        {/* ✅ 목록 타이틀 글자색: 흰색 (파란 배경 위) */}
        <h3 style={{ fontSize: 20, marginBottom: 10, borderBottom: '2px solid rgba(255,255,255,0.2)', paddingBottom: 8, color: '#fff' }}>
          근무 중인 직원 <span style={{ fontSize: 14, color: '#54a0ff', marginLeft: 4 }}>{activeEmployees.length}명</span>
        </h3>
        {loadingEmployees ? <p style={{color:'#ddd'}}>로딩 중...</p> : activeEmployees.length === 0 ? <p style={{ color: '#ddd' }}>근무 중인 직원이 없습니다.</p> : 
          // ✅ 목록이 들어갈 흰색 카드 박스 추가
          <div style={listCardStyle}>
            {renderList(activeEmployees)}
          </div>
        }
      </div>

      {retiredEmployees.length > 0 && (
        <div>
          <h3 style={{ fontSize: 18, marginBottom: 10, color: '#aaa', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8 }}>
            퇴사한 직원 <span style={{ fontSize: 14, marginLeft: 4 }}>{retiredEmployees.length}명</span>
          </h3>
          <div style={{...listCardStyle, backgroundColor: '#f9f9f9', opacity: 0.8}}>
            {renderList(retiredEmployees, true)}
          </div>
        </div>
      )}

      {selectedEmployee && (
        <EmployeeEditModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} employee={selectedEmployee} onUpdate={onUpdateEmployee} />
      )}
    </section>
  );
}

// ✅ 입력창 스타일: 흰색 배경
const inputStyle = { padding: '10px', color: '#000', borderRadius: 4, border: '1px solid #ccc', backgroundColor: '#fff', fontSize: '14px', outline: 'none' };
// ✅ 목록 카드 스타일 추가
const listCardStyle = { backgroundColor: '#ffffff', borderRadius: 12, padding: '0 24px', border: '1px solid #ddd', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' };