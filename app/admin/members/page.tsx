'use client';

import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export default function AdminMembersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]); // ✅ 매장 목록 상태 추가
  const [stats, setStats] = useState({ userCount: 0, storeCount: 0, visitCount: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 🔒 보안 체크
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
      // 1. 회원 리스트
      const resUsers = await fetch('/api/admin/users');
      const dataUsers = await resUsers.json();
      if (dataUsers.users) setUsers(dataUsers.users);

      // 2. 통계
      const resStats = await fetch('/api/admin/stats');
      const dataStats = await resStats.json();
      if (dataStats.userCount !== undefined) setStats(dataStats);

      // 3. ✅ 매장 리스트 (새로 추가됨)
      const resStores = await fetch('/api/admin/stores');
      const dataStores = await resStores.json();
      if (dataStores.stores) setStores(dataStores.stores);

    } catch (e) {
      alert('데이터 로딩 실패');
    } finally {
      setLoading(false);
    }
  };

  // 매장 주인 찾기 (매장의 owner_id와 회원의 id 매칭)
  const getOwnerEmail = (ownerId: string) => {
    const owner = users.find(u => u.id === ownerId);
    return owner ? owner.email : '정보 없음';
  };

  const handleDownloadExcel = () => {
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
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '30px', color: '#333' }}>
        관리자 대시보드 🛠️
      </h1>

      {/* 1. 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <StatCard title="총 방문 수" count={stats.visitCount} color="#3498db" icon="👀" />
        <StatCard title="생성된 매장 수" count={stats.storeCount} color="#e67e22" icon="🏪" />
        <StatCard title="가입 회원 수" count={stats.userCount} color="#2ecc71" icon="👥" />
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '40px 0' }} />

      {/* 2. ✅ 등록된 매장 목록 (가로 스크롤) */}
      <div style={{ marginBottom: '50px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#555', marginBottom: '16px' }}>
          🏪 등록된 매장 목록 ({stores.length}개)
        </h2>
        
        {/* 가로 스크롤 컨테이너 */}
        <div style={{ 
          display: 'flex', 
          gap: '16px', 
          overflowX: 'auto', 
          paddingBottom: '16px', // 스크롤바 공간 확보
          whiteSpace: 'nowrap'
        }}>
          {stores.length === 0 ? (
            <div style={{ padding: '20px', color: '#999' }}>등록된 매장이 없습니다.</div>
          ) : stores.map((store) => (
            <div key={store.id} style={storeCardStyle}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
                {store.name}
              </div>
              <div style={{ fontSize: '13px', color: '#666', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span>👤 점주: {getOwnerEmail(store.owner_id)}</span>
                <span>📞 {store.phone || '(전화번호 없음)'}</span>
                <span style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                  {store.is_five_plus ? '✅ 5인 이상' : '⬜ 5인 미만'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '40px 0' }} />

      {/* 3. 회원 목록 테이블 */}
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

      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #eee' }}>
            <tr>
              <th style={thStyle}>이메일</th>
              <th style={thStyle}>전화번호</th>
              <th style={thStyle}>가입일</th>
              <th style={thStyle}>최근 접속</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#888' }}>데이터를 불러오는 중입니다...</td></tr>
            ) : users.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
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

const storeCardStyle = {
  minWidth: '240px', // 카드의 최소 너비 (이것보다 작아지지 않음 -> 스크롤 생김)
  backgroundColor: 'white',
  padding: '20px',
  borderRadius: '12px',
  border: '1px solid #eee',
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  display: 'flex',
  flexDirection: 'column' as const,
  justifyContent: 'space-between'
};

const thStyle = { padding: '16px', textAlign: 'left' as const, color: '#555', fontWeight: 'bold' };
const tdStyle = { padding: '16px', color: '#333' };