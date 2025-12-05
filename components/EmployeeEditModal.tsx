'use client';

import React, { useState, useEffect } from 'react';
import type { Employee } from '@/app/dashboard/page';
import DateSelector from './DateSelector';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  onUpdate: (id: string, updates: Partial<Employee>) => Promise<void>;
};

export default function EmployeeEditModal({ isOpen, onClose, employee, onUpdate }: Props) {
  const [formData, setFormData] = useState<Partial<Employee>>({});
  const [saving, setSaving] = useState(false);
  
  // ✅ 고정 월급 상태 (문자열로 관리하며 콤마 포함)
  const [monthlyOverride, setMonthlyOverride] = useState<string>('');
  
  const supabase = createSupabaseBrowserClient();

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

      const fetchSettings = async () => {
        const { data } = await supabase
          .from('employee_settings')
          .select('monthly_override')
          .eq('employee_id', employee.id)
          .single();
        
        if (data && data.monthly_override) {
          // 불러올 때 콤마 찍어서 보여주기
          setMonthlyOverride(Number(data.monthly_override).toLocaleString());
        } else {
          setMonthlyOverride('');
        }
      };
      fetchSettings();
    }
  }, [isOpen, employee, supabase]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // ✅ 시급 입력 시 콤마 처리 로직
    if (name === 'hourly_wage') {
        const rawValue = value.replace(/,/g, ''); // 콤마 제거
        if (/^\d*$/.test(rawValue)) { // 숫자만 허용
            setFormData(prev => ({ 
                ...prev, 
                [name]: rawValue === '' ? 0 : Number(rawValue) 
            }));
        }
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // ✅ 고정 월급 입력 핸들러 (콤마 자동 추가)
  const handleMonthlyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/,/g, '');
    if (/^\d*$/.test(rawValue)) {
        const formatted = rawValue === '' ? '' : Number(rawValue).toLocaleString();
        setMonthlyOverride(formatted);
    }
  };

  const handleDateChange = (field: keyof Employee, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleResignation = () => {
    const today = new Date().toISOString().split('T')[0];
    if (formData.end_date) {
      setFormData(prev => ({ ...prev, end_date: '', is_active: true }));
    } else {
      setFormData(prev => ({ ...prev, end_date: today, is_active: false }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const isActive = !formData.end_date; 

    const updates = {
      ...formData,
      is_active: isActive,
      hire_date: formData.hire_date === '' ? null : formData.hire_date,
      end_date: formData.end_date === '' ? null : formData.end_date,
      birth_date: formData.birth_date === '' ? null : formData.birth_date,
      phone_number: formData.phone_number === '' ? null : formData.phone_number,
      bank_name: formData.bank_name === '' ? null : formData.bank_name,
      account_number: formData.account_number === '' ? null : formData.account_number,
    };
    
    // @ts-ignore
    await onUpdate(employee.id, updates);

    // 고정 월급 저장 (콤마 제거 후 숫자 저장)
    const overrideValue = monthlyOverride.trim() ? Number(monthlyOverride.replace(/,/g, '')) : null;
    
    const { error } = await supabase.from('employee_settings').upsert({
        employee_id: employee.id,
        monthly_override: overrideValue,
    }, { onConflict: 'employee_id' });

    if (error) console.error('고정 월급 저장 실패:', error);

    setSaving(false);
    onClose();
  };

  const getStatusLabel = () => {
    if (!formData.end_date) return { text: '재직 중', color: 'green' };
    const today = new Date().toISOString().split('T')[0];
    return formData.end_date > today 
      ? { text: `퇴사 예정 (${formData.end_date})`, color: 'orange' } 
      : { text: `퇴사함 (${formData.end_date})`, color: 'red' };
  };

  const status = getStatusLabel();

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={styles.title}>직원 정보 수정</h2>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <div style={styles.gridContainer}>
          {/* 1행: 이름 & 시급 */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>이름</label>
            <input name="name" value={formData.name ?? ''} onChange={handleChange} style={styles.input} />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>시급 (원)</label>
            <input 
                name="hourly_wage" 
                type="text" // ✅ text 타입으로 변경
                inputMode="numeric" // 모바일 키패드 숫자용
                value={formData.hourly_wage ? formData.hourly_wage.toLocaleString() : ''} // ✅ 콤마 표시
                onChange={handleChange} 
                style={styles.input} 
                placeholder="0"
            />
          </div>

          {/* 2행: 고정 월급 (콤마 적용) */}
          <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
            <label style={{ ...styles.label, color: 'dodgerblue', display: 'flex', justifyContent: 'space-between' }}>
                <span>고정 월급 (선택)</span>
                <span style={{fontWeight:'normal', fontSize:11, color:'#888'}}>* 입력 시 시급 계산 무시</span>
            </label>
            <input 
                type="text" // ✅ text 타입
                inputMode="numeric"
                value={monthlyOverride} 
                onChange={handleMonthlyChange} // ✅ 전용 핸들러 사용
                placeholder="금액 입력"
                style={{ ...styles.input, borderColor: '#bae7ff', backgroundColor: '#f0f9ff' }} 
            />
          </div>

          {/* 3행: 고용 형태 */}
          <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
            <label style={styles.label}>고용 형태</label>
            <select name="employment_type" value={formData.employment_type ?? 'freelancer'} onChange={handleChange} style={styles.input}>
              <option value="freelancer_33">3.3% 프리랜서</option>
              <option value="four_insurance">4대 보험 직원</option>
            </select>
          </div>

          {/* 4행: 생년월일 & 전화번호 */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>생년월일</label>
            <DateSelector value={formData.birth_date ?? ''} onChange={(val) => handleDateChange('birth_date', val)} />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>전화번호</label>
            <input name="phone_number" placeholder="010-1234-5678" value={formData.phone_number ?? ''} onChange={handleChange} style={styles.input} />
          </div>

          {/* 5행: 은행 정보 */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>은행명</label>
            <input name="bank_name" placeholder="예: 국민" value={formData.bank_name ?? ''} onChange={handleChange} style={styles.input} />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>계좌번호</label>
            <input name="account_number" placeholder="- 포함 가능" value={formData.account_number ?? ''} onChange={handleChange} style={styles.input} />
          </div>

          {/* 6행: 입사일 */}
          <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
            <label style={styles.label}>입사일</label>
            <DateSelector value={formData.hire_date ?? ''} onChange={(val) => handleDateChange('hire_date', val)} />
          </div>

          {/* 퇴사일 & 상태 표시 */}
           <div style={{ ...styles.inputGroup, gridColumn: 'span 2', marginTop: 10, padding: 16, backgroundColor: '#f9f9f9', borderRadius: 8, border: '1px solid #eee' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
               <span style={{ fontSize: 14, fontWeight: 'bold', color: status.color === 'green' ? '#2ecc71' : status.color === 'red' ? '#e74c3c' : '#f1c40f' }}>
                 ● {status.text}
               </span>
               <button 
                 onClick={toggleResignation}
                 style={{ 
                   padding: '6px 12px', borderRadius: 4, border: '1px solid #ddd', 
                   background: '#fff', 
                   color: '#555', cursor: 'pointer', fontSize: 12, fontWeight: 'bold'
                 }}
               >
                 {formData.end_date ? '퇴사 취소' : '퇴사 처리'}
               </button>
             </div>
             
             <div style={{ opacity: formData.end_date ? 1 : 0.5, pointerEvents: formData.end_date ? 'auto' : 'none', transition: 'opacity 0.2s' }}>
               <label style={{ ...styles.label, marginBottom: 6, display: 'block' }}>퇴사일 선택</label>
               <DateSelector value={formData.end_date ?? ''} onChange={(val) => handleDateChange('end_date', val)} />
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

// ✅ 스타일 (기존 유지)
const styles = {
  overlay: {
    position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
  },
  modal: {
    backgroundColor: '#ffffff', padding: '32px', borderRadius: '16px', width: '90%', maxWidth: '500px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' as const
  },
  title: { margin: 0, color: '#333', fontSize: '20px', fontWeight: 700 },
  closeBtn: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' },
  gridContainer: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' },
  inputGroup: { display: 'flex', flexDirection: 'column' as const, gap: '6px' },
  label: { fontSize: '13px', color: '#666', fontWeight: 600 },
  input: {
    width: '100%', padding: '10px 12px', backgroundColor: '#fff', border: '1px solid #ddd',
    color: '#333', borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const
  },
  buttonContainer: { display: 'flex', gap: '12px', marginTop: '32px', justifyContent: 'flex-end' },
  cancelButton: { padding: '12px 24px', background: '#f5f5f5', border: 'none', color: '#666', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 },
  saveButton: { padding: '12px 24px', background: 'dodgerblue', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }
};