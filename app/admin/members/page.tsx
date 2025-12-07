'use client';

import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export default function AdminMembersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [stats, setStats] = useState({ userCount: 0, storeCount: 0, visitCount: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 🔒 관리자 보안 체크
    const pw = prompt('관리자 비밀번호를 입력하세요');
    if (pw !== '996633225588') { 
       alert('관리자만 접근할 수 있습니다.');
       window.location.href = '/'; 
       return;
    } 
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. 회원 리스트 가져오기
      const resUsers = await fetch('/api/admin/users');
      const dataUsers = await resUsers.json();
      if (dataUsers.users) setUsers(dataUsers.users);

      // 2. 매장 리스트 가져오기
      const resStores = await fetch('/api/admin/stores');
      const dataStores = await resStores.json();
      if (dataStores.stores) setStores(dataStores.stores);

      // 3. 통계 가져오기
      const resStats = await fetch('/api/admin/stats');
      const dataStats = await resStats.json();
      if (dataStats.userCount !== undefined) setStats(dataStats);

    } catch (e) {
      alert('데이터 로딩 실패');
    } finally {
      setLoading(false);
    }
  };

  // ✅ [핵심 기능] 특정 유저가 가진 매장 이름들을 콤마로 연결해서 반환
  const getUserStoreNames = (userId: string) => {
    const userStores = stores.filter(store => store.owner_id === userId);
    if (userStores.length === 0) return '-';
    return userStores.map(s => s.name).join(', ');
  };

  // 엑셀 다운로드 (매장 정보 포함)
  const handleDownloadExcel = () => {
    const excelData = users.map((u) => ({
      '이메일': u.email,
      '보유 매장': getUserStoreNames(u.id), // ✅ 엑셀에도 매장 이름 추가
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
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '30px', color: '#333' }}>
        관리자 대시보드 🛠️
      </h1>

      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <StatCard title="총 방문 수" count={stats.visitCount} color="#3498db" icon="👀" />
        <StatCard title="생성된 매장 수" count={stats.storeCount} color="#e67e22" icon="🏪" />
        <StatCard title="가입 회원 수" count={stats.userCount} color="#2ecc71" icon="👥" />
      </div>

      {/* 회원 목록 테이블 (매장 정보 통합) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#555' }}>👥 회원 목록 상세</h2>
        <button 
          onClick={handleDownloadExcel}
          style={{ 
            backgroundColor: '#27ae60', color: 'white', padding: '10px 20px', 
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
          }}
        >
          엑셀 다운로드 📥
        </button>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '800px' }}>
          <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #eee' }}>
            <tr>
              <th style={thStyle}>이메일</th>
              <th style={thStyle}>운영 중인 매장</th> {/* ✅ 추가된 컬럼 */}
              <th style={thStyle}>전화번호</th>
              <th style={thStyle}>가입일</th>
              <th style={thStyle}>최근 접속</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#888' }}>데이터를 불러오는 중입니다...</td></tr>
            ) : users.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ ...tdStyle, fontWeight: 'bold', color: '#333' }}>{user.email}</td>
                
                {/* ✅ 매장 이름 표시 영역 */}
                <td style={tdStyle}>
                  {getUserStoreNames(user.id) === '-' ? (
                    <span style={{ color: '#ccc' }}>-</span>
                  ) : (
                    <span style={{ color: '#0052cc', fontWeight: 'bold' }}>{getUserStoreNames(user.id)}</span>
                  )}
                </td>

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

// 스타일 정의
function StatCard({ title, count, color, icon }: any) {
  return (
    <div style={{ 
      backgroundColor: 'white', padding: '24px', borderRadius: '16px', 
      boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '20px',
      borderLeft: `5px solid ${color}`
    }}>
      <div style={{ fontSize: '40px' }}>{icon}</div>
      <div>
        <div style={{ fontSize: '14px', color: '#888', marginBottom: '4px' }}>{title}</div>
        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333' }}>
          {count ? count.toLocaleString() : 0}
        </div>
      </div>
    </div>
  );
}

const thStyle = { padding: '16px', textAlign: 'left' as const, color: '#555', fontWeight: 'bold', whiteSpace: 'nowrap' as const };
const tdStyle = { padding: '16px', color: '#555', whiteSpace: 'nowrap' as const };