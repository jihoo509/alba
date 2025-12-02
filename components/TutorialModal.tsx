'use client';

import React, { useState, useEffect } from 'react';

export type TutorialStep = {
  title: string;
  description: string;
  image?: string; // 이미지는 선택 사항 (없으면 안 나옴)
};

type Props = {
  tutorialKey: string; // 로컬 스토리지 저장 키 (예: 'seen_dashboard_tutorial')
  steps: TutorialStep[]; // 단계별 내용 리스트
  onClose?: () => void;
};

export default function TutorialModal({ tutorialKey, steps, onClose }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // 1. 브라우저 저장소(Local Storage) 확인
    const hasSeen = localStorage.getItem(tutorialKey);
    // 2. 본 적 없으면 팝업 띄우기
    if (!hasSeen) {
      setIsOpen(true);
    }
  }, [tutorialKey]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    // 3. "봤음" 도장 찍기
    localStorage.setItem(tutorialKey, 'true');
    setIsOpen(false);
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  const stepData = steps[currentStep];

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div style={{
        backgroundColor: '#fff', width: '90%', maxWidth: '400px',
        borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        animation: 'fadeIn 0.3s ease-out'
      }}>
        
        {/* 이미지 영역 (이미지가 없으면 회색 박스로 대체) */}
        <div style={{ 
            width: '100%', height: '200px', backgroundColor: '#f0f0f0', 
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            borderBottom: '1px solid #eee'
        }}>
          {stepData.image ? (
            <img src={stepData.image} alt="설명" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <span style={{ color: '#aaa', fontSize: '14px' }}>이미지 영역 ({currentStep + 1}/{steps.length})</span>
          )}
        </div>

        {/* 텍스트 영역 */}
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', color: '#333' }}>{stepData.title}</h3>
          <p style={{ margin: 0, fontSize: '15px', color: '#666', lineHeight: '1.6', wordBreak: 'keep-all' }}>
            {stepData.description}
          </p>
        </div>

        {/* 하단 버튼 (이전 / 다음) */}
        <div style={{ display: 'flex', padding: '16px 24px 24px 24px', gap: '10px' }}>
          {currentStep > 0 && (
            <button onClick={handlePrev} style={btnSecondary}>이전</button>
          )}
          <button onClick={handleNext} style={btnPrimary}>
            {currentStep === steps.length - 1 ? '시작하기 🚀' : '다음'}
          </button>
        </div>
        
        {/* 단계 표시 점 */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', paddingBottom: '20px' }}>
            {steps.map((_, idx) => (
                <div key={idx} style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    backgroundColor: idx === currentStep ? 'dodgerblue' : '#ddd',
                    transition: 'background-color 0.3s'
                }}></div>
            ))}
        </div>

      </div>
    </div>
  );
}

// 간단 스타일
const btnPrimary = { flex: 1, padding: '12px', backgroundColor: 'dodgerblue', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' };
const btnSecondary = { flex: 1, padding: '12px', backgroundColor: '#f5f5f5', color: '#555', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' };