'use client';

import React from 'react';

export default function TermsPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', lineHeight: '1.6' }}>
      <h1 style={{ borderBottom: '2px solid #333', paddingBottom: '10px', marginBottom: '20px' }}>서비스 이용약관</h1>
      
      <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', border: '1px solid #eee' }}>
        <h3 style={{ marginTop: '0' }}>제1조 (목적)</h3>
        <p>
          본 약관은 'Easy Alba'(이하 "회사")가 제공하는 직원 관리 및 급여 계산 자동화 서비스(이하 "서비스")의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
        </p>

        <br />

        <h3>제2조 (용어의 정의)</h3>
        <p>1. "서비스"란 회사가 제공하는 웹/모바일 기반의 스케줄링 및 급여 관리 플랫폼을 말합니다.</p>
        <p>2. "회원"이란 서비스에 접속하여 본 약관에 동의하고 이용계약을 체결한 자를 말합니다.</p>

        <br />

        <h3>제3조 (서비스의 제공 및 한계)</h3>
        <p>
          1. 회사는 직원 스케줄 관리, 급여 자동 계산, 급여 명세서 생성 등의 기능을 제공합니다.<br/>
          2. <strong>(중요)</strong> 본 서비스가 제공하는 급여 계산 결과는 근로기준법 및 관련 법령에 기반한 예상치입니다. 사용자의 설정 값이나 예외적인 상황에 따라 실제 법적 의무 금액과 차이가 발생할 수 있으며, <strong>최종적인 지급 책임과 법적 검토 의무는 회원(사용자) 본인에게 있습니다.</strong>
        </p>

        <br />

        <h3>제4조 (회원의 의무)</h3>
        <p>
          1. 회원은 서비스 이용 시 정확한 정보를 입력해야 하며, 타인의 정보를 도용해서는 안 됩니다.<br/>
          2. 회원은 본 서비스를 불법적인 목적이나 공서양속에 반하는 목적으로 사용할 수 없습니다.
        </p>

        <br />

        <h3>제5조 (책임의 제한)</h3>
        <p>
          회사는 천재지변, 시스템 점검, 기타 불가항력적인 사유로 인해 서비스를 제공할 수 없는 경우에 대한 책임이 면제됩니다. 또한, 회원이 입력한 데이터의 오류로 인해 발생한 손해에 대해서는 책임을 지지 않습니다.
        </p>
        
        <br />

        <p style={{ fontSize: '14px', color: '#666', borderTop: '1px solid #ddd', paddingTop: '10px' }}>
          * 본 약관은 2025년 1월 1일부터 시행됩니다.<br/>
          * 문의: inserr509@gmail.com
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