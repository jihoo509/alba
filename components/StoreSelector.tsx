'use client';

import React, { useState, useRef, useEffect } from 'react';

type Store = { id: string; name: string; };

type StoreSelectorProps = {
  stores: Store[];
  currentStoreId: string | null;
  onChangeStore: (storeId: string) => void;
  creatingStore: boolean;
  onCreateStore: (storeName: string) => Promise<void> | void;
  onDeleteStore: (storeId: string) => void;
};

export function StoreSelector({
  stores,
  currentStoreId,
  onChangeStore,
  creatingStore,
  onCreateStore,
  onDeleteStore,
}: StoreSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  // 드롭다운 바깥을 클릭했을 때 닫히게 하기 위한 ref
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 감지 로직
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsAdding(false); // 입력 중이었으면 닫기
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (id: string) => {
    onChangeStore(id);
    setIsOpen(false); // ✅ 선택 즉시 드롭다운 닫기
  };

  const handleAddSubmit = async () => {
    if (newStoreName.trim()) {
      await onCreateStore(newStoreName);
      setNewStoreName('');
      setIsAdding(false);
      setIsOpen(false); // 생성 후 닫기
    }
  };

  const currentStoreName = stores.find((s) => s.id === currentStoreId)?.name || '매장 선택';

  return (
    <div style={{ position: 'relative', width: '100%', marginBottom: 12 }} ref={dropdownRef}>
      
      {/* 1. 메인 버튼 (현재 선택된 매장 표시) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '12px 16px',
          height: '50px',
          backgroundColor: '#333',
          border: '1px solid #555',
          borderRadius: '8px',
          color: '#fff',
          fontSize: '16px',
          fontWeight: 'bold',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          outline: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🏢</span>
            <span>{currentStoreName}</span>
        </div>
        <span style={{ fontSize: '12px', color: '#aaa' }}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {/* 2. 드롭다운 리스트 (isOpen일 때만 표시) */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '110%', // 버튼 바로 아래
          left: 0,
          width: '100%',
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          zIndex: 9999,
          overflow: 'hidden',
          border: '1px solid #ddd'
        }}>
          
          {/* 매장 목록 스크롤 영역 */}
          <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
            {stores.map((store) => (
              <div
                key={store.id}
                onClick={() => handleSelect(store.id)}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #f0f0f0',
                  color: '#333',
                  fontSize: '15px',
                  cursor: 'pointer',
                  backgroundColor: store.id === currentStoreId ? '#f0f9ff' : '#fff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontWeight: store.id === currentStoreId ? 'bold' : 'normal' }}>
                  {store.name}
                </span>
                
                {/* 삭제 버튼 (리스트 내부에 배치) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // 부모 클릭(선택) 방지
                    onDeleteStore(store.id);
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    color: '#fff',
                    backgroundColor: '#e74c3c', // 빨간색
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>

          {/* 매장 추가 영역 (하단 고정) */}
          <div style={{ padding: '10px', backgroundColor: '#fafafa', borderTop: '1px solid #eee' }}>
            {isAdding ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  autoFocus
                  type="text"
                  placeholder="새 매장 이름"
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}
                />
                <button
                  onClick={handleAddSubmit}
                  disabled={creatingStore}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: 'seagreen',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  확인
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAdding(true)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#333',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                + 새 매장 추가하기
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}