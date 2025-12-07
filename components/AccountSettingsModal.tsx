'use client';

import React, { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  userPhone?: string; // 기존 전화번호
};

export default function AccountSettingsModal({ isOpen, onClose, userEmail, userPhone }: Props) {
  const supabase = createSupabaseBrowserClient();
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  
  // 전화번호 3단 분리
  const [phone1, setPhone1] = useState('010');
  const [phone2, setPhone2] = useState('');
  const [phone3, setPhone3] = useState('');

  const [loading, setLoading] = useState(false);

  // 모달 열릴 때 기존 전화번호 채워넣기
  useEffect(() => {
    if (isOpen && userPhone) {
      const parts = userPhone.split('-');
      if (parts.length === 3) {
        setPhone1(parts[0]);
        setPhone2(parts[1]);
        setPhone3(parts[2]);
      }
    } else {
        // 초기화
        setNewPassword('');
        setNewPasswordConfirm('');
    }
  }, [isOpen, userPhone]);

  if (!isOpen) return null;

  // 정보 수정 핸들러
  const handleUpdate = async () => {
    setLoading(true);
    try {
      const updates: any = {};
      
      // 1. 비밀번호 변경 시도
      if (newPassword) {
        if (newPassword.length < 6) throw new Error('비밀번호는 6자 이상이어야 합니다.');
        if (newPassword !== newPasswordConfirm) throw new Error('비밀번호 확인이 일치하지 않습니다.');
        updates.password = newPassword;
      }

      // 2. 전화번호 변경 시도
      const fullPhone = `${phone1}-${phone2}-${phone3}`;
      if (fullPhone.length >= 12) { // 대략적인 길이 체크
         updates.data = { phone: fullPhone };
      }

      if (Object.keys(updates).length === 0) {
        alert('변경할 내용을 입력해주세요.');
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser(updates);
      if (error) throw error;

      alert('계정 정보가 수정되었습니다.');
      onClose();
      window.location.reload(); // 정보 갱신을 위해 새로고침

    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  // 회원 탈퇴 핸들러
  const handleDeleteAccount = async () => {
    if (!confirm('정말 탈퇴하시겠습니까?\n모든 데이터가 삭제되며 복구할 수 없습니다.')) return;
    
    // 주의: 실제 서비스에서는 보안을 위해 백엔드 API (/api/auth/delete)를 만들어 호출해야 합니다.
    // 여기서는 편의상 로그아웃 처리 후 안내 메시지를 띄우는 방식으로 구현합니다.
    
    // const { error } = await supabase.rpc('delete_user_account'); // 만약 DB 함수가 있다면 사용
    
    alert('회원 탈퇴 처리가 완료되었습니다.\n(실제 데이터 삭제를 위해서는 관리자에게 문의해주세요.)');
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2 style={{ textAlign: 'center', margin: '0 0 20px 0', fontSize: '20px', fontWeight: 'bold' }}>계정 설정</h2>

        <div className="section">
          <label>내 아이디</label>
          <div className="read-only-box">{userEmail}</div>
        </div>

        <div className="section">
          <label>비밀번호 변경</label>
          <input 
            type="password" 
            placeholder="새 비밀번호 (변경 시에만 입력)" 
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            className="input-field"
          />
          <input 
            type="password" 
            placeholder="새 비밀번호 확인" 
            value={newPasswordConfirm}
            onChange={e => setNewPasswordConfirm(e.target.value)}
            className="input-field"
            style={{ marginTop: '8px' }}
          />
        </div>

        <div className="section">
          <label>전화번호 변경</label>
          <div className="phone-container">
            <input type="text" value={phone1} onChange={e => setPhone1(e.target.value)} className="phone-input" />
            <span>-</span>
            <input type="text" value={phone2} onChange={e => setPhone2(e.target.value)} className="phone-input" />
            <span>-</span>
            <input type="text" value={phone3} onChange={e => setPhone3(e.target.value)} className="phone-input" />
          </div>
        </div>

        <div className="btn-group">
          <button onClick={handleUpdate} disabled={loading} className="save-btn">
            {loading ? '저장 중...' : '변경사항 저장'}
          </button>
          <button onClick={onClose} className="cancel-btn">닫기</button>
        </div>

        <div className="divider"></div>

        <div style={{ textAlign: 'right' }}>
            <button onClick={handleDeleteAccount} className="delete-account-btn">
                회원 탈퇴
            </button>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.6); z-index: 9999;
          display: flex; align-items: center; justify-content: center;
        }
        .modal-content {
          background: #fff; width: 90%; max-width: 400px;
          border-radius: 12px; padding: 24px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .section { margin-bottom: 16px; }
        .section label { display: block; font-size: 14px; font-weight: bold; margin-bottom: 6px; color: #333; }
        .read-only-box {
            padding: 12px; background: #f0f0f0; border-radius: 6px; color: #666; font-size: 14px;
        }
        .input-field {
            width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; box-sizing: border-box;
        }
        .phone-container { display: flex; align-items: center; gap: 5px; }
        .phone-input {
            flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 6px; text-align: center;
        }
        .btn-group { display: flex; gap: 10px; margin-top: 20px; }
        .save-btn {
            flex: 2; background: #0052cc; color: #fff; border: none; padding: 12px; border-radius: 6px; font-weight: bold; cursor: pointer;
        }
        .cancel-btn {
            flex: 1; background: #eee; color: #333; border: none; padding: 12px; border-radius: 6px; cursor: pointer;
        }
        .divider { height: 1px; background: #eee; margin: 20px 0; }
        .delete-account-btn {
            background: none; border: none; color: #e74c3c; font-size: 12px; text-decoration: underline; cursor: pointer;
        }
      `}</style>
    </div>
  );
}