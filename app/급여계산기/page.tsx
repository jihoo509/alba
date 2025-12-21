'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// ✅ [이지알바 원본] 세금 요율 및 계산식 이식
const TAX_RATES = {
  pension: 0.045, 
  health: 0.03545, 
  care: 0.1295, 
  employment: 0.009, 
  incomeTax: 0.03, 
  localTax: 0.1
};

// 소득세 약식 계산 (간이세액표 구간 적용)
const calculateIncomeTax = (monthlyPay: number) => {
  const income = monthlyPay; 
  if (income < 1060000) return { incomeTax: 0, localTax: 0 };

  let tax = 0;
  if (income < 1500000) tax = (income - 1060000) * 0.015; 
  else if (income < 2000000) tax = 6600 + (income - 1500000) * 0.03; 
  else if (income < 3000000) tax = 21600 + (income - 2000000) * 0.05; 
  else if (income < 4000000) tax = 71600 + (income - 3000000) * 0.07; 
  else if (income < 5000000) tax = 141600 + (income - 4000000) * 0.09; 
  else if (income < 7000000) tax = 231600 + (income - 5000000) * 0.12; 
  else tax = 471600 + (income - 7000000) * 0.15;

  // 원단위 절사 (이지알바는 10원 단위지만 여기선 단순화)
  const incomeTax = Math.floor(tax / 10) * 10;
  const localTax = Math.floor((incomeTax * 0.1) / 10) * 10;
  return { incomeTax, localTax };
};

type AllowanceItem = {
  id: number;
  type: string;
  value: string;
};

