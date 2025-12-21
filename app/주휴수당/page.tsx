import React from 'react';
import type { Metadata } from 'next';
import HolidayPayCalculatorClient from './HolidayPayCalculatorClient';

// ✅ 1. SEO 메타데이터 설정 (광고/검색/카톡공유 시 보이는 정보)
export const metadata: Metadata = {
  title: '2025 주휴수당 계산기 - 1초 만에 내 주휴수당 확인 | 이지알바',
  description: '알바생, 사장님 필수! 시급과 근무시간만 입력하면 주휴수당이 자동으로 계산됩니다. 최신 법적 기준(40시간 비례) 완벽 반영.',
  openGraph: {
    title: '2025 주휴수당 계산기 - 1초 만에 확인하기',
    description: '이번 주 내 주휴수당은 얼마? 복잡한 계산 없이 바로 확인하세요.',
    url: 'https://이지알바.kr/주휴수당',
    type: 'website',
  },
};

export default function Page() {
  return <HolidayPayCalculatorClient />;
}