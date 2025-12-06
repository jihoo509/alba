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
  const [monthlyOverride, setMonthlyOverride] = useState<string>('');
  
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    if (isOpen && employee) {
      setFormData({
        ...employee,
        hire_date: employee.hire_date || '',
        end_date: employee.end_date || '',
        phone_number: employee.phone_number || '',
        birth_date: employee.birth_date || '',
        bank_name: employee.bank_name || '',
        account_number: employee.account_number || '',
        pay_type: employee.pay_type || 'time',
        daily_wage: employee.daily_wage || 0,
      });

      const fetchSettings = async () => {
        const { data } = await supabase
          .from('employee_settings')
          .select('monthly_override')
          .eq('employee_id', employee.id)
          .single();
        
        if (data && data.monthly_override) {
          setMonthlyOverride(Number(data.monthly_override).toLocaleString());
        } else {
          setMonthlyOverride('');
        }
      };
      fetchSettings();
    }
  }, [isOpen, employee, supabase]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'hourly_wage' || name === 'daily_wage') {
        const rawValue = value.replace(/,/g, '');
        if (/^\d*$/.test(rawValue)) {
            setFormData(prev => ({ ...prev, [name]: rawValue === '' ? 0 : Number(rawValue) }));
        }
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePayTypeChange = (type: 'time' | 'day') => {
    setFormData(prev => ({ ...prev, pay_type: type }));
  };

  // ✅ [수정] 고용 형태 버튼 핸들러
  const handleEmploymentTypeChange = (type: 'freelancer_33' | 'four_insurance') => {
    setFormData(prev => ({ ...prev, employment_type: type }));
  };

  const handleMonthlyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/,/g, '');
    if (/^\d*$/.test(rawValue)) {
        setMonthlyOverride(rawValue === '' ? '' : Number(rawValue).toLocaleString());
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
      hire_date: formData.hire_date || null,
      end_date: formData.end_date || null,
      birth_date: formData.birth_date || null,
      phone_number: formData.phone_number || null,
      bank_name: formData.bank_name || null,
      account_number: formData.account_number || null,
      hourly_wage: formData.pay_type === 'time' ? formData.hourly_wage : 0,
      daily_wage: formData.pay_type === 'day' ? formData.daily_wage : 0,
    };
    
    // @ts-ignore
    await onUpdate(employee.id, updates);

    const overrideValue = monthlyOverride.trim() ? Number(monthlyOverride.replace(/,/g, '')) : null;
    await supabase.from('employee_settings').upsert({
        employee_id: employee.id,
        monthly_override: overrideValue,
    }, { onConflict: 'employee_id' });

    setSaving(false);
    onClose();
  };

  const status = !formData.end_date 
    ? { text: '재직 중', color: 'green' } 
    : (formData.end_date > new Date().toISOString().split('T')[0] 
        ? { text: `퇴사 예정 (${formData.end_date})`, color: 'orange' } 
        : { text: `퇴사함 (${formData.end_date})`, color: 'red' });

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={styles.title}>직원 정보 수정</h2>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <div style={styles.scrollArea}>
          <div style={styles.gridContainer}>
            
            {/* 이름 */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>이름</label>
              <input name="name" value={formData.name ?? ''} onChange={handleChange} style={styles.input} />
            </div>

            {/* ✅ [수정] 급여 방식 (토글 버튼) */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>급여 방식</label>
              <div style={styles.toggleContainer}>
                <button type="button" onClick={() => handlePayTypeChange('time')} style={formData.pay_type === 'time' ? styles.activeToggle : styles.inactiveToggle}>시급</button>
                <button type="button" onClick={() => handlePayTypeChange('day')} style={formData.pay_type === 'day' ? styles.activeToggleOrange : styles.inactiveToggle}>일당</button>
              </div>
              
              <div style={{ position: 'relative', marginTop: 8 }}>
                {formData.pay_type === 'time' ? (
                    <input 
                        name="hourly_wage" type="text" inputMode="numeric"
                        value={formData.hourly_wage ? formData.hourly_wage.toLocaleString() : ''} 
                        onChange={handleChange} style={{...styles.input, paddingRight: 40}} placeholder="0"
                    />
                ) : (
                    <input 
                        name="daily_wage" type="text" inputMode="numeric"
                        value={formData.daily_wage ? formData.daily_wage.toLocaleString() : ''} 
                        onChange={handleChange} style={{ ...styles.input, borderColor: '#ffadd2', backgroundColor: '#fff0f6', paddingRight: 40 }} placeholder="0"
                    />
                )}
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#999', fontSize: 13 }}>원</span>
              </div>
            </div>

            {/* 고정 월급 */}
            <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
              <label style={{ ...styles.label, color: 'dodgerblue', display: 'flex', justifyContent: 'space-between' }}>
                  <span>고정 월급 (선택)</span>
                  <span style={{fontWeight:'normal', fontSize:11, color:'#888'}}>* 입력 시 시급/일당 무시</span>
              </label>
              <input 
                  type="text" inputMode="numeric" value={monthlyOverride} onChange={handleMonthlyChange} 
                  placeholder="금액 입력" style={{ ...styles.input, borderColor: '#bae7ff', backgroundColor: '#f0f9ff' }} 
              />
            </div>

            {/* ✅ [수정] 고용 형태 (탭 버튼 방식 - 드롭다운 제거) */}
            <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
              <label style={styles.label}>고용 형태</label>
              <div style={styles.toggleContainer}>
                <button type="button" onClick={() => handleEmploymentTypeChange('four_insurance')} 
                  style={formData.employment_type === 'four_insurance' ? styles.activeToggleBlue : styles.inactiveToggle}>
                  4대 보험
                </button>
                <button type="button" onClick={() => handleEmploymentTypeChange('freelancer_33')} 
                  style={formData.employment_type === 'freelancer_33' ? styles.activeToggleBlue : styles.inactiveToggle}>
                  3.3% 프리랜서
                </button>
              </div>
            </div>

            {/* 입사일 */}
            <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
              <label style={styles.label}>입사일</label>
              <DateSelector value={formData.hire_date ?? ''} onChange={(val) => handleDateChange('hire_date', val)} />
            </div>

            {/* 기타 정보 (접을 수도 있지만 일단 다 펼침) */}
            <div style={styles.inputGroup}><label style={styles.label}>생년월일</label><DateSelector value={formData.birth_date ?? ''} onChange={(val) => handleDateChange('birth_date', val)} /></div>
            <div style={styles.inputGroup}><label style={styles.label}>전화번호</label><input name="phone_number" value={formData.phone_number ?? ''} onChange={handleChange} style={styles.input} /></div>
            <div style={styles.inputGroup}><label style={styles.label}>은행명</label><input name="bank_name" value={formData.bank_name ?? ''} onChange={handleChange} style={styles.input} /></div>
            <div style={styles.inputGroup}><label style={styles.label}>계좌번호</label><input name="account_number" value={formData.account_number ?? ''} onChange={handleChange} style={styles.input} /></div>

            {/* 퇴사 처리 */}
             <div style={{ ...styles.inputGroup, gridColumn: 'span 2', marginTop: 10, padding: 16, backgroundColor: '#f9f9f9', borderRadius: 8, border: '1px solid #eee' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                 <span style={{ fontSize: 14, fontWeight: 'bold', color: status.color === 'green' ? '#2ecc71' : status.color === 'red' ? '#e74c3c' : '#f1c40f' }}>● {status.text}</span>
                 <button onClick={toggleResignation} style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid #ddd', background: '#fff', color: '#555', cursor: 'pointer', fontSize: 12 }}>
                   {formData.end_date ? '퇴사 취소' : '퇴사 처리'}
                 </button>
               </div>
               {formData.end_date && (
                 <div><label style={{ ...styles.label, marginBottom: 6, display: 'block' }}>퇴사일 선택</label><DateSelector value={formData.end_date ?? ''} onChange={(val) => handleDateChange('end_date', val)} /></div>
               )}
             </div>
          </div>
        </div>

        <div style={styles.buttonContainer}>
          <button onClick={onClose} style={styles.cancelButton}>취소</button>
          <button onClick={handleSave} disabled={saving} style={styles.saveButton}>{saving ? '저장 중...' : '저장하기'}</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modal: { backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', width: '90%', maxWidth: '500px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' as const },
  scrollArea: { overflowY: 'auto' as const, flex: 1, paddingRight: 4 },
  title: { margin: 0, color: '#333', fontSize: '20px', fontWeight: 700 },
  closeBtn: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' },
  gridContainer: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start', paddingBottom: 10 },
  inputGroup: { display: 'flex', flexDirection: 'column' as const, gap: '6px' },
  label: { fontSize: '13px', color: '#666', fontWeight: 600 },
  input: { width: '100%', padding: '10px 12px', backgroundColor: '#fff', border: '1px solid #ddd', color: '#333', borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const },
  
  // 토글 스타일
  toggleContainer: { display: 'flex', backgroundColor: '#f0f2f5', padding: '4px', borderRadius: '8px' },
  activeToggle: { flex: 1, padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: '#fff', color: 'dodgerblue', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', cursor: 'pointer', fontSize: 13 },
  activeToggleOrange: { flex: 1, padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: '#fff', color: '#e67e22', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', cursor: 'pointer', fontSize: 13 },
  activeToggleBlue: { flex: 1, padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: '#fff', color: '#2563eb', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', cursor: 'pointer', fontSize: 13 },
  inactiveToggle: { flex: 1, padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', color: '#888', cursor: 'pointer', fontSize: 13 },

  buttonContainer: { display: 'flex', gap: '12px', marginTop: '20px', paddingTop: 10, borderTop: '1px solid #eee' },
  cancelButton: { padding: '12px 24px', background: '#f5f5f5', border: 'none', color: '#666', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, flex: 1 },
  saveButton: { padding: '12px 24px', background: 'dodgerblue', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, flex: 2 }
};