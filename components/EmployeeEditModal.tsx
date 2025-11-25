'use client';

import React, { useState, useEffect } from 'react';
import { Employee } from '@/app/dashboard/page';
import DateSelector from './DateSelector'; // ✅ 날짜 선택기

type Props = {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  onUpdate: (id: string, updates: Partial<Employee>) => Promise<void>;
};

export default function EmployeeEditModal({ isOpen, onClose, employee, onUpdate }: Props) {
  const [formData, setFormData] = useState<Partial<Employee>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && employee) {
      setFormData({
        name: employee.name,
        hourly_wage: employee.hourly_wage,
        employment_type: employee.employment_type,
        hire_date: employee.hire_date || '',
        end_date: employee.end_date || '',
        phone_number: employee.phone_number || '',
        birth_date: employee.birth_date || '',
        bank_name: employee.bank_name || '',
        account_number: employee.account_number || '',
        is_active: employee.is_active,
      });
    }
  }, [isOpen, employee]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'hourly_wage' ? Number(value.replace(/,/g, '')) : value,
    }));
  };

  const handleDateChange = (field: keyof Employee, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // ✅ [추가] 퇴사 처리 토글 함수
  const toggleStatus = () => {
    setFormData(prev => {
      const isNowActive = !prev.is_active; // 상태 반전
      return {
        ...prev,
        is_active: isNowActive,
        // 퇴사 처리 시: 오늘 날짜 자동 입력 / 복구 시: 퇴사일 비움
        end_date: !isNowActive ? new Date().toISOString().split('T')[0] : '' 
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const updates = {
      ...formData,
      hire_date: formData.hire_date === '' ? null : formData.hire_date,
      end_date: formData.end_date === '' ? null : formData.end_date,
      birth_date: formData.birth_date === '' ? null : formData.birth_date,
    };
    
    // @ts-ignore
    await onUpdate(employee.id, updates);
    setSaving(false);
    onClose();
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>직원 정보 수정</h2>

        <div style={styles.gridContainer}>
          {/* 1행: 이름 / 시급 */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>이름</label>
            <input name="name" value={formData.name || ''} onChange={handleChange} style={styles.input} />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>시급 (원)</label>
            <input name="hourly_wage" type="number" value={formData.hourly_wage || 0} onChange={handleChange} style={styles.input} />
          </div>

          {/* 2행: 고용 형태 */}
          <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
            <label style={styles.label}>고용 형태</label>
            <select name="employment_type" value={formData.employment_type} onChange={handleChange} style={styles.input}>
              <option value="freelancer_33">3.3% 프리랜서</option>
              <option value="four_insurance">4대 보험 직원</option>
            </select>
          </div>

          {/* 3행: 생년월일 / 전화번호 (DateSelector 적용) */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>생년월일</label>
            <DateSelector 
              value={formData.birth_date} 
              onChange={(val) => handleDateChange('birth_date', val)} 
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>전화번호</label>
            <input name="phone_number" placeholder="010-1234-5678" value={formData.phone_number || ''} onChange={handleChange} style={styles.input} />
          </div>

          {/* 4행: 은행명 / 계좌번호 */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>은행명</label>
            <input name="bank_name" placeholder="예: 국민" value={formData.bank_name || ''} onChange={handleChange} style={styles.input} />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>계좌번호</label>
            <input name="account_number" placeholder="- 포함 가능" value={formData.account_number || ''} onChange={handleChange} style={styles.input} />
          </div>

          {/* 5행: 입사일 / 퇴사일 (DateSelector 적용) */}
          <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
            <label style={styles.label}>입사일</label>
            <DateSelector 
              value={formData.hire_date} 
              onChange={(val) => handleDateChange('hire_date', val)} 
            />
          </div>
          <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
            <label style={styles.label}>퇴사일 (퇴사 시 날짜 선택)</label>
            <DateSelector 
              value={formData.end_date} 
              onChange={(val) => handleDateChange('end_date', val)} 
            />
          </div>
          
          {/* ✅ [NEW] 상태 변경 박스 */}
           <div style={{ ...styles.inputGroup, gridColumn: 'span 2', marginTop: 10, padding: 12, backgroundColor: '#333', borderRadius: 6, border: '1px solid #444' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 'bold', color: formData.is_active ? '#4caf50' : '#f44336' }}>
                  현재 상태: {formData.is_active ? '재직 중 🟢' : '퇴사함 🔴'}
                </span>
                
                <button 
                  onClick={toggleStatus}
                  style={{ 
                    padding: '6px 12px', 
                    borderRadius: 4, 
                    border: 'none', 
                    background: formData.is_active ? '#d32f2f' : '#388e3c', 
                    color: '#fff', 
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 'bold'
                  }}
                >
                  {formData.is_active ? '퇴사 처리하기' : '재직 상태로 복구'}
                </button>
              </div>
              <p style={{ fontSize: 11, color: '#888', margin: '4px 0 0 0' }}>
                * 퇴사 처리 시 퇴사일이 오늘 날짜로 자동 입력됩니다.
              </p>
           </div>
        </div>

        <div style={styles.buttonContainer}>
          <button onClick={onClose} style={styles.cancelButton}>취소</button>
          <button onClick={handleSave} disabled={saving} style={styles.saveButton}>
            {saving ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
  },
  modal: {
    backgroundColor: '#1f1f1f', padding: '32px', borderRadius: '12px', width: '100%', maxWidth: '500px',
    border: '1px solid #333', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' as const
  },
  title: { marginTop: 0, marginBottom: 24, color: '#fff', fontSize: '20px', fontWeight: 700 },
  gridContainer: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' },
  inputGroup: { display: 'flex', flexDirection: 'column' as const, gap: '6px' },
  label: { fontSize: '13px', color: '#aaa', fontWeight: 500 },
  input: {
    width: '100%', padding: '10px 12px', backgroundColor: '#2a2a2a', border: '1px solid #444',
    color: '#fff', borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const
  },
  buttonContainer: { display: 'flex', gap: '12px', marginTop: '32px', justifyContent: 'flex-end' },
  cancelButton: { padding: '10px 20px', background: '#333', border: '1px solid #444', color: '#eee', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 },
  saveButton: { padding: '10px 20px', background: 'royalblue', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }
};