'use client';

import React, { useState, useEffect } from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSignup: (email: string, password: string, phone: string) => void;
  loading: boolean;
};

export default function SignupModal({ isOpen, onClose, onSignup, loading }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const [phonePart1, setPhonePart1] = useState('010');
  const [phonePart2, setPhonePart2] = useState('');
  const [phonePart3, setPhonePart3] = useState('');

  const [agreePrivacy, setAgreePrivacy] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setPassword('');
      setPasswordConfirm('');
      setPhonePart1('010');
      setPhonePart2('');
      setPhonePart3('');
      setAgreePrivacy(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>, maxLength: number) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= maxLength) {
      setter(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('올바른 이메일 형식을 입력해주세요.');
      return;
    }

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

    if (!agreePrivacy) {
      alert('개인정보 수집 및 이용에 동의해주세요.');
      return;
    }

    const fullPhone = `${phonePart1}-${phonePart2}-${phonePart3}`;
    onSignup(email, password, fullPhone);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>직원 관리가 쉬워진다</p>
            <h2 style={{ margin: '5px 0 0 0', color: '#0052cc', fontSize: '24px', fontWeight: '800' }}>Easy Alba</h2>
        </div>

        <form onSubmit={handleSubmit} className="form-group">
          {/* 이메일 */}
          <div className="input-wrapper">
            <label>이메일</label>
            <input
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
            />
          </div>

          {/* 비밀번호 */}
          <div className="input-wrapper">
            <label>비밀번호</label>
            <input
                type="password"
                placeholder="비밀번호 (6자 이상)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
            />
          </div>

          {/* 비밀번호 확인 */}
          <div className="input-wrapper">
            <input
                type="password"
                placeholder="비밀번호 확인"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className={`input-field ${password && passwordConfirm && password !== passwordConfirm ? 'error' : ''}`}
            />
            {password && passwordConfirm && password !== passwordConfirm && (
                <p style={{ color: 'red', fontSize: '11px', marginTop: '4px', textAlign: 'left' }}>비밀번호가 일치하지 않습니다.</p>
            )}
          </div>

          {/* 전화번호 (3단 분리 - 모바일 튀어나옴 방지 적용) */}
          <div className="input-wrapper">
            <label>휴대전화</label>
            <div className="phone-container">
                <input
                    type="text"
                    value={phonePart1}
                    onChange={(e) => handleNumberInput(e, setPhonePart1, 3)}
                    className="phone-input"
                    placeholder="010"
                />
                <span className="dash">-</span>
                <input
                    type="text"
                    value={phonePart2}
                    onChange={(e) => handleNumberInput(e, setPhonePart2, 4)}
                    className="phone-input"
                    placeholder="1234"
                />
                <span className="dash">-</span>
                <input
                    type="text"
                    value={phonePart3}
                    onChange={(e) => handleNumberInput(e, setPhonePart3, 4)}
                    className="phone-input"
                    placeholder="5678"
                />
            </div>
          </div>
          
          {/* 개인정보 동의 (레이아웃 개선) */}
          <div className="privacy-area">
             <input 
                type="checkbox" 
                id="privacy" 
                checked={agreePrivacy}
                onChange={(e) => setAgreePrivacy(e.target.checked)}
                style={{ cursor:'pointer', width: '18px', height: '18px', marginTop: '2px' }}
             />
             <label htmlFor="privacy" className="privacy-label">
                <span className="required-tag">(필수)</span> 개인정보 수집 및 이용에 동의합니다.
                <div className="sub-text">
                    서비스 이용 및 마케팅 정보 수신 동의 포함
                </div>
             </label>
          </div>

          <button type="submit" className="signup-btn" disabled={loading}>
            {loading ? '가입 처리 중...' : '회원가입 완료'}
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
          width: 100vw;
          height: 100vh;
          background-color: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
          box-sizing: border-box;
        }

        .modal-content {
          background: #fff;
          width: 100%;
          max-width: 400px;
          border-radius: 16px;
          padding: 30px 24px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          text-align: center;
          position: relative;
          box-sizing: border-box;
          max-height: 90vh;
          overflow-y: auto; /* 화면 작을 때 스크롤 */
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .input-wrapper {
          display: flex;
          flex-direction: column;
          gap: 6px;
          text-align: left;
        }
        
        .input-wrapper label {
            font-size: 13px;
            font-weight: bold;
            color: #444;
            margin-left: 2px;
        }

        .input-field {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          background-color: #f9f9f9;
          box-sizing: border-box;
        }
        .input-field:focus {
          border-color: #0052cc;
          background-color: #fff;
        }

        /* ✅ 전화번호 스타일 (모바일 대응 강화) */
        .phone-container {
            display: flex;
            align-items: center;
            gap: 4px; /* 간격 축소 */
            width: 100%;
        }
        .phone-input {
            flex: 1; /* 비율로 공간 차지 (화면 뚫고 나감 방지) */
            min-width: 0; /* Flexbox 축소 허용 */
            padding: 12px 4px; /* 내부 패딩 축소 */
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 14px;
            text-align: center;
            outline: none;
            background-color: #f9f9f9;
            box-sizing: border-box;
        }
        .phone-input:focus {
            border-color: #0052cc;
            background-color: #fff;
        }
        .dash {
            color: #888;
            font-weight: bold;
            flex-shrink: 0; /* 줄어들지 않음 */
        }

        /* ✅ 개인정보 동의 스타일 개선 */
        .privacy-area {
            display: flex;
            align-items: flex-start; /* 상단 정렬 */
            gap: 10px;
            background-color: #f5f7fa;
            padding: 12px;
            border-radius: 8px;
            margin-top: 5px;
            text-align: left;
        }
        .privacy-label {
            font-size: 13px;
            color: #333;
            cursor: pointer;
            flex: 1;
            line-height: 1.4;
        }
        .required-tag {
            color: #0052cc;
            font-weight: bold;
            margin-right: 4px;
        }
        .sub-text {
            font-size: 11px;
            color: #888;
            margin-top: 2px;
            display: block; /* 줄바꿈 확실하게 */
        }

        .signup-btn {
          margin-top: 10px;
          width: 100%;
          padding: 14px;
          background-color: #28a745; 
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
        }

        /* 📱 모바일 전용 스타일 (더 작은 화면 대응) */
        @media (max-width: 480px) {
            .modal-content {
                padding: 24px 20px; /* 패딩 축소 */
                width: 90%;
            }
            .phone-input {
                font-size: 13px; /* 폰트 살짝 축소 */
                padding: 10px 2px;
            }
            .privacy-label {
                font-size: 12px;
            }
        }
      `}</style>
    </div>
  );
}