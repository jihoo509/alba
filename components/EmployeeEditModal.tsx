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
  const [name, setName] = useState('');
  
  // 전화번호 3분할
  const [phone1, setPhone1] = useState('010');
  const [phone2, setPhone2] = useState('');
  const [phone3, setPhone3] = useState('');

  const [hireDate, setHireDate] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [payType, setPayType] = useState<'time' | 'day' | 'month'>('time');
  const [hourlyWage, setHourlyWage] = useState('');
  const [dailyWage, setDailyWage] = useState('');
  const [monthlyWage, setMonthlyWage] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [endDate, setEndDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // 퇴사 모드 상태
  const [isRetireMode, setIsRetireMode] = useState(false);
  const [retireDate, setRetireDate] = useState('');

  useEffect(() => {
    if (isOpen && employee) {
      setName(employee.name);
      
      if (employee.phone_number) {
        const parts = employee.phone_number.split('-');
        if (parts.length === 3) {
          setPhone1(parts[0]);
          setPhone2(parts[1]);
          setPhone3(parts[2]);
        } else {
            setPhone1('010'); setPhone2(''); setPhone3('');
        }
      } else {
        setPhone1('010'); setPhone2(''); setPhone3('');
      }

      setHireDate(employee.hire_date || '');
      setBirthDate(employee.birth_date || '');
      setEmploymentType(employee.employment_type);
      
      setHourlyWage(employee.hourly_wage ? employee.hourly_wage.toLocaleString() : '');
      setDailyWage(employee.daily_wage ? employee.daily_wage.toLocaleString() : '');
      setMonthlyWage(employee.monthly_wage ? employee.monthly_wage.toLocaleString() : '');

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
      
      setIsRetireMode(false);
      // 기본 퇴사일은 오늘 날짜로 세팅
      setRetireDate(new Date().toISOString().split('T')[0]); 
    }
  }, [isOpen, employee]);

  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const raw = e.target.value.replace(/,/g, '');
    if (/^\d*$/.test(raw)) setter(raw === '' ? '' : Number(raw).toLocaleString());
  };

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void, maxLen: number) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length <= maxLen) setter(val);
  };

  // 일반 정보 저장 (이름, 급여 등)
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const fullPhone = `${phone1}-${phone2}-${phone3}`;
      const finalPhone = (phone2.length >= 3 && phone3.length >= 4) ? fullPhone : '';

      const finalHourly = payType === 'time' ? Number(hourlyWage.replace(/,/g, '')) : 0;
      const finalDaily = payType === 'day' ? Number(dailyWage.replace(/,/g, '')) : 0;
      const finalMonthly = payType === 'month' ? Number(monthlyWage.replace(/,/g, '')) : 0;

      const safeHireDate = hireDate === '' ? null : hireDate;
      const safeBirthDate = birthDate === '' ? null : birthDate;
      
      // 여기서는 endDate를 건드리지 않고 현재 상태(isActive)에 따라 유지
      const safeEndDate = isActive ? null : (endDate === '' ? null : endDate);

      await onUpdate(employee.id, {
        name,
        phone_number: finalPhone,
        hire_date: safeHireDate as any,   
        birth_date: safeBirthDate as any, 
        employment_type: employmentType as any,
        pay_type: payType,
        hourly_wage: finalHourly,
        daily_wage: finalDaily,
        monthly_wage: finalMonthly,
        bank_name: bankName,
        account_number: accountNumber,
        is_active: isActive,
        end_date: safeEndDate as any,     
      });
      onClose();
    } catch (e: any) {
      console.error(e);
      alert('저장 중 오류가 발생했습니다.\n' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const openRetireMode = () => {
      setIsRetireMode(true);
  };

  // ✅ [수정] 퇴사 즉시 저장 로직
  const confirmRetireDate = async () => {
      if (!retireDate) return alert('퇴사일을 선택해주세요.');
      
      try {
          // 1. DB에 즉시 업데이트 요청
          await onUpdate(employee.id, {
              is_active: false,
              end_date: retireDate
          });

          // 2. 성공 시 로컬 상태 업데이트
          setIsActive(false);
          setEndDate(retireDate);
          setIsRetireMode(false);
          
          alert('퇴사 처리가 저장되었습니다.');
      } catch (e: any) {
          alert('퇴사 처리 저장 실패: ' + e.message);
      }
  };

  // ✅ [수정] 재입사 즉시 저장 로직
  const handleRehire = async () => {
      if(!confirm('해당 직원을 재직 상태로 변경하시겠습니까?')) return;
      
      try {
          // 1. DB 업데이트 (퇴사일 제거)
          await onUpdate(employee.id, {
              is_active: true,
              end_date: null as any // null을 보내서 날짜 삭제
          });

          // 2. 상태 업데이트
          setIsActive(true);
          setEndDate('');
          alert('재직 상태로 변경되었습니다.');
      } catch (e: any) {
          alert('변경 실패: ' + e.message);
      }
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

          <div className="form-group">
            <label>급여 방식</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div className="toggle-group">
                <button className={`toggle-btn ${payType === 'time' ? 'active' : ''}`} onClick={() => setPayType('time')}>시급</button>
                <button className={`toggle-btn ${payType === 'day' ? 'active-orange' : ''}`} onClick={() => setPayType('day')}>일당</button>
                <button className={`toggle-btn ${payType === 'month' ? 'active-blue' : ''}`} onClick={() => setPayType('month')}>월급</button>
              </div>
              <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                {payType === 'time' && <input type="text" value={hourlyWage} onChange={(e) => handleNumberInput(e, setHourlyWage)} className="input-field" style={{ textAlign: 'right', paddingRight: '30px' }} placeholder="0" />}
                {payType === 'day' && <input type="text" value={dailyWage} onChange={(e) => handleNumberInput(e, setDailyWage)} className="input-field" style={{ textAlign: 'right', paddingRight: '30px', borderColor:'#f39c12', background:'#fffbf0' }} placeholder="0" />}
                {payType === 'month' && <input type="text" value={monthlyWage} onChange={(e) => handleNumberInput(e, setMonthlyWage)} className="input-field" style={{ textAlign: 'right', paddingRight: '30px', borderColor:'#3498db', background:'#f0f9ff' }} placeholder="0" />}
                <span className="unit">원</span>
              </div>
            </div>
          </div>

          <div className="divider" />

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>은행명</label>
              <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} className="input-field" placeholder="예: 국민" />
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label>계좌번호</label>
              <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="input-field" placeholder="숫자만 입력" />
            </div>
          </div>

          <div className="form-group">
            <label>생년월일</label>
            <DateSelector value={birthDate} onChange={setBirthDate} />
          </div>

          {/* 상태 변경 박스 (재직/퇴사) */}
          <div className="status-box">
            {isRetireMode ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <label style={{ fontSize: 13, fontWeight: 'bold', color: '#e74c3c' }}>마지막 근무일(퇴사일) 선택</label>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        <div style={{flex:1}}><DateSelector value={retireDate} onChange={setRetireDate} /></div>
                        <button onClick={() => setIsRetireMode(false)} style={{ padding:'8px 12px', background:'#f0f0f0', border:'none', borderRadius:6, cursor:'pointer' }}>취소</button>
                        <button onClick={confirmRetireDate} style={{ padding:'8px 12px', background:'crimson', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontWeight:'bold' }}>확인</button>
                    </div>
                </div>
            ) : isActive ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#27ae60', fontWeight: 'bold' }}>● 재직 중</span>
                <button onClick={openRetireMode} className="retire-btn">퇴사 처리</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>● 퇴사함</span>
                <span style={{ fontSize: '13px', color: '#666' }}>(퇴사일: {endDate})</span>
                <button onClick={handleRehire} style={{ marginLeft: 'auto', fontSize: '12px', padding: '4px 8px', cursor: 'pointer', background:'#e6f7ff', border:'1px solid #1890ff', color:'#1890ff', borderRadius:4 }}>재입사 처리</button>
              </div>
            )}
          </div>

        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-cancel">닫기</button>
          <button onClick={handleSave} className="btn-save" disabled={isSaving}>
            {isSaving ? '저장 중...' : '정보 수정 저장'}
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
        .form-group { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 0; }
        .form-group label { font-size: 13px; font-weight: bold; color: #555; }
        
        .input-field {
          width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px;
          font-size: 14px; box-sizing: border-box; outline: none; background: #f9f9f9;
        }
        .input-field:focus { border-color: #0052cc; background: #fff; }

        .phone-row { display: flex; align-items: center; gap: 4px; width: 100%; }
        .phone-input {
            flex: 1; width: 100%; min-width: 0; padding: 10px 0; border: 1px solid #ddd; border-radius: 8px;
            font-size: 14px; text-align: center; outline: none; background: #f9f9f9;
        }
        .phone-input:focus { border-color: #0052cc; background: #fff; }
        .dash { color: #888; font-weight: bold; flex-shrink: 0; }

        .divider { height: 1px; background-color: #eee; margin: 4px 0; }

        .toggle-group { display: flex; background: #eee; padding: 2px; border-radius: 6px; flex-shrink: 0; }
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