'use client';

import React, { useState, useRef, useEffect } from 'react';

type Option = { value: string | number; label: string };

type Props = {
  value: string | number;
  options: Option[];
  onChange: (value: any) => void;
  placeholder?: string;
  width?: string | number;
};

export default function CustomSelect({ value, options, onChange, placeholder = '선택', width = '100%' }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find(o => o.value === value)?.label || placeholder;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', width: width }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '10px 12px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          backgroundColor: '#fff',
          cursor: 'pointer',
          fontSize: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: value ? '#333' : '#999',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          transition: 'all 0.2s'
        }}
      >
        <span>{selectedLabel}</span>
        <span style={{ fontSize: '10px', color: '#aaa', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 50,
          maxHeight: '200px', overflowY: 'auto'
        }}>
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              style={{
                padding: '10px 12px', fontSize: '14px', cursor: 'pointer',
                backgroundColor: value === opt.value ? '#f1f5f9' : '#fff',
                color: value === opt.value ? 'dodgerblue' : '#333',
                borderBottom: '1px solid #f8fafc'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = value === opt.value ? '#f1f5f9' : '#fff'}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}