import React, { useState } from 'react';
// types를 '@/app/dashboard/page'에서 가져오는데, 
// 만약 에러나면 직접 type Employee = { ... } 정의를 여기에 복사해도 됩니다.
import type { Employee } from '@/app/dashboard/page';

type Props = {
  currentStoreId: string | null;
  employees: Employee[];
  loadingEmployees: boolean;
  onCreateEmployee: (payload: {
    name: string;
    hourlyWage: number;
    employmentType: 'freelancer_33' | 'four_insurance';
    hireDate?: string;
  }) => void | Promise<void>;
  onDeleteEmployee: (employeeId: string) => void | Promise<void>;
};

// ✅ [수정됨] 고용 형태를 한글로 바꿔주는 함수 (기존 데이터 호환성 추가)
function getEmploymentLabel(type: string) {
  // 1. 현재 쓰는 값
  if (type === 'four_insurance') return '4대 보험';
  if (type === 'freelancer_33') return '3.3% 프리랜서';
  
  // 2. 혹시 DB에 남아있을지 모를 옛날 값(영어) 처리
  if (type === 'employee' || type === 'insured') return '4대 보험';
  if (type === 'freelancer') return '3.3% 프리랜서';

  return type; // 그 외에는 그냥 출력
}

export function EmployeeSection({
  currentStoreId,
  employees,
  loadingEmployees,
  onCreateEmployee,
  onDeleteEmployee,
}: Props) {
  // 새 직원 추가 폼 상태
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpWage, setNewEmpWage] = useState('');
  const [newEmpType, setNewEmpType] =
    useState<'freelancer_33' | 'four_insurance'>('freelancer_33');
  const [newEmpHireDate, setNewEmpHireDate] = useState('');

  if (!currentStoreId) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const wage = Number(newEmpWage.replace(/,/g, ''));

    await onCreateEmployee({
      name: newEmpName,
      hourlyWage: wage,
      employmentType: newEmpType,
      hireDate: newEmpHireDate || undefined,
    });

    // 폼 초기화
    setNewEmpName('');
    setNewEmpWage('');
    setNewEmpType('freelancer_33');
    setNewEmpHireDate('');
  };

  return (
    <section>
      {/* 직원 추가 폼 */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, marginBottom: 8 }}>직원 추가</h3>
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
        >
          <input
            type="text"
            placeholder="직원 이름"
            value={newEmpName}
            onChange={(e) => setNewEmpName(e.target.value)}
            style={{ padding: 8, color: '#000', minWidth: 120 }}
          />
          <input
            type="number"
            placeholder="시급 (원)"
            value={newEmpWage}
            onChange={(e) => setNewEmpWage(e.target.value)}
            style={{ padding: 8, color: '#000', minWidth: 110 }}
          />
          <select
            value={newEmpType}
            onChange={(e) =>
              setNewEmpType(
                e.target.value as 'freelancer_33' | 'four_insurance',
              )
            }
            style={{ padding: 8, color: '#000', minWidth: 140 }}
          >
            <option value="freelancer_33">3.3% 프리랜서</option>
            <option value="four_insurance">4대 보험 직원</option>
          </select>
          <input
            type="date"
            value={newEmpHireDate}
            onChange={(e) => setNewEmpHireDate(e.target.value)}
            style={{ padding: 8, color: '#000' }}
          />
          <button
            type="submit"
            style={{
              padding: '8px 16px',
              background: 'dodgerblue',
              color: '#fff',
              border: 0,
              cursor: 'pointer',
            }}
          >
            직원 추가
          </button>
        </form>
      </div>

      {/* 직원 리스트 */}
      <div>
        <h3 style={{ fontSize: 18, marginBottom: 8 }}>직원 목록</h3>
        {loadingEmployees ? (
          <p>직원 목록 불러오는 중...</p>
        ) : employees.length === 0 ? (
          <p style={{ fontSize: 14, color: '#aaa' }}>
            아직 등록된 직원이 없습니다.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {employees.map((emp) => (
              <li
                key={emp.id}
                style={{
                  padding: '6px 0',
                  borderBottom: '1px solid #333',
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <strong style={{ fontSize: 16 }}>{emp.name}</strong>{' '}
                  <span style={{ marginLeft: 8, color: '#ccc' }}>
                    {emp.hourly_wage
                      ? `${emp.hourly_wage.toLocaleString()}원`
                      : '-'}
                  </span>
                  
                  {/* ✅ [수정됨] 고용형태를 뱃지 스타일로 예쁘게 표시 */}
                  <span
                    style={{
                      marginLeft: 8,
                      fontSize: 12,
                      padding: '2px 6px',
                      borderRadius: 4,
                      // 프리랜서는 파란색 계열, 4대보험은 초록색 계열
                      backgroundColor: emp.employment_type.includes('free') ? '#112a45' : '#133a1b',
                      color: emp.employment_type.includes('free') ? '#40a9ff' : '#73d13d',
                      border: `1px solid ${emp.employment_type.includes('free') ? '#1890ff' : '#52c41a'}`
                    }}
                  >
                    {getEmploymentLabel(emp.employment_type)}
                  </span>

                  {emp.hire_date && (
                    <span style={{ marginLeft: 12, fontSize: 13, color: '#888' }}>
                      입사: {emp.hire_date}
                    </span>
                  )}
                  {!emp.is_active && (
                    <span style={{ marginLeft: 8, color: 'orange' }}>
                      (퇴사/비활성)
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  {/* 수정 버튼 (기능은 추후 구현) */}
                  <button
                    type="button"
                    style={{
                      padding: '4px 10px',
                      fontSize: 13,
                      background: '#444',
                      color: '#fff',
                      border: 0,
                      cursor: 'pointer',
                      borderRadius: 4,
                    }}
                    onClick={() => {
                      alert('직원 수정 기능은 추후 구현 예정입니다.');
                    }}
                  >
                    수정
                  </button>
                  {/* 삭제 버튼 */}
                  <button
                    type="button"
                    style={{
                      padding: '4px 10px',
                      fontSize: 13,
                      background: '#c0392b',
                      color: '#fff',
                      border: 0,
                      cursor: 'pointer',
                      borderRadius: 4,
                    }}
                    onClick={() => onDeleteEmployee(emp.id)}
                  >
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}