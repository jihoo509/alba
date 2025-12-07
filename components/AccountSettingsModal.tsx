'use client';

import React, { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import { useRouter } from 'next/navigation'; // ✅ 라우터 추가

type Props = {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  userPhone?: string;
};

export default function AccountSettingsModal({ isOpen, onClose, userEmail, userPhone }: Props) {
  const router = useRouter(); // ✅ 라우터 초기화
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

  // ✅ [수정됨] 실제 서버 API를 호출하여 안전하게 탈퇴 처리
  const handleDeleteAccount = async () => {
    if (!confirm('정말 탈퇴하시겠습니까?\n모든 데이터가 삭제되며 복구할 수 없습니다.')) return;
    
    try {
      setLoading(true); // 로딩 시작 (버튼 비활성화)

      // 1. Next.js 서버 API에 삭제 요청 (관리자 권한으로 삭제 수행)
      const res = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '탈퇴 처리에 실패했습니다.');
      }

      // 2. 성공 시 처리
      alert('탈퇴가 완료되었습니다. 이용해 주셔서 감사합니다.');
      router.replace('/'); // 로그인 페이지로 이동
      router.refresh();    // 데이터 갱신 (캐시 삭제)
      
    } catch (error: any) {
      alert(error.message);
      setLoading(false); // 실패 시에만 로딩 해제 (성공 시엔 페이지 이동하므로 유지)
    }
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
          <div className="phone-container">
            <input type="text" value={phone1} onChange={e => setPhone1(e.target.value)} className="phone-input" />
            <span className="dash">-</span>
            <input type="text" value={phone2} onChange={e => setPhone2(e.target.value)} className="phone-input" />
            <span className="dash">-</span>
            <input type="text" value={phone3} onChange={e => setPhone3(e.target.value)} className="phone-input" />
          </div>
        </div>

        <div className="btn-group">
          <button onClick={handleUpdate} disabled={loading} className="action-btn save">
            {loading ? '저장 중...' : '변경사항 저장'}
          </button>
          <button onClick={onClose} className="action-btn cancel">닫기</button>
        </div>

        <div className="divider"></div>

        <div style={{ textAlign: 'center' }}>
            {/* ✅ 로딩 중일 때 탈퇴 버튼도 못 누르게 disabled 처리 */}
            <button 
                onClick={handleDeleteAccount} 
                disabled={loading}
                className="delete-account-btn"
                style={{ opacity: loading ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
                {loading ? '처리 중...' : '회원 탈퇴'}
            </button>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.6); z-index: 9999;
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
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

        .phone-container { display: flex; align-items: center; gap: 4px; width: 100%; }
        .phone-input {
            flex: 1;
            min-width: 0;
            padding: 14px 4px; 
            border: 1px solid #ddd; border-radius: 8px; text-align: center;
            font-size: 14px; outline: none;
        }
        .phone-input:focus { border-color: #0052cc; }
        .dash { color: #888; font-weight: bold; flex-shrink: 0; }

        .btn-group { display: flex; gap: 10px; margin-top: 24px; }
        .action-btn {
            flex: 1;
            padding: 14px; border-radius: 8px; font-weight: bold; cursor: pointer; border: none; font-size: 15px;
        }
        .save { background: #0052cc; color: #fff; }
        .cancel { background: #eee; color: #333; }

        .divider { height: 1px; background: #eee; margin: 24px 0; }

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