export default function SimpleSalaryCalculator() {
  const [hourlyWage, setHourlyWage] = useState('');
  const [workHours, setWorkHours] = useState('');
  const [allowances, setAllowances] = useState<AllowanceItem[]>([]);
  const [taxType, setTaxType] = useState('none');

  const [result, setResult] = useState({
    totalPay: 0,
    finalPay: 0,
    taxDetails: { pension: 0, health: 0, care: 0, employment: 0, incomeTax: 0, localTax: 0, totalTax: 0 }
  });

  useEffect(() => {
    const wage = Number(hourlyWage.replace(/,/g, '')) || 0;
    const baseHours = Number(workHours) || 0;

    // 1. 급여 합산
    let total = wage * baseHours;
    allowances.forEach(item => {
      const val = Number(item.value) || 0;
      if (item.type === 'holiday') total += val * wage;
      else if (item.type === 'overtime') total += val * wage * 1.5;
      else if (item.type === 'night') total += val * wage * 0.5; // 야간 가산은 보통 0.5배 (기본급에 얹어줌)
      else if (item.type === 'etc') total += val; 
    });
    total = Math.floor(total);

    // 2. 세금 계산 (이지알바 로직 적용)
    let taxes = { pension: 0, health: 0, care: 0, employment: 0, incomeTax: 0, localTax: 0, totalTax: 0 };

    if (total > 0 && taxType !== 'none') {
      if (taxType === '3.3') {
        // 3.3% 프리랜서
        const iTax = Math.floor(total * 0.03 / 10) * 10;
        const lTax = Math.floor(iTax * 0.1 / 10) * 10;
        taxes.incomeTax = iTax;
        taxes.localTax = lTax;
        taxes.totalTax = iTax + lTax;
      } else if (taxType === '4insurance') {
        // 4대보험 (이지알바 요율 적용)
        taxes.pension = Math.floor(total * TAX_RATES.pension / 10) * 10;
        taxes.health = Math.floor(total * TAX_RATES.health / 10) * 10;
        taxes.care = Math.floor(taxes.health * TAX_RATES.care / 10) * 10; // 장기요양은 건강보험료 기준
        taxes.employment = Math.floor(total * TAX_RATES.employment / 10) * 10;
        
        // 소득세 (간이세액표)
        const { incomeTax, localTax } = calculateIncomeTax(total);
        taxes.incomeTax = incomeTax;
        taxes.localTax = localTax;

        taxes.totalTax = taxes.pension + taxes.health + taxes.care + taxes.employment + taxes.incomeTax + taxes.localTax;
      }
    }

    setResult({
      totalPay: total,
      finalPay: total - taxes.totalTax,
      taxDetails: taxes
    });

  }, [hourlyWage, workHours, allowances, taxType]);

  const addAllowance = () => setAllowances([...allowances, { id: Date.now(), type: 'holiday', value: '' }]);
  const removeAllowance = (id: number) => setAllowances(allowances.filter(item => item.id !== id));
  const updateAllowance = (id: number, field: 'type' | 'value', val: string) => {
    setAllowances(allowances.map(item => item.id === id ? { ...item, [field]: val } : item));
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
          <span className="text-blue-600 font-bold">4대보험, 소득세까지 정확하게 계산!</span>
        </p>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 mb-8 border border-gray-100">
        
        {/* 입력 섹션 생략 (위와 동일하지만 값 보존) */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-800 mb-2 ml-1">시급</label>
          <div className="relative">
            <input type="text" value={hourlyWage} onChange={handleWageInput} placeholder="10,030" className="w-full text-right p-3 pr-10 text-xl font-bold border border-gray-200 rounded-xl outline-none focus:border-blue-500 bg-gray-50" inputMode="numeric" />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">원</span>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-800 mb-2 ml-1">이번 달 총 근무 시간</label>
          <div className="relative">
            <input type="number" value={workHours} onChange={(e) => setWorkHours(e.target.value)} placeholder="예: 160" className="w-full text-right p-3 pr-10 text-xl font-bold border border-gray-200 rounded-xl outline-none focus:border-blue-500 bg-gray-50" inputMode="decimal" />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">시간</span>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-2 px-1">
            <label className="text-sm font-bold text-gray-800">추가 수당</label>
            <button onClick={addAllowance} className="text-xs bg-blue-100 text-blue-600 px-3 py-1.5 rounded-full font-bold hover:bg-blue-200 transition">+ 수당 추가</button>
          </div>
          <div className="flex flex-col gap-3">
            {allowances.map((item) => (
              <div key={item.id} className="flex gap-2 items-center bg-blue-50/50 p-2 rounded-xl border border-blue-100">
                <select value={item.type} onChange={(e) => updateAllowance(item.id, 'type', e.target.value)} className="p-2 rounded-lg text-sm border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white w-28">
                  <option value="holiday">주휴(시간)</option>
                  <option value="overtime">연장(시간)</option>
                  <option value="night">야간(시간)</option>
                  <option value="etc">기타(금액)</option>
                </select>
                <input type="number" value={item.value} onChange={(e) => updateAllowance(item.id, 'value', e.target.value)} placeholder={item.type === 'etc' ? '금액' : '시간'} className="flex-1 p-2 rounded-lg text-sm border border-gray-200 text-right outline-none focus:border-blue-500" />
                <button onClick={() => removeAllowance(item.id)} className="text-gray-400 hover:text-red-500 px-1">&times;</button>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-sm font-bold text-gray-800 mb-2 ml-1">세금 공제</label>
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {['none', '3.3', '4insurance'].map((type) => (
              <button key={type} onClick={() => setTaxType(type)} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${taxType === type ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                {type === 'none' ? '미공제' : type === '3.3' ? '3.3%' : '4대보험'}
              </button>
            ))}
          </div>
        </div>

        {/* 결과값 표시 */}
        <div className="bg-gray-900 rounded-2xl p-6 text-white text-center shadow-lg">
          <div className="mb-4 pb-4 border-b border-gray-700">
             <div className="flex justify-between items-center mb-1 px-2">
                <p className="text-gray-400 text-sm">세전 총 급여</p>
                <p className="text-lg font-bold">{result.totalPay.toLocaleString()} 원</p>
             </div>
             {taxType !== 'none' && (
                <div className="text-xs text-gray-500 text-right px-2 mt-2 space-y-1">
                   {taxType === '4insurance' ? (
                       <>
                         <div className="flex justify-between"><span>국민연금</span><span>-{result.taxDetails.pension.toLocaleString()}</span></div>
                         <div className="flex justify-between"><span>건강보험</span><span>-{result.taxDetails.health.toLocaleString()}</span></div>
                         <div className="flex justify-between"><span>고용보험</span><span>-{result.taxDetails.employment.toLocaleString()}</span></div>
                         <div className="flex justify-between"><span>소득세 등</span><span>-{(result.taxDetails.incomeTax + result.taxDetails.localTax).toLocaleString()}</span></div>
                       </>
                   ) : (
                       <div className="flex justify-between"><span>원천세(3.3%)</span><span>-{result.taxDetails.totalTax.toLocaleString()}</span></div>
                   )}
                   <div className="flex justify-between pt-1 border-t border-gray-700 text-red-400 font-bold">
                       <span>총 공제액</span><span>-{result.taxDetails.totalTax.toLocaleString()}</span>
                   </div>
                </div>
             )}
          </div>
          <div>
             <p className="text-blue-300 font-bold mb-1 text-sm">최종 실수령액</p>
             <p className="text-3xl font-extrabold text-yellow-400">
               {result.finalPay.toLocaleString()} <span className="text-lg text-yellow-200">원</span>
             </p>
          </div>
        </div>

      </div>

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