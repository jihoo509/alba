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
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center font-sans">
      
      {/* 상단 헤더 배경 */}
      <div className="w-full bg-blue-600 h-48 absolute top-0 left-0 z-0 rounded-b-[40px] shadow-lg"></div>

      <div className="w-full max-w-md px-4 z-10 mt-8 flex flex-col gap-6 pb-20">
        
        {/* 타이틀 영역 */}
        <div className="text-center text-white mb-2">
          <h1 className="text-2xl font-extrabold mb-1 drop-shadow-md">💰 주휴수당 계산기</h1>
          <p className="text-blue-100 text-sm font-medium opacity-90">
            2025년 최신 법적 기준 적용
          </p>
        </div>

        {/* 계산기 카드 */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          
          {/* 입력: 시급 */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-600 mb-2 ml-1">시급을 입력하세요</label>
            <div className="relative">
              <input 
                type="text" 
                value={hourlyWage}
                onChange={handleWageInput}
                placeholder="10,030"
                className="w-full text-right p-4 pr-12 text-2xl font-bold border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none bg-gray-50 transition-all placeholder-gray-300 text-gray-800"
                inputMode="numeric"
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">원</span>
            </div>
            <div className="flex gap-2 mt-2">
               <button onClick={() => setHourlyWage('10,030')} className="text-xs bg-gray-100 text-gray-500 px-3 py-1.5 rounded-full hover:bg-gray-200 transition">최저시급 적용</button>
            </div>
          </div>

          {/* 입력: 근무시간 */}
          <div className="mb-8">
            <label className="block text-sm font-bold text-gray-600 mb-2 ml-1">이번 주 총 근무 시간</label>
            <div className="relative">
              <input 
                type="number" 
                value={weeklyHours}
                onChange={(e) => setWeeklyHours(e.target.value)}
                placeholder="예: 20"
                className="w-full text-right p-4 pr-12 text-2xl font-bold border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none bg-gray-50 transition-all placeholder-gray-300 text-gray-800"
                inputMode="decimal"
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">시간</span>
            </div>
          </div>

          {/* 결과 표시 (입력 시 자동 노출) */}
          <div className={`overflow-hidden transition-all duration-500 ease-out ${result !== null ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="bg-[#f0f9ff] rounded-2xl p-6 border border-blue-100 text-center relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-blue-600 font-bold mb-1 text-sm">예상 주휴수당</p>
                <p className="text-4xl font-extrabold text-blue-700 tracking-tight">
                  {result?.toLocaleString()}<span className="text-xl ml-1 font-bold">원</span>
                </p>
              </div>
            </div>
            {/* 조건 안내 */}
            <div className="mt-3 text-center">
                 {Number(weeklyHours) < 15 ? (
                    <span className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1 rounded-full">⚠️ 주 15시간 미만은 지급 대상이 아닙니다.</span>
                  ) : (
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">✅ 1주 개근 시 받을 수 있는 금액입니다.</span>
                  )}
            </div>
          </div>
        </div>

        {/* CTA (마케팅 배너) - 디자인 강화 */}
        <Link href="/" className="block group cursor-pointer">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden transform transition duration-300 active:scale-[0.98]">
             <div className="relative z-10 flex justify-between items-center">
                <div className="text-left">
                    <span className="bg-yellow-400 text-black text-[10px] font-bold px-2 py-0.5 rounded-sm mb-2 inline-block">사장님 추천</span>
                    <h3 className="text-lg font-bold leading-tight mb-1">매주 계산하기 귀찮다면?</h3>
                    <p className="text-gray-300 text-xs">급여명세서 발송까지 3초 컷!</p>
                </div>
                <div className="bg-white text-gray-900 w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl shadow-md group-hover:scale-110 transition">
                    👉
                </div>
             </div>
          </div>
        </Link>

        {/* SEO용 정보성 콘텐츠 (검색 노출용) - 스타일링 적용 */}
        <div className="mt-4 px-2">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">💡 주휴수당 자주 묻는 질문</h3>
            
            <details className="mb-3 group">
                <summary className="list-none flex justify-between items-center font-bold text-gray-700 cursor-pointer bg-white p-4 rounded-xl shadow-sm">
                    Q. 주휴수당 지급 조건은?
                    <span className="text-gray-400 group-open:rotate-180 transition">▼</span>
                </summary>
                <div className="text-sm text-gray-600 p-4 bg-gray-50 rounded-b-xl leading-relaxed">
                    1. 일주일 동안 <strong>15시간 이상</strong> 근무해야 합니다.<br/>
                    2. 근로계약서에 정한 날짜에 <strong>개근</strong>해야 합니다.<br/>
                    3. 다음 주에도 근무가 예정되어 있어야 합니다. (단, 월급제는 퇴사 시 제외될 수 있음)
                </div>
            </details>

            <details className="mb-3 group">
                <summary className="list-none flex justify-between items-center font-bold text-gray-700 cursor-pointer bg-white p-4 rounded-xl shadow-sm">
                    Q. 40시간 넘게 일하면요?
                    <span className="text-gray-400 group-open:rotate-180 transition">▼</span>
                </summary>
                <div className="text-sm text-gray-600 p-4 bg-gray-50 rounded-b-xl leading-relaxed">
                    법적으로 주휴수당은 <strong>주 40시간까지만</strong> 인정됩니다.<br/>
                    예를 들어 50시간을 일해도, 주휴수당은 40시간 기준으로 최대 8시간분까지만 발생합니다. (나머지는 연장 근로 수당 등 별도 계산)
                </div>
            </details>
        </div>

        {/* 푸터 */}
        <div className="text-center mt-4">
             <Link href="/" className="text-gray-400 text-xs font-bold hover:text-gray-600 transition">
                Powered by <span className="text-blue-600">Easy Alba</span>
             </Link>
        </div>

      </div>
    </div>
  );
}