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
  const [phone, setPhone] = useState('');
  const [hireDate, setHireDate] = useState('');
  const [birthDate, setBirthDate] = useState('');
  
  // 고용 및 급여
  const [employmentType, setEmploymentType] = useState('');
  const [payType, setPayType] = useState<'time' | 'day'>('time');
  const [hourlyWage, setHourlyWage] = useState('');
  const [dailyWage, setDailyWage] = useState('');
  const [monthlyWage, setMonthlyWage] = useState(''); // ✅ 월급 상태

  // 은행 정보
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  // 퇴사 관리
  const [isActive, setIsActive] = useState(true);
  const [endDate, setEndDate] = useState('');

  // 로딩 상태
  const [isSaving, setIsSaving] = useState(false);

  // ✅ [핵심 1] 모달 열릴 때 기존 데이터 채워넣기 (월급 포함)
  useEffect(() => {
    if (isOpen && employee) {
      setName(employee.name);
      setPhone(employee.phone_number || '');
      setHireDate(employee.hire_date || '');
      setBirthDate(employee.birth_date || '');
      
      setEmploymentType(employee.employment_type);
      setPayType((employee.pay_type as 'time' | 'day') || 'time');
      
      // 숫자 -> 문자열 변환 (콤마 추가)
      setHourlyWage(employee.hourly_wage ? employee.hourly_wage.toLocaleString() : '');
      setDailyWage(employee.daily_wage ? employee.daily_wage.toLocaleString() : '');
      
      // ✅ DB에서 가져온 월급 정보(monthly_wage)를 바로 꽂아줍니다!
      setMonthlyWage(employee.monthly_wage ? employee.monthly_wage.toLocaleString() : '');

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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(employee.id, {
        name,
        phone_number: phone,
        hire_date: hireDate,
        birth_date: birthDate,
        employment_type: employmentType as any,
        pay_type: payType,
        hourly_wage: Number(hourlyWage.replace(/,/g, '')),
        daily_wage: Number(dailyWage.replace(/,/g, '')),
        monthly_wage: Number(monthlyWage.replace(/,/g, '')), // ✅ 월급 저장
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
    setEndDate(new Date().toISOString().split('T')[0]); // 오늘 날짜로 퇴사
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
          
          {/* ✅ [디자인 개선] 이름 & 전화번호를 한 줄에 배치 */}
          <div className="form-row">
            <div className="form-group">
              <label>이름</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
            </div>
            <div className="form-group">
              <label>전화번호</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" className="input-field" />
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

          {/* 급여 설정 (토글 + 금액) */}
          <div className="form-group">
            <label>급여 방식</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="toggle-group">
                <button 
                  className={`toggle-btn ${payType === 'time' ? 'active' : ''}`} 
                  onClick={() => setPayType('time')}
                >시급</button>
                <button 
                  className={`toggle-btn ${payType === 'day' ? 'active' : ''}`} 
                  onClick={() => setPayType('day')}
                >일당</button>
              </div>
              <div style={{ position: 'relative', flex: 1 }}>
                <input 
                  type="text" 
                  value={payType === 'time' ? hourlyWage : dailyWage} 
                  onChange={(e) => payType === 'time' ? handleNumberInput(e, setHourlyWage) : handleNumberInput(e, setDailyWage)}
                  className="input-field"
                  style={{ textAlign: 'right', paddingRight: '30px' }}
                />
                <span className="unit">원</span>
              </div>
            </div>
          </div>

          {/* 고정 월급 */}
          <div className="form-group">
            <label style={{ color: 'dodgerblue' }}>고정 월급 (선택)</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                value={monthlyWage} 
                onChange={(e) => handleNumberInput(e, setMonthlyWage)}
                className="input-field monthly-input"
                placeholder="입력 시 시급/일당 무시하고 적용됨"
              />
              <span className="unit">원</span>
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
        
        /* ✅ 2열 그리드 레이아웃 (PC/모바일 공통) */
        .form-row { display: flex; gap: 12px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; flex: 1; }
        .form-group label { font-size: 13px; font-weight: bold; color: #555; }
        
        .input-field {
          width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px;
          font-size: 14px; box-sizing: border-box; outline: none; background: #f9f9f9;
        }
        .input-field:focus { border-color: #0052cc; background: #fff; }
        .monthly-input { background-color: #f0f9ff; border-color: #bae7ff; }

        .divider { height: 1px; background-color: #eee; margin: 4px 0; }

        /* 토글 버튼 그룹 */
        .toggle-group { display: flex; background: #eee; padding: 2px; border-radius: 6px; }
        .toggle-btn {
          padding: 10px 14px; border: none; border-radius: 4px; font-size: 13px; cursor: pointer;
          background: transparent; color: #666;
        }
        .toggle-btn.active { background: #fff; color: #0052cc; font-weight: bold; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

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