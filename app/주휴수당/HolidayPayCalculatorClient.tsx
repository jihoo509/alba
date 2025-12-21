'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HolidayPayCalculatorClient() {
  const [hourlyWage, setHourlyWage] = useState('');
  const [weeklyHours, setWeeklyHours] = useState('');
  const [result, setResult] = useState<number | null>(null);

  useEffect(() => {
    const wage = Number(hourlyWage.replace(/,/g, ''));
    const hours = Number(weeklyHours);

    if (!wage || !hours) {
      setResult(null);
      return;
    }

    if (hours < 15) {
      setResult(0);
      return;
    }

    const recognizedHours = Math.min(hours, 40);
    const holidayPay = Math.floor((recognizedHours / 40) * 8 * wage);
    setResult(holidayPay);
  }, [hourlyWage, weeklyHours]);

  const handleWageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/,/g, '');
    if (/^\d*$/.test(val)) setHourlyWage(Number(val).toLocaleString());
  };

  return (
    // ✅ 모든 클래스에 tw- 접두사 적용 완료 (기존 CSS와 충돌 절대 없음)
    <div className="tw-min-h-screen tw-bg-[#f8f9fa] tw-flex tw-flex-col tw-items-center tw-font-sans tw-relative">
      
      {/* 상단 헤더 배경 */}
      <div className="tw-w-full tw-bg-blue-600 tw-h-48 tw-absolute tw-top-0 tw-left-0 tw-z-0 tw-rounded-b-[40px] tw-shadow-lg"></div>

      <div className="tw-w-full tw-max-w-md tw-px-4 tw-z-10 tw-mt-8 tw-flex tw-flex-col tw-gap-6 tw-pb-20">
        
        {/* 타이틀 영역 */}
        <div className="tw-text-center tw-text-white tw-mb-2">
          <h1 className="tw-text-2xl tw-font-extrabold tw-mb-1 tw-drop-shadow-md">💰 주휴수당 계산기</h1>
          <p className="tw-text-blue-100 tw-text-sm tw-font-medium tw-opacity-90">
            2025년 최신 법적 기준 적용
          </p>
        </div>

        {/* 계산기 카드 */}
        <div className="tw-bg-white tw-rounded-3xl tw-shadow-xl tw-p-8 tw-border tw-border-gray-100">
          
          {/* 입력: 시급 */}
          <div className="tw-mb-6">
            <label className="tw-block tw-text-sm tw-font-bold tw-text-gray-600 tw-mb-2 tw-ml-1">시급을 입력하세요</label>
            <div className="tw-relative">
              <input 
                type="text" 
                value={hourlyWage}
                onChange={handleWageInput}
                placeholder="10,030"
                className="tw-w-full tw-text-right tw-p-4 tw-pr-12 tw-text-2xl tw-font-bold tw-border tw-border-gray-200 tw-rounded-2xl focus:tw-ring-4 focus:tw-ring-blue-100 focus:tw-border-blue-500 tw-outline-none tw-bg-gray-50 tw-transition-all tw-placeholder-gray-300 tw-text-gray-800"
                inputMode="numeric"
              />
              <span className="tw-absolute tw-right-5 tw-top-1/2 tw-translate-y-[-50%] tw-text-gray-500 tw-font-bold tw-text-lg">원</span>
            </div>
            <div className="tw-flex tw-gap-2 tw-mt-2">
               <button onClick={() => setHourlyWage('10,030')} className="tw-text-xs tw-bg-gray-100 tw-text-gray-500 tw-px-3 tw-py-1.5 tw-rounded-full hover:tw-bg-gray-200 tw-transition">최저시급 적용</button>
            </div>
          </div>

          {/* 입력: 근무시간 */}
          <div className="tw-mb-8">
            <label className="tw-block tw-text-sm tw-font-bold tw-text-gray-600 tw-mb-2 tw-ml-1">이번 주 총 근무 시간</label>
            <div className="tw-relative">
              <input 
                type="number" 
                value={weeklyHours}
                onChange={(e) => setWeeklyHours(e.target.value)}
                placeholder="예: 20"
                className="tw-w-full tw-text-right tw-p-4 tw-pr-12 tw-text-2xl tw-font-bold tw-border tw-border-gray-200 tw-rounded-2xl focus:tw-ring-4 focus:tw-ring-blue-100 focus:tw-border-blue-500 tw-outline-none tw-bg-gray-50 tw-transition-all tw-placeholder-gray-300 tw-text-gray-800"
                inputMode="decimal"
              />
              <span className="tw-absolute tw-right-5 tw-top-1/2 tw-translate-y-[-50%] tw-text-gray-500 tw-font-bold tw-text-lg">시간</span>
            </div>
          </div>

          {/* 결과 표시 */}
          <div className={`tw-overflow-hidden tw-transition-all tw-duration-500 tw-ease-out ${result !== null ? 'tw-max-h-40 tw-opacity-100' : 'tw-max-h-0 tw-opacity-0'}`}>
            <div className="tw-bg-[#f0f9ff] tw-rounded-2xl tw-p-6 tw-border tw-border-blue-100 tw-text-center tw-relative tw-overflow-hidden">
              <div className="tw-relative tw-z-10">
                <p className="tw-text-blue-600 tw-font-bold tw-mb-1 tw-text-sm">예상 주휴수당</p>
                <p className="tw-text-4xl tw-font-extrabold tw-text-blue-700 tw-tracking-tight">
                  {result?.toLocaleString()}<span className="tw-text-xl tw-ml-1 tw-font-bold">원</span>
                </p>
              </div>
            </div>
            {/* 조건 안내 */}
            <div className="tw-mt-3 tw-text-center">
                 {Number(weeklyHours) < 15 ? (
                    <span className="tw-text-xs tw-font-bold tw-text-red-500 tw-bg-red-50 tw-px-3 tw-py-1 tw-rounded-full">⚠️ 주 15시간 미만은 지급 대상이 아닙니다.</span>
                  ) : (
                    <span className="tw-text-xs tw-font-bold tw-text-blue-600 tw-bg-blue-50 tw-px-3 tw-py-1 tw-rounded-full">✅ 1주 개근 시 받을 수 있는 금액입니다.</span>
                  )}
            </div>
          </div>
        </div>

        {/* CTA (마케팅 배너) */}
        <Link href="/" className="tw-block tw-group tw-cursor-pointer">
          <div className="tw-bg-gradient-to-r tw-from-gray-900 tw-to-gray-800 tw-rounded-3xl tw-p-6 tw-text-white tw-shadow-xl tw-relative tw-overflow-hidden tw-transform tw-transition tw-duration-300 active:tw-scale-[0.98]">
             <div className="tw-relative tw-z-10 tw-flex tw-justify-between tw-items-center">
                <div className="tw-text-left">
                    <span className="tw-bg-yellow-400 tw-text-black tw-text-[10px] tw-font-bold tw-px-2 tw-py-0.5 tw-rounded-sm tw-mb-2 tw-inline-block">사장님 추천</span>
                    <h3 className="tw-text-lg tw-font-bold tw-leading-tight tw-mb-1">매주 계산하기 귀찮다면?</h3>
                    <p className="tw-text-gray-300 tw-text-xs">급여명세서 발송까지 3초 컷!</p>
                </div>
                <div className="tw-bg-white tw-text-gray-900 tw-w-10 tw-h-10 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-font-bold tw-text-xl tw-shadow-md group-hover:tw-scale-110 tw-transition">
                    👉
                </div>
             </div>
          </div>
        </Link>

        {/* SEO용 정보성 콘텐츠 */}
        <div className="tw-mt-4 tw-px-2">
            <h3 className="tw-text-lg tw-font-bold tw-text-gray-800 tw-mb-4 tw-border-b tw-pb-2">💡 주휴수당 자주 묻는 질문</h3>
            
            <details className="tw-mb-3 tw-group">
                <summary className="tw-list-none tw-flex tw-justify-between tw-items-center tw-font-bold tw-text-gray-700 tw-cursor-pointer tw-bg-white tw-p-4 tw-rounded-xl tw-shadow-sm">
                    Q. 주휴수당 지급 조건은?
                    <span className="tw-text-gray-400 group-open:tw-rotate-180 tw-transition">▼</span>
                </summary>
                <div className="tw-text-sm tw-text-gray-600 tw-p-4 tw-bg-gray-50 tw-rounded-b-xl tw-leading-relaxed">
                    1. 일주일 동안 <strong>15시간 이상</strong> 근무해야 합니다.<br/>
                    2. 근로계약서에 정한 날짜에 <strong>개근</strong>해야 합니다.<br/>
                    3. 다음 주에도 근무가 예정되어 있어야 합니다.
                </div>
            </details>

            <details className="tw-mb-3 tw-group">
                <summary className="tw-list-none tw-flex tw-justify-between tw-items-center tw-font-bold tw-text-gray-700 tw-cursor-pointer tw-bg-white tw-p-4 tw-rounded-xl tw-shadow-sm">
                    Q. 40시간 넘게 일하면요?
                    <span className="tw-text-gray-400 group-open:tw-rotate-180 tw-transition">▼</span>
                </summary>
                <div className="tw-text-sm tw-text-gray-600 tw-p-4 tw-bg-gray-50 tw-rounded-b-xl tw-leading-relaxed">
                    법적으로 주휴수당은 <strong>주 40시간까지만</strong> 인정됩니다.<br/>
                    예를 들어 50시간을 일해도, 주휴수당은 40시간 기준으로 최대 8시간분까지만 발생합니다.
                </div>
            </details>
        </div>

        {/* 푸터 */}
        <div className="tw-text-center tw-mt-4">
             <Link href="/" className="tw-text-gray-400 tw-text-xs tw-font-bold hover:tw-text-gray-600 tw-transition">
                Powered by <span className="tw-text-blue-600">Easy Alba</span>
             </Link>
        </div>

      </div>
    </div>
  );
}