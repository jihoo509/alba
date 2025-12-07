'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  userPhone: string;
}

export default function AccountSettingsModal({ isOpen, onClose, userEmail, userPhone }: Props) {
  const supabase = createSupabaseBrowserClient();
  const [loading, setLoading] = useState(false);
  
  // 비밀번호 변경 상태
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // 전화번호 변경 상태
  const [phone, setPhone] = useState(userPhone);

  if (!isOpen) return null;

  // 정보 수정 (비번, 전화번호)
  const handleUpdate = async () => {
    try {
      setLoading(true);
      const updates: any = { data: { phone } };
      
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          alert('비밀번호가 일치하지 않습니다.');
          setLoading(false);
          return;
        }
        if (newPassword.length < 6) {
          alert('비밀번호는 6자 이상이어야 합니다.');
          setLoading(false);
          return;
        }
        updates.password = newPassword;
      }

      const { error } = await supabase.auth.updateUser(updates);
      if (error) throw error;

      alert('계정 정보가 수정되었습니다.');
      onClose();
    } catch (e: any) {
      alert('수정 실패: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // 🚨 [핵심] 회원 탈퇴 함수
  const handleDeleteAccount = async () => {
    if (!confirm('정말 탈퇴하시겠습니까?\n모든 데이터(매장, 직원, 급여 등)가 영구 삭제됩니다.')) return;
    
    // 한 번 더 확인 (안전장치)
    const check = prompt(`탈퇴하려면 아래 문구를 똑같이 입력해주세요.\n"탈퇴합니다"`);
    if (check !== '탈퇴합니다') return;

    try {
      setLoading(true);

      // 1. API 호출해서 서버 데이터 삭제
      const res = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || '탈퇴 처리 실패');
      }

      // 2. 클라이언트 로그아웃 처리
      await supabase.auth.signOut();

      alert('탈퇴가 완료되었습니다.\n그동안 이용해주셔서 감사합니다.');

      // 3. [핵심] 로그인 페이지로 강제 이동 (새로고침)
      window.location.href = '/';

    } catch (e: any) {
      alert('오류 발생: ' + e.message);
      setLoading(false); // 실패 시에만 로딩 끔 (성공하면 페이지 이동하니까)
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2 style={{ textAlign: 'center', margin: '0 0 24px 0', color: '#333' }}>계정 설정</h2>

        <div style={formGroupStyle}>
          <label style={labelStyle}>내 아이디</label>
          <input type="text" value={userEmail} disabled style={{ ...inputStyle, background: '#eee', color: '#666' }} />
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>비밀번호 변경</label>
          <input 
            type="password" 
            placeholder="새 비밀번호 (변경 시에만 입력)" 
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={inputStyle} 
          />
          <input 
            type="password" 
            placeholder="새 비밀번호 확인" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{ ...inputStyle, marginTop: '8px' }} 
          />
        </div>

        <div style={formGroupStyle}>
          <label style={labelStyle}>전화번호 변경</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-0000-0000"
              style={inputStyle} 
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
          <button onClick={handleUpdate} disabled={loading} style={saveBtnStyle}>
            {loading ? '처리 중...' : '저장하기'}
          </button>
          <button onClick={onClose} style={closeBtnStyle}>닫기</button>
        </div>

        <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid #eee' }} />

        {/* 회원 탈퇴 영역 */}
        <div style={{ textAlign: 'right' }}>
           <button 
             onClick={handleDeleteAccount}
             style={{ 
               background: 'none', border: 'none', 
               color: '#999', fontSize: '12px', textDecoration: 'underline', 
               cursor: 'pointer' 
             }}
           >
             회원 탈퇴하기
           </button>
        </div>
      </div>
    </div>
  );
}

// --- 스타일 ---
const overlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
  display: 'flex', justifyContent: 'center', alignItems: 'center'
};

const modalStyle: React.CSSProperties = {
  backgroundColor: '#fff', width: '90%', maxWidth: '400px',
  borderRadius: '16px', padding: '32px',
  boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
};

const formGroupStyle = { marginBottom: '20px' };
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#555', marginBottom: '8px' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' as const };

const saveBtnStyle = { flex: 2, padding: '14px', backgroundColor: '#0052cc', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const closeBtnStyle = { flex: 1, padding: '14px', backgroundColor: '#eee', color: '#333', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };