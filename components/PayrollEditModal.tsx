'use client';

import React, { useState, useEffect } from 'react';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeName: string;
  originalPay: number;
  currentOverride: number | null;
  currentAdjustment: number;
  onSave: (override: number | null, adjustment: number) => void;
}

export default function PayrollEditModal({
  isOpen, onClose, employeeName, originalPay, currentOverride, currentAdjustment, onSave,
}: EditModalProps) {
  const [overrideInput, setOverrideInput] = useState<string>('');
  const [adjustmentInput, setAdjustmentInput] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setOverrideInput(currentOverride ? currentOverride.toString() : '');
      setAdjustmentInput(currentAdjustment !== 0 ? currentAdjustment.toString() : '');
    }
  }, [isOpen, currentOverride, currentAdjustment]);

  if (!isOpen) return null;

  const handleSave = () => {
    const overrideVal = overrideInput.trim() === '' ? null : Number(overrideInput.replace(/,/g, ''));
    const adjustVal = adjustmentInput.trim() === '' ? 0 : Number(adjustmentInput.replace(/,/g, ''));
    onSave(overrideVal, adjustVal);
  };

  const basePay = overrideInput.trim() === '' ? originalPay : Number(overrideInput.replace(/,/g, ''));
  const finalPay = basePay + (adjustmentInput.trim() === '' ? 0 : Number(adjustmentInput.replace(/,/g, '')));

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '12px', padding: '24px',
        width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', borderBottom: '2px solid #333', paddingBottom: '8px' }}>
          {employeeName} 급여 수정
        </h2>

        <div style={{ marginBottom: '16px' }}>
          {/* ✅ [수정] 멘트 변경 */}
          <label style={{ display: 'block', fontSize: '13px', color: '#555', marginBottom: '4px' }}>확정 월급여 (선택)</label>
          <input
            type="number"
            placeholder={`기존 기본급: ${(originalPay || 0).toLocaleString()}원`}
            value={overrideInput}
            onChange={(e) => setOverrideInput(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' }}
          />
          <p style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>* 입력 시 자동 계산을 무시하고 이 금액을 기본 급여로 씁니다.</p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#555', marginBottom: '4px' }}>추가 및 삭감 (보너스/공제)</label>
          <input
            type="number"
            placeholder="0"
            value={adjustmentInput}
            onChange={(e) => setAdjustmentInput(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' }}
          />
          <p style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>* 양수(+)는 보너스, 음수(-)는 공제입니다.</p>
        </div>

        <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 'bold', color: '#555' }}>최종 지급 예상액</span>
          <span style={{ fontWeight: 'bold', color: 'blue', fontSize: '16px' }}>{finalPay.toLocaleString()} 원</span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', background: '#eee', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>취소</button>
          <button onClick={handleSave} style={{ flex: 1, padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>저장하기</button>
        </div>
      </div>
    </div>
  );
}