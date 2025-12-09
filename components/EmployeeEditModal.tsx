'use client';

import React, { useState, useEffect } from 'react';
import type { Employee } from '@/app/dashboard/page';
import DateSelector from './DateSelector';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  onUpdate: (id: string, updates: Partial<Employee>) => Promise<void>;
};

export default function EmployeeEditModal({ isOpen, onClose, employee, onUpdate }: Props) {
  // 기본 정보
  const [name, setName] = useState('');
  
  // 전화번호 3분할
  const [phone1, setPhone1] = useState('010');
  const [phone2, setPhone2] = useState('');
  const [phone3, setPhone3] = useState('');

  const [hireDate, setHireDate] = useState('');
  const [birthDate, setBirthDate] = useState('');
  
  // 고용 및 급여
  const [employmentType, setEmploymentType] = useState('');
  
  // ✅ 급여 방식 (3가지로 확장)
  const [payType, setPayType] = useState<'time' | 'day' | 'month'>('time');
  
  const [hourlyWage, setHourlyWage] = useState('');
  const [dailyWage, setDailyWage] = useState('');
  const [monthlyWage, setMonthlyWage] = useState('');

  // 은행 정보
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  // 퇴사 관리
  const [isActive, setIsActive] = useState(true);
  const [endDate, setEndDate] = useState('');

  // 로딩 상태
  const [isSaving, setIsSaving] = useState(false);

  // ✅ 데이터 채워넣기
  useEffect(() => {
    if (isOpen && employee) {
      setName(employee.name);
      
      // 전화번호 분리 (예: 010-1234-5678)
      if (employee.phone_number) {
        const parts = employee.phone_number.split('-');
        if (parts.length === 3) {
          setPhone1(parts[0]);
          setPhone2(parts[1]);
          setPhone3(parts[2]);
        }
      } else {
        setPhone1('010'); setPhone2(''); setPhone3('');
      }

      setHireDate(employee.hire_date || '');
      setBirthDate(employee.birth_date || '');
      setEmploymentType(employee.employment_type);
      
      // 숫자 콤마 포맷팅
      setHourlyWage(employee.hourly_wage ? employee.hourly_wage.toLocaleString() : '');
      setDailyWage(employee.daily_wage ? employee.daily_wage.toLocaleString() : '');
      setMonthlyWage(employee.monthly_wage ? employee.monthly_wage.toLocaleString() : '');

      // ✅ 급여 타입 결정 로직 (기존 데이터 호환)
      // 1. DB에 'month'로 저장되어 있거나
      // 2. 월급(monthly_wage) 값이 있으면 'month' 모드로 보여줌
      if (employee.pay_type === 'month' || (employee.monthly_wage && employee.monthly_wage > 0)) {
        setPayType('month');
      } else if (employee.pay_type === 'day') {
        setPayType('day');
      } else {
        setPayType('time');
      }

      setBankName(employee.bank_name || '');
      setAccountNumber(employee.account_number || '');
      setIsActive(employee.is_active);
      setEndDate(employee.end_date || '');
    }
  }, [isOpen, employee]);

  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const raw = e.target.value.replace(/,/g, '');
    if (/^\d*$/.test(raw)) {
      setter(raw === '' ? '' : Number(raw).toLocaleString());
    }
  };

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void, maxLen: number) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length <= maxLen) setter(val);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 전화번호 합치기
      const fullPhone = `${phone1}-${phone2}-${phone3}`;

      // ✅ [중요] 선택된 급여 방식 외에는 모두 0으로 초기화 (데이터 꼬임 방지)
      const finalHourly = payType === 'time' ? Number(hourlyWage.replace(/,/g, '')) : 0;
      const finalDaily = payType === 'day' ? Number(dailyWage.replace(/,/g, '')) : 0;
      const finalMonthly = payType === 'month' ? Number(monthlyWage.replace(/,/g, '')) : 0;

      await onUpdate(employee.id, {
        name,
        phone_number: fullPhone.length > 8 ? fullPhone : '', // 번호가 너무 짧으면 저장 안함
        hire_date: hireDate,
        birth_date: birthDate,
        employment_type: employmentType as any,
        
        pay_type: payType, // 'time' | 'day' | 'month' 저장
        hourly_wage: finalHourly,
        daily_wage: finalDaily,
        monthly_wage: finalMonthly,
        
        bank_name: bankName,
        account_number: accountNumber,
        is_active: isActive,
        end_date: isActive ? undefined : endDate,
      });
      onClose();
    } catch (e) {
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetire = () => {
    if (!confirm('해당 직원을 퇴사 처리하시겠습니까?')) return;
    setIsActive(false);
    setEndDate(new Date().toISOString().split('T')[0]); 
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>직원 정보 수정</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' }}>&times;</button>
        </div>

        <div className="form-container">
          
          {/* 이름 & 전화번호 (3분할) */}
          <div className="form-row">
            <div className="form-group" style={{ flex: 0.8 }}>
              <label>이름</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
            </div>
            <div className="form-group" style={{ flex: 1.2 }}>
              <label>전화번호</label>
              <div className="phone-row">
                <input className="phone-input" value={phone1} onChange={(e)=>handlePhoneInput(e, setPhone1, 3)} />
                <span className="dash">-</span>
                <input className="phone-input" value={phone2} onChange={(e)=>handlePhoneInput(e, setPhone2, 4)} />
                <span className="dash">-</span>
                <input className="phone-input" value={phone3} onChange={(e)=>handlePhoneInput(e, setPhone3, 4)} />
              </div>
            </div>
          </div>

          {/* 고용 형태 & 입사일 */}
          <div className="form-row">
            <div className="form-group">
              <label>고용 형태</label>
              <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} className="input-field">
                <option value="four_insurance">4대 보험</option>
                <option value="freelancer_33">3.3% 프리랜서</option>
              </select>
            </div>
            <div className="form-group">
              <label>입사일</label>
              <div style={{ width: '100%' }}><DateSelector value={hireDate} onChange={setHireDate} /></div>
            </div>
          </div>

          <div className="divider" />

          {/* ✅ 급여 설정 (3단 토글 + 단일 입력창) */}
          <div className="form-group">
            <label>급여 방식</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              
              {/* 3단 토글 */}
              <div className="toggle-group">
                <button className={`toggle-btn ${payType === 'time' ? 'active' : ''}`} onClick={() => setPayType('time')}>시급</button>
                <button className={`toggle-btn ${payType === 'day' ? 'active-orange' : ''}`} onClick={() => setPayType('day')}>일당</button>
                <button className={`toggle-btn ${payType === 'month' ? 'active-blue' : ''}`} onClick={() => setPayType('month')}>월급</button>
              </div>

              {/* 입력창 (선택된 타입에 따라 값이 바뀜) */}
              <div style={{ position: 'relative', flex: 1 }}>
                {payType === 'time' && (
                    <input type="text" value={hourlyWage} onChange={(e) => handleNumberInput(e, setHourlyWage)} className="input-field" style={{ textAlign: 'right', paddingRight: '30px' }} placeholder="0" />
                )}
                {payType === 'day' && (
                    <input type="text" value={dailyWage} onChange={(e) => handleNumberInput(e, setDailyWage)} className="input-field" style={{ textAlign: 'right', paddingRight: '30px', borderColor:'#f39c12', background:'#fffbf0' }} placeholder="0" />
                )}
                {payType === 'month' && (
                    <input type="text" value={monthlyWage} onChange={(e) => handleNumberInput(e, setMonthlyWage)} className="input-field" style={{ textAlign: 'right', paddingRight: '30px', borderColor:'#3498db', background:'#f0f9ff' }} placeholder="0" />
                )}
                <span className="unit">원</span>
              </div>

            </div>
          </div>

          <div className="divider" />

          {/* 은행 정보 */}
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>은행명</label>
              <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} className="input-field" />
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label>계좌번호</label>
              <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="input-field" />
            </div>
          </div>

          {/* 생년월일 */}
          <div className="form-group">
            <label>생년월일</label>
            <DateSelector value={birthDate} onChange={setBirthDate} />
          </div>

          {/* 퇴사 관리 */}
          <div className="status-box">
            {isActive ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#27ae60', fontWeight: 'bold' }}>● 재직 중</span>
                <button onClick={handleRetire} className="retire-btn">퇴사 처리</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>● 퇴사함</span>
                <span style={{ fontSize: '13px', color: '#666' }}>(퇴사일: {endDate})</span>
                <button onClick={() => setIsActive(true)} style={{ marginLeft: 'auto', fontSize: '12px', padding: '4px 8px', cursor: 'pointer' }}>재입사 처리</button>
              </div>
            )}
          </div>

        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-cancel">취소</button>
          <button onClick={handleSave} className="btn-save" disabled={isSaving}>
            {isSaving ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background-color: rgba(0,0,0,0.6); z-index: 9999;
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
        }
        .modal-content {
          background: #fff; width: 100%; max-width: 480px;
          border-radius: 16px; padding: 24px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          max-height: 90vh; overflow-y: auto;
        }
        
        .form-container { display: flex; flex-direction: column; gap: 16px; }
        .form-row { display: flex; gap: 12px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; flex: 1; }
        .form-group label { font-size: 13px; font-weight: bold; color: #555; }
        
        .input-field {
          width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px;
          font-size: 14px; box-sizing: border-box; outline: none; background: #f9f9f9;
        }
        .input-field:focus { border-color: #0052cc; background: #fff; }

        /* 전화번호 3분할 스타일 */
        .phone-row { display: flex; align-items: center; gap: 4px; width: 100%; }
        .phone-input {
            flex: 1; min-width: 0; padding: 12px 0; border: 1px solid #ddd; border-radius: 8px;
            font-size: 14px; text-align: center; outline: none; background: #f9f9f9;
        }
        .phone-input:focus { border-color: #0052cc; background: #fff; }
        .dash { color: #888; font-weight: bold; flex-shrink: 0; }

        .divider { height: 1px; background-color: #eee; margin: 4px 0; }

        /* 3단 토글 스타일 */
        .toggle-group { display: flex; background: #eee; padding: 2px; border-radius: 6px; }
        .toggle-btn {
          padding: 10px 14px; border: none; border-radius: 4px; font-size: 13px; cursor: pointer;
          background: transparent; color: #666;
        }
        .toggle-btn.active { background: #fff; color: #0052cc; font-weight: bold; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .toggle-btn.active-orange { background: #fff; color: #e67e22; font-weight: bold; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .toggle-btn.active-blue { background: #fff; color: #3498db; font-weight: bold; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

        .unit { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: #888; font-size: 13px; }

        .status-box {
          background: #fdfdfd; border: 1px solid #eee; padding: 12px; border-radius: 8px; margin-top: 10px;
        }
        .retire-btn {
          border: 1px solid #ffcccc; background: #fff5f5; color: #e74c3c;
          padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;
        }

        .modal-footer {
          display: flex; gap: 10px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #f0f0f0;
        }
        .btn-cancel {
          flex: 1; padding: 14px; border: none; background: #f0f0f0; color: #333; border-radius: 8px; cursor: pointer; font-weight: bold;
        }
        .btn-save {
          flex: 2; padding: 14px; border: none; background: #0052cc; color: #fff; border-radius: 8px; cursor: pointer; font-weight: bold;
        }
      `}</style>
    </div>
  );
}