import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>404</h1>
      <h2 style={subTitleStyle}>페이지를 찾을 수 없습니다 😢</h2>
      <p style={descStyle}>
        주소가 잘못되었거나 삭제된 페이지입니다.<br />
        입력하신 주소를 다시 확인해주세요.
      </p>
      <Link href="/dashboard" style={buttonStyle}>
        홈으로 돌아가기
      </Link>
    </div>
  );
}

// 스타일
const containerStyle = {
  display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center',
  height: '100vh', backgroundColor: '#f8f9fa', textAlign: 'center' as const, padding: '20px'
};
const titleStyle = { fontSize: '80px', fontWeight: '900', color: '#e0e0e0', margin: '0', lineHeight: '1' };
const subTitleStyle = { fontSize: '24px', fontWeight: 'bold', color: '#333', marginTop: '20px' };
const descStyle = { fontSize: '16px', color: '#666', lineHeight: '1.6', margin: '10px 0 30px 0' };
const buttonStyle = {
  padding: '12px 24px', backgroundColor: '#0052cc', color: '#fff', borderRadius: '8px',
  textDecoration: 'none', fontWeight: 'bold', fontSize: '15px'
};