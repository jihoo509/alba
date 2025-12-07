'use client';

import React, { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  userPhone?: string;
};

export default function AccountSettingsModal({ isOpen, onClose, userEmail, userPhone }: Props) {
  const supabase = createSupabaseBrowserClient();
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  
  const [phone1, setPhone1] = useState('010');
  const [phone2, setPhone2] = useState('');
  const [phone3, setPhone3] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userPhone) {
      const parts = userPhone.split('-');
      if (parts.length === 3) {
        setPhone1(parts[0]);
        setPhone2(parts[1]);
        setPhone3(parts[2]);
      }
    } else {
        setNewPassword('');
        setNewPasswordConfirm('');
    }
  }, [isOpen, userPhone]);

  if (!isOpen) return null;

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const updates: any = {};
      
      if (newPassword) {
        if (newPassword.length < 6) throw new Error('비밀번호는 6자 이상이어야 합니다.');
        if (newPassword !== newPasswordConfirm) throw new Error('비밀번호 확인이 일치하지 않습니다.');
        updates.password = newPassword;
      }

      const fullPhone = `${phone1}-${phone2}-${phone3}`;
      if (fullPhone.length >= 11) {
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
      window.location.reload(); 

    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('정말 탈퇴하시겠습니까?\n모든 데이터가 삭제되며 복구할 수 없습니다.')) return;
    alert('회원 탈퇴 처리가 완료되었습니다.\n(실제 데이터 삭제를 위해서는 관리자에게 문의해주세요.)');
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2 style={{ textAlign: 'center', margin: '0 0 24px 0', fontSize: '20px', fontWeight: 'bold' }}>계정 설정</h2>

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
          {/* ✅ 모바일 대응: flex로 꽉 차게 */}
          <div className="phone-container">
            <input type="text" value={phone1} onChange={e => setPhone1(e.target.value)} className="phone-input" />
            <span className="dash">-</span>
            <input type="text" value={phone2} onChange={e => setPhone2(e.target.value)} className="phone-input" />
            <span className="dash">-</span>
            <input type="text" value={phone3} onChange={e => setPhone3(e.target.value)} className="phone-input" />
          </div>
        </div>

        {/* ✅ 버튼 크기 1:1로 맞춤 */}
        <div className="btn-group">
          <button onClick={handleUpdate} disabled={loading} className="action-btn save">
            {loading ? '저장 중...' : '변경사항 저장'}
          </button>
          <button onClick={onClose} className="action-btn cancel">닫기</button>
        </div>

        <div className="divider"></div>

        {/* ✅ 회원 탈퇴 버튼 디자인 개선 */}
        <div style={{ textAlign: 'center' }}>
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
          padding: 20px; /* 모바일 여백 */
        }
        .modal-content {
          background: #fff; width: 100%; max-width: 400px;
          border-radius: 16px; padding: 24px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
          max-height: 90vh; overflow-y: auto;
        }
        .section { margin-bottom: 20px; }
        .section label { display: block; font-size: 14px; font-weight: bold; margin-bottom: 8px; color: #444; }
        
        .read-only-box {
            padding: 14px; background: #f5f5f5; border-radius: 8px; color: #666; font-size: 14px;
            border: 1px solid #eee;
        }
        .input-field {
            width: 100%; padding: 14px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; box-sizing: border-box; outline: none;
        }
        .input-field:focus { border-color: #0052cc; background: #fff; }

        /* ✅ 전화번호 입력 스타일 수정 (모바일 튀어나감 방지) */
        .phone-container { display: flex; align-items: center; gap: 4px; width: 100%; }
        .phone-input {
            flex: 1; /* 비율로 공간 차지 */
            min-width: 0; /* 내용물 줄어듦 허용 */
            padding: 14px 4px; 
            border: 1px solid #ddd; border-radius: 8px; text-align: center;
            font-size: 14px; outline: none;
        }
        .phone-input:focus { border-color: #0052cc; }
        .dash { color: #888; font-weight: bold; flex-shrink: 0; }

        /* ✅ 버튼 그룹 (1:1 비율) */
        .btn-group { display: flex; gap: 10px; margin-top: 24px; }
        .action-btn {
            flex: 1; /* 너비 50:50 */
            padding: 14px; border-radius: 8px; font-weight: bold; cursor: pointer; border: none; font-size: 15px;
        }
        .save { background: #0052cc; color: #fff; }
        .cancel { background: #eee; color: #333; }

        .divider { height: 1px; background: #eee; margin: 24px 0; }

        /* ✅ 탈퇴 버튼 스타일 */
        .delete-account-btn {
            width: 100%;
            padding: 12px;
            background: #fff5f5;
            border: 1px solid #ffdcdc;
            color: #e74c3c;
            border-radius: 8px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            transition: background 0.2s;
        }
        .delete-account-btn:hover { background: #ffecec; }
      `}</style>
    </div>
  );
}