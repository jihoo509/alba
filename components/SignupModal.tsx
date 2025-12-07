'use client';

import React, { useState } from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSignup: (email: string, password: string, phone: string) => void;
  loading: boolean;
};

export default function SignupModal({ isOpen, onClose, onSignup, loading }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSignup(email, password, phone);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>직원 관리가 쉬워진다</p>
            <h2 style={{ margin: '5px 0 0 0', color: '#0052cc', fontSize: '24px', fontWeight: '800' }}>Easy Alba</h2>
        </div>

        <form onSubmit={handleSubmit} className="form-group">
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input-field"
          />
          <input
            type="password"
            placeholder="비밀번호 (6자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="input-field"
          />
          {/* ✅ 전화번호 입력 추가 */}
          <input
            type="tel"
            placeholder="전화번호 (010-0000-0000)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="input-field"
          />
          
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '5px' }}>
             <input type="checkbox" id="terms" required style={{ cursor:'pointer' }}/>
             <label htmlFor="terms" style={{ fontSize:'13px', color:'#666', cursor:'pointer' }}>
                아이디 기억하기 (선택)
             </label>
          </div>

          <button type="submit" className="signup-btn" disabled={loading}>
            {loading ? '처리 중...' : '회원가입 완료'}
          </button>
        </form>
        
        <div style={{ marginTop: '20px', fontSize: '13px', color: '#666' }}>
            이미 계정이 있으신가요? 
            <span onClick={onClose} style={{ color: '#0052cc', fontWeight: 'bold', cursor: 'pointer', marginLeft: '5px', textDecoration: 'underline' }}>
                로그인하기
            </span>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .modal-content {
          background: #fff;
          width: 100%;
          max-width: 380px;
          border-radius: 16px;
          padding: 40px 30px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          text-align: center;
          animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .input-field {
          width: 100%;
          padding: 14px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 15px;
          outline: none;
          background-color: #f9f9f9;
        }
        .input-field:focus {
          border-color: #0052cc;
          background-color: #fff;
        }
        .signup-btn {
          margin-top: 10px;
          width: 100%;
          padding: 14px;
          background-color: #28a745; /* 가입 버튼은 초록색 계열 추천 (캡처 참고) */
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
        }
        .signup-btn:hover {
          background-color: #218838;
        }
      `}</style>
    </div>
  );
}