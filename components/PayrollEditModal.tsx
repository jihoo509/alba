import React, { useState, useEffect } from 'react';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeName: string;
  originalPay: number; // 원래 시급으로 계산된 금액
  currentOverride: number | null; // 현재 설정된 확정 급여 (없으면 null)
  currentAdjustment: number; // 현재 설정된 추가/공제액 (0이면 없음)
  onSave: (override: number | null, adjustment: number) => void;
}

export default function PayrollEditModal({
  isOpen,
  onClose,
  employeeName,
  originalPay,
  currentOverride,
  currentAdjustment,
  onSave,
}: EditModalProps) {
  const [overrideInput, setOverrideInput] = useState<string>('');
  const [adjustmentInput, setAdjustmentInput] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      // 모달이 열릴 때 기존 값 세팅
      setOverrideInput(currentOverride ? currentOverride.toString() : '');
      setAdjustmentInput(currentAdjustment !== 0 ? currentAdjustment.toString() : '');
    }
  }, [isOpen, currentOverride, currentAdjustment]);

  const handleSave = () => {
    const overrideVal = overrideInput.trim() === '' ? null : Number(overrideInput.replace(/,/g, ''));
    const adjustVal = adjustmentInput.trim() === '' ? 0 : Number(adjustmentInput.replace(/,/g, ''));
    
    onSave(overrideVal, adjustVal);
    onClose();
  };

  // 미리보기 계산
  const basePay = overrideInput.trim() === '' ? originalPay : Number(overrideInput.replace(/,/g, ''));
  const finalPay = basePay + (adjustmentInput.trim() === '' ? 0 : Number(adjustmentInput.replace(/,/g, '')));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2 className="text-xl font-bold mb-4">{employeeName} 급여 수정</h2>

        {/* 1. 확정 급여 입력 (시급 무시) */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            확정 월급여 (선택)
          </label>
          <input
            type="number"
            placeholder={`기존 시급 계산액: ${originalPay.toLocaleString()}원`}
            value={overrideInput}
            onChange={(e) => setOverrideInput(e.target.value)}
            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            * 금액 입력 시 시급 계산을 무시하고 이 금액을 기본 급여로 사용합니다.
          </p>
        </div>

        {/* 2. 추가 및 삭감 (보너스/공제) */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            추가 및 삭감 (보너스/공제)
          </label>
          <input
            type="number"
            placeholder="0"
            value={adjustmentInput}
            onChange={(e) => setAdjustmentInput(e.target.value)}
            className={`w-full border p-2 rounded focus:ring-2 outline-none ${
              Number(adjustmentInput) < 0 ? 'text-red-600' : 'text-blue-600'
            }`}
          />
          <p className="text-xs text-gray-500 mt-1">
            * 양수(+)는 보너스, 음수(-)는 공제로 처리됩니다.
          </p>
        </div>

        {/* 3. 최종 예상 금액 미리보기 */}
        <div className="bg-gray-100 p-4 rounded-lg mb-6 flex justify-between items-center">
          <span className="font-semibold text-gray-600">최종 지급 예상액</span>
          <span className="text-xl font-bold text-blue-600">
            {finalPay.toLocaleString()} 원
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-200 rounded-lg font-medium hover:bg-gray-300 transition"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
}