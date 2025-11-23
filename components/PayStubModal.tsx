'use client';

import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';

type Props = {
  data: any;
  isOpen: boolean;
  onClose: () => void;
  year: number;
  month: number;
};

export default function PayStubModal({ data, isOpen, onClose, year, month }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  // ✅ 개인별 수당 조정 상태 (기본값은 true)
  const [useWeekly, setUseWeekly] = useState(true);
  const [useNight, setUseNight] = useState(true);

  // 모달 열릴 때마다 초기화
  useEffect(() => {
    if (isOpen) {
      setUseWeekly(true);
      setUseNight(true);
    }
  }, [isOpen, data]);

  if (!isOpen || !data) return null;

  // ✅ 즉석 재계산 로직
  const currentBasePay = data.basePay;
  const currentWeekly = useWeekly ? data.weeklyHolidayPay : 0;
  const currentNight = useNight ? data.nightPay : 0;
  
  const currentTotal = currentBasePay + currentWeekly + currentNight;
  
  // 세금 재계산 (총액이 바뀌면 세금도 바뀜)
  let currentTax = 0;
  if (data.type.includes('four')) { // 4대보험 비율 유지 (간략 계산)
     const originalRate = data.taxDetails.total / data.totalPay; 
     // 0원일 수 있으니 예외처리
     if (data.totalPay > 0) currentTax = Math.floor(currentTotal * originalRate / 10) * 10;
  } else { // 3.3%
     currentTax = Math.floor(currentTotal * 0.033 / 10) * 10;
  }
  
  const currentFinalPay = currentTotal - currentTax;

  const handleSaveImage = async () => {
    if (printRef.current) {
      const canvas = await html2canvas(printRef.current);
      const link = document.createElement('a');
      link.download = `${data.name}_${month}월_급여명세서.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
    }}>
      <div style={{ backgroundColor: '#222', color: '#fff', borderRadius: 8, maxWidth: 600, width: '95%', maxHeight: '95vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* 상단: 개인별 옵션 조절 (이미지엔 안 나옴) */}
        <div style={{ padding: 16, borderBottom: '1px solid #444', backgroundColor: '#333' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: 16 }}>⚙️ 지급 옵션 조정 (이 직원에만 적용)</h3>
          <div style={{ display: 'flex', gap: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={useWeekly} onChange={e => setUseWeekly(e.target.checked)} />
              주휴수당 지급 ({data.weeklyHolidayPay.toLocaleString()}원)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={useNight} onChange={e => setUseNight(e.target.checked)} />
              야간수당 지급 ({data.nightPay.toLocaleString()}원)
            </label>
          </div>
        </div>

        {/* 🟢 이미지로 저장될 영역 (흰색 배경) */}
        <div style={{ overflowY: 'auto', flex: 1, backgroundColor: '#fff' }}>
          <div ref={printRef} style={{ padding: 30, backgroundColor: '#fff', color: '#000', minHeight: 400 }}>
            <h2 style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 15, marginBottom: 25, fontSize: 24 }}>
              {year}년 {month}월 급여 명세서
            </h2>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, fontSize: 16 }}>
              <span>성명: <strong>{data.name}</strong></span>
              <span>지급일: {year}.{month}.{new Date().getDate()}</span>
            </div>

            {/* 일별 상세 내역 표 */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 25 }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0', borderTop: '2px solid #000', borderBottom: '1px solid #000' }}>
                  <th style={thStyle}>날짜(요일)</th>
                  <th style={thStyle}>근무시간</th>
                  <th style={thStyle}>시간</th>
                  <th style={thStyle}>기본급</th>
                  <th style={thStyle}>야간수당</th>
                </tr>
              </thead>
              <tbody>
                {data.dailyLogs.map((log: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={tdStyle}>
                        {log.date.slice(5)} ({log.dayLabel})
                    </td>
                    <td style={tdStyle}>{log.startTime} ~ {log.endTime}</td>
                    <td style={tdStyle}>{log.hours}h</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{log.basePay.toLocaleString()}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: log.nightPay > 0 ? 'red' : '#ccc' }}>
                        {useNight ? log.nightPay.toLocaleString() : 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 급여 합계 요약 */}
            <div style={{ border: '2px solid #000', padding: 20, borderRadius: 4 }}>
              <div style={rowStyle}>
                  <span>기본급 (시급 {data.wage.toLocaleString()}원)</span> 
                  <span>{currentBasePay.toLocaleString()}원</span>
              </div>
              
              {useWeekly && (
                  <div style={rowStyle}>
                      <span>+ 주휴수당</span> 
                      <span>{currentWeekly.toLocaleString()}원</span>
                  </div>
              )}
              
              {useNight && (
                  <div style={rowStyle}>
                      <span>+ 야간수당 합계</span> 
                      <span>{currentNight.toLocaleString()}원</span>
                  </div>
              )}

              <hr style={{ margin: '12px 0', borderTop: '1px dashed #aaa' }} />
              
              <div style={rowStyle}>
                  <span style={{fontWeight: 'bold'}}>세전 총액</span> 
                  <span style={{fontWeight: 'bold'}}>{currentTotal.toLocaleString()}원</span>
              </div>
              <div style={{ ...rowStyle, color: 'red' }}>
                  <span>- 공제 (세금 등)</span> 
                  <span>{currentTax.toLocaleString()}원</span>
              </div>
              
              <hr style={{ margin: '12px 0', borderTop: '2px solid #000' }} />
              
              <div style={{ ...rowStyle, fontSize: 20, fontWeight: 'bold', color: 'blue', marginTop: 10 }}>
                <span>실수령액</span> 
                <span>{currentFinalPay.toLocaleString()}원</span>
              </div>
            </div>
            
            <div style={{ marginTop: 30, textAlign: 'center', color: '#666', fontSize: 11 }}>
              위 급여는 근로기준법 및 매장 설정에 따라 계산되었습니다. <br/>
              문의사항은 점장에게 확인 바랍니다.
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div style={{ padding: 16, backgroundColor: '#333', borderTop: '1px solid #444', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '10px 20px', background: '#555', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>닫기</button>
          <button onClick={handleSaveImage} style={{ padding: '10px 20px', background: 'seagreen', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>
            이미지로 저장 (카톡 전송)
          </button>
        </div>
      </div>
    </div>
  );
}

const thStyle = { padding: '8px', textAlign: 'center' as const, fontWeight: 'bold', borderRight: '1px solid #ddd' };
const tdStyle = { padding: '8px', textAlign: 'center' as const, borderRight: '1px solid #ddd' };
const rowStyle = { display: 'flex', justifyContent: 'space-between', marginBottom: 6 };