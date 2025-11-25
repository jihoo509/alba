'use client';

import React, { useState, useEffect } from 'react';
import { Employee } from '@/app/dashboard/page';
import DateSelector from './DateSelector';

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

  // ✅ [수정] 퇴사 처리 버튼 (누르면 오늘 날짜 입력 / 이미 있으면 취소)
  const toggleResignation = () => {
    const today = new Date().toISOString().split('T')[0];
    if (formData.end_date) {
      // 이미 날짜가 있으면 -> 퇴사 취소 (날짜 비움)
      setFormData(prev => ({ ...prev, end_date: '', is_active: true }));
    } else {
      // 날짜가 없으면 -> 오늘 날짜 입력 (퇴사 처리 시작)
      setFormData(prev => ({ ...prev, end_date: today, is_active: false }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    // 저장 시 날짜가 있으면 is_active는 false로 확정
    const isActive = !formData.end_date; 

    const updates = {
      ...formData,
      is_active: isActive,
      hire_date: formData.hire_date === '' ? null : formData.hire_date,
      end_date: formData.end_date === '' ? null : formData.end_date,
      birth_date: formData.birth_date === '' ? null : formData.birth_date,
    };
    
    // @ts-ignore
    await onUpdate(employee.id, updates);
    setSaving(false);
    onClose();
  };

  // ✅ 현재 상태 계산 로직 (화면 표시용)
  const getStatusLabel = () => {
    if (!formData.end_date) return { text: '재직 중 🟢', color: '#4caf50' };
    
    const today = new Date().toISOString().split('T')[0];
    if (formData.end_date > today) {
      return { text: `퇴사 예정 (${formData.end_date}) 🟡`, color: '#ff9800' };
    } else {
      return { text: `퇴사 함 (${formData.end_date}) 🔴`, color: '#f44336' };
    }
  };

  const status = getStatusLabel();

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>직원 정보 수정</h2>

        <div style={styles.gridContainer}>
          {/* 1행 */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>이름</label>
            <input name="name" value={formData.name || ''} onChange={handleChange} style={styles.input} />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>시급 (원)</label>
            <input name="hourly_wage" type="number" value={formData.hourly_wage || 0} onChange={handleChange} style={styles.input} />
          </div>

          {/* 2행 */}
          <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
            <label style={styles.label}>고용 형태</label>
            <select name="employment_type" value={formData.employment_type} onChange={handleChange} style={styles.input}>
              <option value="freelancer_33">3.3% 프리랜서</option>
              <option value="four_insurance">4대 보험 직원</option>
            </select>
          </div>

          {/* 3행 */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>생년월일</label>
            <DateSelector value={formData.birth_date} onChange={(val) => handleDateChange('birth_date', val)} />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>전화번호</label>
            <input name="phone_number" placeholder="010-1234-5678" value={formData.phone_number || ''} onChange={handleChange} style={styles.input} />
          </div>

          {/* 4행 */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>은행명</label>
            <input name="bank_name" placeholder="예: 국민" value={formData.bank_name || ''} onChange={handleChange} style={styles.input} />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>계좌번호</label>
            <input name="account_number" placeholder="- 포함 가능" value={formData.account_number || ''} onChange={handleChange} style={styles.input} />
          </div>

          {/* 5행 */}
          <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
            <label style={styles.label}>입사일</label>
            <DateSelector value={formData.hire_date} onChange={(val) => handleDateChange('hire_date', val)} />
          </div>

          {/* ✅ [수정] 퇴사일 & 상태 표시 */}
           <div style={{ ...styles.inputGroup, gridColumn: 'span 2', marginTop: 10, padding: 16, backgroundColor: '#333', borderRadius: 6, border: '1px solid #444' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 15, fontWeight: 'bold', color: status.color }}>
                  상태: {status.text}
                </span>
                <button 
                  onClick={toggleResignation}
                  style={{ 
                    padding: '6px 12px', borderRadius: 4, border: 'none', 
                    background: formData.end_date ? '#555' : '#d32f2f', // 날짜 있으면 회색(취소), 없으면 빨강(퇴사)
                    color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 'bold'
                  }}
                >
                  {formData.end_date ? '퇴사 취소 (재직 처리)' : '퇴사 처리 하기'}
                </button>
              </div>
              
              {/* 퇴사 버튼 누르면 날짜 선택기 등장 */}
              <div style={{ opacity: formData.end_date ? 1 : 0.3, pointerEvents: formData.end_date ? 'auto' : 'none', transition: 'opacity 0.2s' }}>
                <label style={{ ...styles.label, marginBottom: 6, display: 'block' }}>퇴사일 (날짜를 선택하세요)</label>
                <DateSelector value={formData.end_date} onChange={(val) => handleDateChange('end_date', val)} />
              </div>
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