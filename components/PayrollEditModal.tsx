'use client';

import React, { useState, useEffect } from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  employeeName: string;
  originalPay: number;
  currentOverride: number | null;
  currentAdjustment: number;
  onSave: (override: number | null, adjustment: number) => Promise<void>;
};

export default function PayrollEditModal({ 
  isOpen, 
  onClose, 
  employeeName, 
  originalPay, 
  currentOverride, 
  currentAdjustment, 
  onSave 
}: Props) {
  const [override, setOverride] = useState<string>('');
  const [adjustment, setAdjustment] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // 값이 있으면 쉼표가 들어간 문자열로 변환, 없으면 빈 문자열
      setOverride(currentOverride !== null ? Number(currentOverride).toLocaleString() : '');
      setAdjustment(currentAdjustment !== 0 ? Number(currentAdjustment).toLocaleString() : '');
    }
  }, [isOpen, currentOverride, currentAdjustment]);

  // 닫혀있으면 렌더링 안 함
  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 쉼표 제거 후 숫자로 변환
      const numOverride = override.trim() === '' ? null : Number(override.replace(/,/g, ''));
      const numAdjustment = adjustment.trim() === '' || adjustment === '-' ? 0 : Number(adjustment.replace(/,/g, ''));
      
      if (numOverride !== null && isNaN(numOverride)) return alert('기본급에 유효한 숫자를 입력하세요.');
      if (isNaN(numAdjustment)) return alert('조정액에 유효한 숫자를 입력하세요.');

      await onSave(numOverride, numAdjustment);
    } catch (e) {
      console.error(e);
      alert('저장 실패');
    } finally {
      setIsSaving(false);
    }
  };

  // 숫자 및 쉼표 처리, 마이너스 처리 핸들러
  const handleCurrencyInput = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const raw = e.target.value.replace(/,/g, '');
    
    if (raw === '') {
        setter('');
        return;
    }
    
    if (raw === '-') {
        setter('-');
        return;
    }

    const val = Number(raw);
    if (!isNaN(val)) {
      setter(val.toLocaleString());
    }
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 20px 0', textAlign: 'center', color: '#333' }}>
          ✏️ <strong>{employeeName}</strong> 급여 수정
        </h3>
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', color: '#555', marginBottom: 6 }}>
            확정 기본급 (덮어쓰기)
          </label>
          <input 
            type="text" 
            value={override} 
            onChange={(e) => handleCurrencyInput(e, setOverride)}
            placeholder={`계산된 급여: ${originalPay.toLocaleString()}`}
            style={inputStyle} 
          />
          <p style={{ fontSize: 12, color: '#888', margin: '4px 0 0 0' }}>
            * 입력하지 않으면 자동 계산된 금액({originalPay.toLocaleString()}원)이 적용됩니다.
          </p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', color: '#555', marginBottom: 6 }}>
            추가/공제 (조정액)
          </label>
          <input 
            type="text" 
            value={adjustment} 
            onChange={(e) => handleCurrencyInput(e, setAdjustment)}
            placeholder="0"
            style={inputStyle} 
          />
          <p style={{ fontSize: 12, color: '#888', margin: '4px 0 0 0' }}>
            * 보너스는 양수(+), 공제는 음수(-)로 입력하세요. (예: -50,000)
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={btnCancel}>취소</button>
          <button onClick={handleSave} disabled={isSaving} style={btnSave}>
            {isSaving ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20 };
const modalStyle: React.CSSProperties = { backgroundColor: '#fff', width: '100%', maxWidth: '360px', borderRadius: '12px', padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px', outline: 'none', boxSizing: 'border-box' as const, textAlign: 'right' as const };
const btnCancel = { flex: 1, padding: '12px', background: '#f0f0f0', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', color: '#333' };
const btnSave = { flex: 1, padding: '12px', background: 'dodgerblue', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', color: '#fff' };