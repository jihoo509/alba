// app/calculator/holiday/page.tsx

import HolidayCalculator from './HolidayCalculator'; // 방금 이름 바꾼 파일 불러오기

// ✅ 여기가 핵심! 검색엔진에 노출될 제목과 설명입니다.
export const metadata = {
  title: '2026 주휴수당 계산기 | 이지알바 - 1초 만에 자동 계산',
  description: '주휴수당 조건, 계산법이 헷갈리시나요? 시급과 근무시간만 입력하면 주휴수당이 자동으로 계산됩니다. 알바생, 사장님을 위한 무료 필수 도구.',
  keywords: ['주휴수당계산기', '주휴수당조건', '2026최저시급', '알바비계산기', '이지알바'],
  openGraph: {
    title: '2026 주휴수당 계산기 - 무료 자동 계산',
    description: '복잡한 계산은 그만! 시급 입력하고 바로 확인하세요.',
    url: 'https://www.xn--9g3bp2okvbh9c.kr/calculator/holiday', // 실제 도메인으로 변경 권장
    siteName: '이지알바',
    locale: 'ko_KR',
    type: 'website',
  },
};

export default function Page() {
  return <HolidayCalculator />;
}