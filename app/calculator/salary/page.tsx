// app/calculator/salary/page.tsx

import SalaryCalculator from './SalaryCalculator'; // 방금 이름 바꾼 파일 불러오기

// ✅ 급여 계산기용 검색 키워드 설정
export const metadata = {
  title: '2026 급여 계산기 | 이지알바 - 월급, 연봉, 실수령액 계산',
  description: '시급을 월급으로, 월급을 연봉으로! 4대보험, 3.3% 세금 공제 후 실제 받는 돈을 정확하게 계산해 드립니다. 야간, 연장, 휴일 수당 포함.',
  keywords: ['급여계산기', '월급계산기', '알바비계산기', '4대보험계산기', '실수령액계산기', '이지알바'],
  openGraph: {
    title: '2026 급여·알바비 계산기 - 실수령액 1초 확인',
    description: '세금 떼고 얼마 받을까? 4대보험, 주휴수당 포함 자동 계산.',
    url: 'https://www.xn--9g3bp2okvbh9c.kr/calculator/salary', // 실제 도메인으로 변경 권장
    siteName: '이지알바',
    locale: 'ko_KR',
    type: 'website',
  },
};

export default function Page() {
  return <SalaryCalculator />;
}