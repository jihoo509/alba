'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

type AllowanceItem = {
  id: number;
  type: string;
  value: string; // 입력값 (시간 or 개수)
};

export default function SimpleSalaryCalculator() {
  const [hourlyWage, setHourlyWage] = useState('');
  const [workHours, setWorkHours] = useState(''); // 기본 근무 시간
  
  // 추가 수당 리스트
  const [allowances, setAllowances] = useState<AllowanceItem[]>([]);
  
  // 세금 설정 (none, 3.3, 4insurance)
  const [taxType, setTaxType] = useState('none');

  const [totalPay, setTotalPay] = useState(0);
  const [finalPay, setFinalPay] = useState(0);

  // 계산 로직
  useEffect(() => {
    const wage = Number(hourlyWage.replace(/,/g, '')) || 0;
    const baseHours = Number(workHours) || 0;

    // 1. 기본급 계산
    let total = wage * baseHours;

    // 2. 추가 수당 합산
    allowances.forEach(item => {
      const val = Number(item.value) || 0;
      if (item.type === 'holiday') { // 주휴수당 (시간으로 계산)
        total += val * wage;
      } else if (item.type === 'overtime') { // 연장수당 (1.5배)
        total += val * wage * 1.5;
      } else if (item.type === 'night') { // 야간수당 (0.5배 가산 or 1.5배 등 기준에 따라 다름, 여기선 1.5배 적용 통일)
        total += val * wage * 1.5;
      } else if (item.type === 'etc') { // 기타 수당 (금액 직접 입력)
        total += val; 
      }
    });

    setTotalPay(Math.floor(total));

    // 3. 세금 공제
    let tax = 0;
    if (taxType === '3.3') {
      tax = total * 0.033;
    } else if (taxType === '4insurance') {
      // 대략적인 4대보험 요율 합산 (국민4.5% + 건강3.545% + 장기요양(건강의12.95%) + 고용0.9%)
      // 약 9.4% 정도로 간이 계산
      tax = total * 0.094;
    }
    
    setFinalPay(Math.floor(total - tax));

  }, [hourlyWage, workHours, allowances, taxType]);

  // 수당 추가 핸들러
  const addAllowance = () => {
    setAllowances([...allowances, { id: Date.now(), type: 'holiday', value: '' }]);
  };

  // 수당 삭제 핸들러
  const removeAllowance = (id: number) => {
    setAllowances(allowances.filter(item => item.id !== id));
  };

  // 수당 값 변경 핸들러
  const updateAllowance = (id: number, field: 'type' | 'value', val: string) => {
    setAllowances(allowances.map(item => 
      item.id === id ? { ...item, [field]: val } : item
    ));
  };

  const handleWageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/,/g, '');
    if (/^\d*$/.test(val)) setHourlyWage(Number(val).toLocaleString());
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 font-sans">
      
      <div className="w-full max-w-md text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">🧮 월급 계산기</h1>
        <p className="text-gray-600">
          이번 달 내 월급은 총 얼마일까? <br/>
          <span className="text-blue-600 font-bold">수당까지 꼼꼼하게 더해보세요!</span>
        </p>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 mb-8 border border-gray-100">
        
        {/* 시급 입력 */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-800 mb-2 ml-1">시급</label>
          <div className="relative">
            <input 
              type="text" 
              value={hourlyWage}
              onChange={handleWageInput}
              placeholder="10,030"
              className="w-full text-right p-3 pr-10 text-xl font-bold border border-gray-200 rounded-xl outline-none focus:border-blue-500 bg-gray-50"
              inputMode="numeric"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">원</span>
          </div>
        </div>

        {/* 기본 근무 시간 */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-800 mb-2 ml-1">이번 달 총 근무 시간</label>
          <div className="relative">
            <input 
              type="number" 
              value={workHours}
              onChange={(e) => setWorkHours(e.target.value)}
              placeholder="예: 160"
              className="w-full text-right p-3 pr-10 text-xl font-bold border border-gray-200 rounded-xl outline-none focus:border-blue-500 bg-gray-50"
              inputMode="decimal"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">시간</span>
          </div>
        </div>

        {/* 추가 수당 영역 */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2 px-1">
            <label className="text-sm font-bold text-gray-800">추가 수당</label>
            <button onClick={addAllowance} className="text-xs bg-blue-100 text-blue-600 px-3 py-1.5 rounded-full font-bold hover:bg-blue-200 transition">
              + 수당 추가
            </button>
          </div>

          {allowances.length === 0 && (
            <div className="text-center py-4 bg-gray-50 rounded-xl text-gray-400 text-sm border border-dashed border-gray-200">
              추가할 수당이 있다면 버튼을 눌러주세요
            </div>
          )}

          <div className="flex flex-col gap-3">
            {allowances.map((item) => (
              <div key={item.id} className="flex gap-2 items-center bg-blue-50/50 p-2 rounded-xl border border-blue-100">
                <select 
                  value={item.type}
                  onChange={(e) => updateAllowance(item.id, 'type', e.target.value)}
                  className="p-2 rounded-lg text-sm border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white w-28"
                >
                  <option value="holiday">주휴수당(시간)</option>
                  <option value="overtime">연장수당(시간)</option>
                  <option value="night">야간수당(시간)</option>
                  <option value="etc">기타(금액)</option>
                </select>
                <input 
                  type="number" 
                  value={item.value}
                  onChange={(e) => updateAllowance(item.id, 'value', e.target.value)}
                  placeholder={item.type === 'etc' ? '금액' : '시간'}
                  className="flex-1 p-2 rounded-lg text-sm border border-gray-200 text-right outline-none focus:border-blue-500"
                />
                <button onClick={() => removeAllowance(item.id)} className="text-gray-400 hover:text-red-500 px-1">
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 세금 선택 */}
        <div className="mb-8">
          <label className="block text-sm font-bold text-gray-800 mb-2 ml-1">세금 공제</label>
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {['none', '3.3', '4insurance'].map((type) => (
              <button
                key={type}
                onClick={() => setTaxType(type)}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                  taxType === type ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {type === 'none' ? '미공제' : type === '3.3' ? '3.3%' : '4대보험'}
              </button>
            ))}
          </div>
        </div>

        {/* 결과값 */}
        <div className="bg-gray-900 rounded-2xl p-6 text-white text-center shadow-lg">
          <div className="mb-4 pb-4 border-b border-gray-700">
             <p className="text-gray-400 text-sm mb-1">세전 총 급여</p>
             <p className="text-xl font-bold">{totalPay.toLocaleString()} 원</p>
          </div>
          <div>
             <p className="text-blue-300 font-bold mb-1 text-sm">최종 실수령액</p>
             <p className="text-3xl font-extrabold text-yellow-400">
               {finalPay.toLocaleString()} <span className="text-lg text-yellow-200">원</span>
             </p>
          </div>
        </div>

      </div>

      {/* CTA (마케팅) */}
      <div className="w-full max-w-md">
        <Link href="/" className="block group">
          <div className="bg-white border-2 border-blue-600 rounded-2xl p-6 text-center shadow-lg transform transition duration-300 hover:-translate-y-1">
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              급여 명세서, 아직도 안 보내셨나요?
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              법적 의무인 급여명세서 교부,<br/>
              <strong className="text-blue-600">이지알바</strong>에선 카톡으로 3초면 끝!
            </p>
            <div className="bg-blue-600 text-white font-bold py-3 rounded-xl shadow-md group-hover:bg-blue-700 transition">
              👉 명세서 무료 발송하기
            </div>
          </div>
        </Link>
      </div>

    </div>
  );
}