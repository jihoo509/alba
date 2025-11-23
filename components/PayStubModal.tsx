'use client';

import React, { useRef } from 'react';
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

  if (!isOpen || !data) return null;

  // 이미지 저장 기능
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
      <div style={{ backgroundColor: '#fff', color: '#000', borderRadius: 8, overflow: 'hidden', maxWidth: 600, width: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* 🟢 이미지로 저장될 영역 */}
        <div ref={printRef} style={{ padding: 20, backgroundColor: '#fff', overflowY: 'auto' }}>
          <h2 style={{ textAlign: 'center', borderBottom: '2px solid #333', paddingBottom: 10, marginBottom: 20 }}>
            {year}년 {month}월 급여 명세서
          </h2>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontWeight: 'bold' }}>
            <span>이름: {data.name}</span>
            <span>지급액: {data.finalPay.toLocaleString()}원</span>
          </div>

          {/* 일별 상세 내역 표 */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 20 }}>
            <thead>
              <tr style={{ backgroundColor: '#eee', borderTop: '1px solid #000', borderBottom: '1px solid #000' }}>
                <th style={thStyle}>날짜</th>
                <th style={thStyle}>출근</th>
                <th style={thStyle}>퇴근</th>
                <th style={thStyle}>시간</th>
                <th style={thStyle}>일급</th>
              </tr>
            </thead>
            <tbody>
              {data.dailyLogs.map((log: any, idx: number) => (
                <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={tdStyle}>{log.date}</td>
                  <td style={tdStyle}>{log.startTime}</td>
                  <td style={tdStyle}>{log.endTime}</td>
                  <td style={tdStyle}>{log.hours}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{log.pay.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 급여 합계 요약 */}
          <div style={{ border: '1px solid #333', padding: 10, borderRadius: 4 }}>
            <div style={rowStyle}><span>기본급</span> <span>{data.basePay.toLocaleString()}원</span></div>
            {data.weeklyHolidayPay > 0 && <div style={rowStyle}><span>+ 주휴수당</span> <span>{data.weeklyHolidayPay.toLocaleString()}원</span></div>}
            {data.nightPay > 0 && <div style={rowStyle}><span>+ 야간수당</span> <span>{data.nightPay.toLocaleString()}원</span></div>}
            <hr style={{ margin: '8px 0' }} />
            <div style={rowStyle}><span>세전 총액</span> <span>{data.totalPay.toLocaleString()}원</span></div>
            <div style={{ ...rowStyle, color: 'salmon' }}><span>- 공제(세금 등)</span> <span>{data.taxDetails.total.toLocaleString()}원</span></div>
            <hr style={{ margin: '8px 0', borderTop: '2px solid #333' }} />
            <div style={{ ...rowStyle, fontSize: 18, fontWeight: 'bold', color: 'blue' }}>
              <span>실수령액</span> <span>{data.finalPay.toLocaleString()}원</span>
            </div>
          </div>
          
          <div style={{ marginTop: 20, textAlign: 'center', color: '#888', fontSize: 11 }}>
            * 위 내용은 근로기준법 및 매장 설정에 따라 계산되었습니다.
          </div>
        </div>

        {/* 버튼 영역 (저장 안 됨) */}
        <div style={{ padding: 16, backgroundColor: '#f5f5f5', borderTop: '1px solid #ddd', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '10px 20px', background: '#999', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>닫기</button>
          <button onClick={handleSaveImage} style={{ padding: '10px 20px', background: 'seagreen', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>
            이미지로 저장 (카톡 전송용)
          </button>
        </div>
      </div>
    </div>
  );
}

const thStyle = { padding: '8px', textAlign: 'center' as const, fontWeight: 'bold' };
const tdStyle = { padding: '8px', textAlign: 'center' as const };
const rowStyle = { display: 'flex', justifyContent: 'space-between', marginBottom: 4 };