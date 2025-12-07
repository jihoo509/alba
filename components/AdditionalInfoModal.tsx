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

  // ✅ 개인정보 동의 관련 상태 추가
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [showPrivacyDetail, setShowPrivacyDetail] = useState(false);

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

    // ✅ 동의 체크 확인
    if (!agreePrivacy) {
      alert('개인정보 수집 및 이용에 동의해주세요.');
      return;
    }

    const fullPhone = `${phonePart1}-${phonePart2}-${phonePart3}`;
    onUpdate(password, fullPhone);
  };

  return (
    <>
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

            {/* ✅ 개인정보 동의 (회원가입과 동일한 디자인 적용) */}
            <div className="privacy-area">
                <div className="privacy-row">
                  <input 
                      type="checkbox" 
                      id="privacy" 
                      checked={agreePrivacy}
                      onChange={(e) => setAgreePrivacy(e.target.checked)}
                      style={{ cursor:'pointer', width: '18px', height: '18px', marginTop: '3px', flexShrink: 0 }}
                  />
                  <label htmlFor="privacy" className="privacy-label">
                    <div>
                      <span className="required-tag">(필수)</span> 개인정보 수집 및 이용 동의
                    </div>
                    <div className="sub-text">
                        서비스 이용 및 마케팅 정보 수신 동의 포함
                        <button 
                          type="button" 
                          className="detail-btn"
                          onClick={(e) => {
                            e.preventDefault();
                            setShowPrivacyDetail(true);
                          }}
                        >
                          [약관 상세 보기]
                        </button>
                    </div>
                  </label>
                </div>
            </div>

            <button type="submit" className="signup-btn" disabled={loading}>
              {loading ? '저장 중...' : '입력 완료'}
            </button>
          </form>
        </div>
      </div>

      {/* ✅ 약관 상세 내용 팝업 (회원가입과 동일) */}
      {showPrivacyDetail && (
        <div className="detail-overlay" onClick={() => setShowPrivacyDetail(false)}>
          <div className="detail-content" onClick={(e) => e.stopPropagation()}>
            <h3>개인정보 수집 및 이용 동의</h3>
            <div className="scroll-box">
              <p><strong>1. 수집하는 개인정보 항목</strong></p>
              <p>이메일, 비밀번호, 휴대전화번호</p>
              <br/>
              <p><strong>2. 개인정보의 수집 및 이용 목적</strong></p>
              <p>- 회원 가입 및 관리 (본인 확인, 가입 의사 확인)</p>
              <p>- 서비스 제공 (직원 관리, 급여 계산 등)</p>
              <p>- 마케팅 및 프로모션 활용 (신규 서비스 안내, 이벤트 정보 전달)</p>
              <br/>
              <p><strong>3. 개인정보의 보유 및 이용 기간</strong></p>
              <p>회원 탈퇴 시까지 보유하며, 탈퇴 시 지체 없이 파기합니다.</p>
              <br/>
              <p>※ 귀하는 개인정보 수집 및 이용에 대한 동의를 거부할 권리가 있습니다. 다만, 동의를 거부할 경우 회원가입이 불가능합니다.</p>
            </div>
            <button className="confirm-btn" onClick={() => {
                setAgreePrivacy(true);
                setShowPrivacyDetail(false);
            }}>
              동의하고 닫기
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
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
          max-height: 90vh; /* 화면 작을 때 대응 */
          overflow-y: auto;
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

        /* ✅ 개인정보 동의 스타일 (SignupModal과 동일) */
        .privacy-area {
            display: flex;
            flex-direction: column; 
            align-items: flex-start;
            background-color: #f5f7fa;
            padding: 12px;
            border-radius: 8px;
            margin-top: 5px;
            gap: 0px; 
        }
        .privacy-row {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            width: 100%;
            text-align: left;
        }
        .privacy-label {
            font-size: 13px;
            color: #333;
            cursor: pointer;
            line-height: 1.4;
            word-break: keep-all; 
        }
        .required-tag {
            color: #0052cc;
            font-weight: bold;
            margin-right: 4px;
            white-space: nowrap; 
        }
        .sub-text {
            font-size: 11px;
            color: #888;
            margin-top: 2px;
            display: block;
            word-break: keep-all;
        }
        .detail-btn {
            background: none;
            border: none;
            padding: 0;
            font-size: 11px;
            color: #666;
            cursor: pointer;
            text-decoration: underline;
            margin-left: 6px; 
            display: inline-block;
            vertical-align: baseline;
        }
        .detail-btn:hover { color: #0052cc; font-weight: bold; }

        /* 약관 상세 팝업 */
        .detail-overlay {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background-color: rgba(0,0,0,0.7); z-index: 10000;
            display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .detail-content {
            background: #fff; width: 100%; max-width: 350px; border-radius: 12px; padding: 20px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3); text-align: left;
        }
        .detail-content h3 { margin: 0 0 15px 0; font-size: 16px; text-align: center; color: #333; }
        .scroll-box {
            height: 200px; overflow-y: auto; background: #f9f9f9; border: 1px solid #eee;
            padding: 10px; font-size: 12px; color: #555; border-radius: 6px; line-height: 1.5;
        }
        .confirm-btn {
            margin-top: 15px; width: 100%; padding: 10px; background-color: #0052cc; color: #fff;
            border: none; border-radius: 8px; font-weight: bold; cursor: pointer;
        }
      `}</style>
    </>
  );
}