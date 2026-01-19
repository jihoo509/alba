'use client';

import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export default function AdminMembersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  // ✅ [수정] 계산기별 방문자 수 상태 추가
  const [stats, setStats] = useState({ 
    userCount: 0, 
    storeCount: 0, 
    visitCount: 0, 
    salaryVisitCount: 0, 
    holidayVisitCount: 0 
  });
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
      // ✅ [수정] 가져온 통계 데이터 적용 (없으면 0 처리)
      setStats({
        userCount: dataStats.userCount || 0,
        storeCount: dataStats.storeCount || 0,
        visitCount: dataStats.visitCount || 0,
        salaryVisitCount: dataStats.salaryVisitCount || 0,
        holidayVisitCount: dataStats.holidayVisitCount || 0
      });

    } catch (e) {
      alert('데이터 로딩 실패');
    } finally {
      setLoading(false);
    }
  };

  const getUserStoreNames = (userId: string) => {
    const userStores = stores.filter(store => store.owner_id === userId);
    if (userStores.length === 0) return '-';
    return userStores.map(s => s.name).join(', ');
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    const confirmed = window.confirm(
      `정말 [${userEmail}] 회원을 탈퇴시키겠습니까?\n\n⚠️ 주의: 해당 회원의 매장 및 데이터가 모두 삭제될 수 있습니다.`
    );

    if (!confirmed) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }), 
      });

      const result = await res.json();

      if (res.ok) {
        alert('회원이 성공적으로 탈퇴 처리되었습니다.');
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setStats((prev) => ({ ...prev, userCount: prev.userCount - 1 }));
      } else {
        alert(`탈퇴 처리 실패: ${result.error || '알 수 없는 오류'}`);
      }
    } catch (e) {
      console.error(e);
      alert('오류가 발생했습니다.');
    }
  };

  const handleDownloadExcel = () => {
    const excelData = users.map((u) => ({
      '이메일': u.email,
      '보유 매장': getUserStoreNames(u.id), 
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
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif', paddingBottom: '100px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '30px', color: '#333' }}>
        관리자 대시보드 🛠️
      </h1>

      {/* 1. 전체 현황 카드 */}
      <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#666', marginBottom: '15px' }}>📌 전체 현황</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <StatCard title="총 누적 방문" count={stats.visitCount} color="#3498db" icon="👀" />
        <StatCard title="생성된 매장" count={stats.storeCount} color="#e67e22" icon="🏪" />
        <StatCard title="가입 회원" count={stats.userCount} color="#2ecc71" icon="👥" />
      </div>

      {/* ✅ [추가] 2. 계산기 트래픽 상세 카드 */}
      <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#666', marginBottom: '15px' }}>📊 계산기별 트래픽 상세</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '50px' }}>
        <StatCard title="💰 급여 계산기 방문" count={stats.salaryVisitCount} color="#9b59b6" icon="💵" />
        <StatCard title="🏖️ 주휴수당 계산기 방문" count={stats.holidayVisitCount} color="#f1c40f" icon="🎁" />
      </div>

      <div style={{ borderTop: '1px dashed #ddd', margin: '20px 0' }}></div>

      {/* 3. 회원 목록 테이블 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', marginTop: '40px' }}>
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
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '900px' }}>
          <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #eee' }}>
            <tr>
              <th style={thStyle}>이메일</th>
              <th style={thStyle}>운영 중인 매장</th> 
              <th style={thStyle}>전화번호</th>
              <th style={thStyle}>가입일</th>
              <th style={thStyle}>최근 접속</th>
              <th style={{...thStyle, textAlign: 'center'}}>관리</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#888' }}>데이터를 불러오는 중입니다...</td></tr>
            ) : users.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ ...tdStyle, fontWeight: 'bold', color: '#333' }}>{user.email}</td>
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
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <button
                        onClick={() => handleDeleteUser(user.id, user.email)}
                        style={{
                            padding: '6px 12px', backgroundColor: '#ff4d4d', color: 'white',
                            border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold'
                        }}
                    >
                        강제 탈퇴
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

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