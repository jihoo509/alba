'use client';

import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx'; // 엑셀 라이브러리 (이미 설치되어 있음)
import { format } from 'date-fns';

export default function AdminMembersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 관리자 비밀번호 같은 걸 걸어두면 좋습니다 (간단하게 prompt로 처리 예시)
  useEffect(() => {
    // const pw = prompt('관리자 비밀번호를 입력하세요');
    // if (pw !== '1234') { history.back(); } 
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch (e) {
      alert('데이터 로딩 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = () => {
    // 엑셀용 데이터 변환
    const excelData = users.map((u) => ({
      '이메일': u.email,
      '전화번호': u.phone,
      '가입일': format(new Date(u.created_at), 'yyyy-MM-dd HH:mm:ss'),
      '최근접속': u.last_sign_in ? format(new Date(u.last_sign_in), 'yyyy-MM-dd HH:mm:ss') : '-',
      '가입경로': u.provider
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "회원목록");
    XLSX.writeFile(wb, `회원리스트_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>관리자 - 회원 목록 ({users.length}명)</h1>
        <button 
          onClick={handleDownloadExcel}
          style={{ 
            backgroundColor: '#27ae60', color: 'white', padding: '10px 20px', 
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' 
          }}
        >
          엑셀 다운로드 📥
        </button>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead style={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
            <tr>
              <th style={thStyle}>이메일</th>
              <th style={thStyle}>전화번호</th>
              <th style={thStyle}>가입일</th>
              <th style={thStyle}>최근 접속</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center' }}>로딩 중...</td></tr>
            ) : users.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={tdStyle}>{user.email}</td>
                <td style={tdStyle}>{user.phone}</td>
                <td style={tdStyle}>{format(new Date(user.created_at), 'yyyy-MM-dd')}</td>
                <td style={tdStyle}>{user.last_sign_in ? format(new Date(user.last_sign_in), 'MM-dd HH:mm') : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thStyle = { padding: '12px 16px', textAlign: 'left' as const, color: '#555', fontWeight: 'bold' };
const tdStyle = { padding: '12px 16px', color: '#333' };