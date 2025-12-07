'use client';

import React, { useState } from 'react';

type Props = {
  isOpen: boolean;
  onUpdate: (password: string, phone: string) => void;
  loading: boolean;
};

export default function AdditionalInfoModal({ isOpen, onUpdate, loading }: Props) {
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  
  const [phonePart1, setPhonePart1] = useState('010');
  const [phonePart2, setPhonePart2] = useState('');
  const [phonePart3, setPhonePart3] = useState('');

  // 개인정보 동의는 소셜 로그인 시 이미 동의했다고 가정하거나, 필요시 추가
  // 여기서는 정보 입력에 집중합니다.

  if (!isOpen) return null;

  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>, maxLength: number) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= maxLength) setter(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== passwordConfirm) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (password.length < 6) {
      alert('비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    if (phonePart1.length < 3 || phonePart2.length < 4 || phonePart3.length < 4) {
      alert('전화번호를 올바르게 입력해주세요.');
      return;
    }

    const fullPhone = `${phonePart1}-${phonePart2}-${phonePart3}`;
    onUpdate(password, fullPhone);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>추가 정보 입력</p>
            <h2 style={{ margin: '5px 0 10px 0', color: '#0052cc', fontSize: '22px', fontWeight: '800' }}>Easy Alba</h2>
            <p style={{ fontSize: '13px', color: '#888', wordBreak: 'keep-all' }}>
              원활한 서비스 이용과<br/>이메일 로그인을 위해 추가 정보를 입력해주세요.
            </p>
        </div>

        <form onSubmit={handleSubmit} className="form-group">
          
          {/* 비밀번호 설정 */}
          <div className="input-wrapper">
            <label>비밀번호 설정 <span style={{fontWeight:'normal', fontSize:'11px', color:'#888'}}>(이메일 로그인용)</span></label>
            <input
                type="password"
                placeholder="비밀번호 (6자 이상)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                required
            />
          </div>

          <div className="input-wrapper">
            <input
                type="password"
                placeholder="비밀번호 확인"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="input-field"
                required
            />
             {password && passwordConfirm && password !== passwordConfirm && (
                <p style={{ color: 'red', fontSize: '11px', marginTop: '4px' }}>비밀번호가 일치하지 않습니다.</p>
            )}
          </div>

          {/* 휴대전화 입력 */}
          <div className="input-wrapper">
            <label>휴대전화</label>
            <div className="phone-container">
                <input type="text" value={phonePart1} onChange={(e)=>handleNumberInput(e, setPhonePart1, 3)} className="phone-input" placeholder="010" />
                <span className="dash">-</span>
                <input type="text" value={phonePart2} onChange={(e)=>handleNumberInput(e, setPhonePart2, 4)} className="phone-input" placeholder="1234" />
                <span className="dash">-</span>
                <input type="text" value={phonePart3} onChange={(e)=>handleNumberInput(e, setPhonePart3, 4)} className="phone-input" placeholder="5678" />
            </div>
          </div>

          <button type="submit" className="signup-btn" disabled={loading}>
            {loading ? '저장 중...' : '입력 완료'}
          </button>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: rgba(0, 0, 0, 0.7); /* 배경을 좀 더 진하게 */
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }
        .modal-content {
          background: #fff;
          width: 100%;
          max-width: 400px;
          border-radius: 16px;
          padding: 40px 30px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.3);
          animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .form-group { display: flex; flex-direction: column; gap: 14px; }
        .input-wrapper { display: flex; flex-direction: column; gap: 6px; text-align: left; }
        .input-wrapper label { font-size: 13px; font-weight: bold; color: #444; margin-left: 2px; }
        .input-field {
          width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; background-color: #f9f9f9; box-sizing: border-box;
        }
        .input-field:focus { border-color: #0052cc; background-color: #fff; }
        .phone-container { display: flex; align-items: center; gap: 4px; width: 100%; }
        .phone-input {
            flex: 1; min-width: 0; padding: 12px 4px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; text-align: center; outline: none; background-color: #f9f9f9; box-sizing: border-box;
        }
        .phone-input:focus { border-color: #0052cc; background-color: #fff; }
        .dash { color: #888; font-weight: bold; flex-shrink: 0; }
        .signup-btn {
          margin-top: 10px; width: 100%; padding: 14px; background-color: #0052cc; color: #fff; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer;
        }
        .signup-btn:disabled { background-color: #ccc; }
      `}</style>
    </div>
  );
}