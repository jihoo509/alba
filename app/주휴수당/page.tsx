'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HolidayPayCalculator() {
  const [hourlyWage, setHourlyWage] = useState('');
  const [weeklyHours, setWeeklyHours] = useState('');
  const [result, setResult] = useState<number | null>(null);

  // 자동 계산 로직
  useEffect(() => {
    const wage = Number(hourlyWage.replace(/,/g, ''));
    const hours = Number(weeklyHours);

    if (!wage || !hours) {
      setResult(null);
      return;
    }

    // 1. 주 15시간 미만: 주휴수당 없음
    if (hours < 15) {
      setResult(0);
      return;
    }

    // 2. 주 15시간 이상: (주 40시간 비례)
    // 최대 40시간까지만 인정 (법적 기준)
    const recognizedHours = Math.min(hours, 40);
    
    // 계산식: (인정시간 / 40) * 8 * 시급
    const holidayPay = (recognizedHours / 40) * 8 * wage;
    
    setResult(Math.floor(holidayPay)); // 원 단위 절사
  }, [hourlyWage, weeklyHours]);

  const handleWageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/,/g, '');
    // 숫자만 입력 가능하게
    if (/^\d*$/.test(val)) setHourlyWage(Number(val).toLocaleString());
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 font-sans">
      
      {/* 1. 상단 타이틀 */}
      <div className="w-full max-w-md text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">💰 주휴수당 계산기</h1>
        <p className="text-gray-600">
          이번 주 내 주휴수당은 얼마일까? <br/>
          <span className="text-blue-600 font-bold">입력 즉시 확인하세요!</span>
        </p>
      </div>

      {/* 2. 계산기 카드 */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 mb-8 border border-gray-100">
        
        {/* 입력: 시급 */}
        <div className="mb-8">
          <label className="block text-sm font-bold text-gray-800 mb-2 ml-1">시급</label>
          <div className="relative">
            <input 
              type="text" 
              value={hourlyWage}
              onChange={handleWageInput}
              placeholder="10,030"
              className="w-full text-right p-4 pr-12 text-2xl font-bold border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none bg-gray-50 transition-all placeholder-gray-300"
              inputMode="numeric"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">원</span>
          </div>
        </div>

        {/* 입력: 주간 총 근무시간 */}
        <div className="mb-8">
          <label className="block text-sm font-bold text-gray-800 mb-2 ml-1">이번 주 총 근무 시간</label>
          <div className="relative">
            <input 
              type="number" 
              value={weeklyHours}
              onChange={(e) => setWeeklyHours(e.target.value)}
              placeholder="예: 20"
              className="w-full text-right p-4 pr-12 text-2xl font-bold border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none bg-gray-50 transition-all placeholder-gray-300"
              inputMode="decimal"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">시간</span>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-right">
            * 휴게시간 제외, 실제 일한 시간만 입력
          </p>
        </div>

        {/* 결과 표시 영역 */}
        <div className={`transition-all duration-500 ease-out transform ${result !== null ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 text-center shadow-sm">
            <p className="text-blue-600 font-bold mb-2">예상 주휴수당</p>
            <p className="text-4xl font-extrabold text-blue-800 tracking-tight">
              {result?.toLocaleString()}<span className="text-2xl ml-1">원</span>
            </p>
            
            {/* 조건별 안내 문구 */}
            <div className="mt-4 text-xs font-medium text-gray-500 bg-white/80 py-2 px-3 rounded-lg inline-block">
              {Number(weeklyHours) < 15 ? (
                <span className="text-red-500">⚠️ 주 15시간 미만은 주휴수당 대상이 아닙니다.</span>
              ) : (
                <span className="text-blue-600">✅ 1주 개근 시 받을 수 있는 금액입니다.</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. CTA (마케팅 유입용 - 이지알바 메인으로 연결) */}
      <div className="w-full max-w-md">
        <Link href="/" className="block group">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg text-center transform transition duration-300 hover:scale-[1.02] hover:shadow-2xl">
            <h3 className="text-lg font-bold mb-2">사장님, 알바생 관리 힘드신가요?</h3>
            <p className="text-blue-100 text-sm mb-5 leading-relaxed">
              매주 급여 계산하고, 주휴수당 챙기기 귀찮다면<br/>
              <strong className="text-white font-extrabold border-b border-white/40 pb-0.5">이지알바</strong>에게 전부 맡겨보세요.
            </p>
            <div className="bg-white text-blue-700 font-bold py-3.5 rounded-xl shadow-md group-hover:bg-blue-50 transition flex items-center justify-center gap-2">
              <span>🚀 이지알바 무료로 시작하기</span>
            </div>
          </div>
        </Link>
        
        {/* 하단 서비스 이미지 (이지알바 로고나 스크린샷 있으면 여기에 넣으면 좋음) */}
        <div className="mt-8 opacity-50 flex justify-center">
             {/* 이미지 없으면 텍스트 로고로 대체 */}
             <span className="text-2xl font-black text-gray-300 tracking-tighter">Easy Alba</span>
        </div>
      </div>

    </div>
  );
}