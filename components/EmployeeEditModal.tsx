'use client';

import React, { useState, useEffect } from 'react';
import { Employee } from '@/app/dashboard/page';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  onUpdate: (id: string, updates: Partial<Employee>) => Promise<void>;
};

export default function EmployeeEditModal({ isOpen, onClose, employee, onUpdate }: Props) {
  const [formData, setFormData] = useState<Partial<Employee>>({});
  const [saving, setSaving] = useState(false);

  // 모달 열릴 때 기존 데이터 채워넣기
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

  const handleSave = async () => {
    setSaving(true);
    await onUpdate(employee.id, formData);
    setSaving(false);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#222', padding: 24, borderRadius: 8, width: '100%', maxWidth: 500,
        border: '1px solid #444', maxHeight: '90vh', overflowY: 'auto'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: 20, color: '#fff' }}>직원 정보 수정</h2>

        <div style={{ display: 'grid', gap: 16 }}>
          {/* 기본 정보 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#aaa', marginBottom: 4 }}>이름</label>
              <input name="name" value={formData.name || ''} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#aaa', marginBottom: 4 }}>시급</label>
              <input name="hourly_wage" type="number" value={formData.hourly_wage || 0} onChange={handleChange} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#aaa', marginBottom: 4 }}>고용 형태</label>
            <select name="employment_type" value={formData.employment_type} onChange={handleChange} style={inputStyle}>
              <option value="freelancer_33">3.3% 프리랜서</option>
              <option value="four_insurance">4대 보험 직원</option>
            </select>
          </div>

          {/* 상세 정보 (세무/급여용) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#aaa', marginBottom: 4 }}>생년월일</label>
              <input name="birth_date" type="date" value={formData.birth_date || ''} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#aaa', marginBottom: 4 }}>전화번호</label>
              <input name="phone_number" placeholder="010-0000-0000" value={formData.phone_number || ''} onChange={handleChange} style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#aaa', marginBottom: 4 }}>은행명</label>
              <input name="bank_name" placeholder="예: 국민" value={formData.bank_name || ''} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#aaa', marginBottom: 4 }}>계좌번호</label>
              <input name="account_number" placeholder="숫자만 입력" value={formData.account_number || ''} onChange={handleChange} style={inputStyle} />
            </div>
          </div>

          {/* 날짜 정보 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#aaa', marginBottom: 4 }}>입사일</label>
              <input name="hire_date" type="date" value={formData.hire_date || ''} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#aaa', marginBottom: 4 }}>퇴사일</label>
              <input name="end_date" type="date" value={formData.end_date || ''} onChange={handleChange} style={inputStyle} />
            </div>
          </div>
          
          {/* 재직 상태 */}
           <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={formData.is_active ?? true} 
                  onChange={(e) => setFormData(prev => ({...prev, is_active: e.target.checked}))}
                />
                현재 재직 중 (체크 해제 시 퇴사 처리)
              </label>
           </div>

        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 24, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', background: '#444', border: 'none', color: '#fff', borderRadius: 4, cursor: 'pointer' }}>취소</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '10px 20px', background: 'royalblue', border: 'none', color: '#fff', borderRadius: 4, cursor: 'pointer' }}>
            {saving ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: 10, backgroundColor: '#333', border: '1px solid #555', color: '#fff', borderRadius: 4
};