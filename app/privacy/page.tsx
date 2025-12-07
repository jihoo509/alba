'use client';

import React from 'react';

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', lineHeight: '1.6' }}>
      <h1 style={{ borderBottom: '2px solid #333', paddingBottom: '10px', marginBottom: '20px' }}>개인정보 처리방침</h1>
      
      <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', border: '1px solid #eee' }}>
        <h3 style={{ marginTop: '0' }}>1. 수집하는 개인정보 항목</h3>
        <p>이메일, 비밀번호, 휴대전화번호</p>
        
        <br />
        
        <h3>2. 개인정보의 수집 및 이용 목적</h3>
        <ul style={{ paddingLeft: '20px' }}>
          <li>회원 가입 및 관리 (본인 확인, 가입 의사 확인)</li>
          <li>서비스 제공 (직원 관리, 급여 계산 등)</li>
          <li>마케팅 및 프로모션 활용 (신규 서비스 안내, 이벤트 정보 전달)</li>
        </ul>

        <br />

        <h3>3. 개인정보의 보유 및 이용 기간</h3>
        <p>회원 탈퇴 시까지 보유하며, 탈퇴 시 지체 없이 파기합니다.</p>
        
        <br />
        
        <p style={{ fontSize: '14px', color: '#666', borderTop: '1px solid #ddd', paddingTop: '10px' }}>
          ※ 귀하는 개인정보 수집 및 이용에 대한 동의를 거부할 권리가 있습니다. 다만, 동의를 거부할 경우 회원가입이 불가능합니다.
        </p>
      </div>

      <div style={{ marginTop: '40px', textAlign: 'center' }}>
        <a href="/" style={{ textDecoration: 'none', color: '#fff', background: '#0052cc', padding: '10px 20px', borderRadius: '5px' }}>
          홈으로 돌아가기
        </a>
      </div>
    </div>
  );
}