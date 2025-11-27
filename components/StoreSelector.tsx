'use client';

import React, { useState } from 'react';

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
  const [newStoreName, setNewStoreName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) return;
    await onCreateStore(newStoreName);
    setNewStoreName('');
    setShowCreateForm(false);
  };

  const currentStoreName = stores.find((s) => s.id === currentStoreId)?.name;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      
      {/* 1. 드롭다운 */}
      {stores.length > 0 && (
        <select
          value={currentStoreId ?? ''}
          onChange={(e) => onChangeStore(e.target.value)}
          style={{
            padding: '8px 12px',
            minWidth: 180,
            color: '#fff',
            backgroundColor: '#333',
            border: '1px solid #555',
            borderRadius: 6,
            height: 40,
            fontSize: 15,
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name}
            </option>
          ))}
        </select>
      )}

      {/* 2. 매장 추가 버튼 */}
      <button
        type="button"
        onClick={() => setShowCreateForm((prev) => !prev)}
        style={{
          padding: '0 12px',
          height: 40,
          border: '1px solid #555',
          background: showCreateForm ? '#555' : '#222',
          color: '#fff',
          cursor: 'pointer',
          fontSize: 14,
          borderRadius: 6,
          display: 'flex', alignItems: 'center', gap: 4
        }}
      >
        {showCreateForm ? '닫기' : '+ 매장 추가'}
      </button>

      {/* 3. 매장 삭제 버튼 (빨간색) */}
      {currentStoreId && !showCreateForm && (
        <button
          type="button"
          onClick={() => onDeleteStore(currentStoreId)}
          style={{
            padding: '0 12px',
            height: 40,
            background: '#c0392b',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 'bold'
          }}
        >
          매장 삭제
        </button>
      )}

      {/* 4. 현재 매장 표시 텍스트 (한 줄에 배치) */}
      {currentStoreId && !showCreateForm && (
        <div style={{ fontSize: 20, color: '#ddd', marginLeft: 4, fontWeight: 'bold' }}>
           현재: <span style={{ color: '#c72d41ff' }}>{currentStoreName}</span>
        </div>
      )}

      {/* 매장 추가 폼 (토글) */}
      {showCreateForm && (
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            placeholder="매장 이름"
            value={newStoreName}
            onChange={(e) => setNewStoreName(e.target.value)}
            style={{
              padding: '0 12px',
              height: 40,
              minWidth: 160,
              color: '#000',
              borderRadius: 6,
              border: 'none',
              outline: 'none'
            }}
            autoFocus
          />
          <button
            type="submit"
            disabled={creatingStore}
            style={{
              padding: '0 16px',
              height: 40,
              background: 'seagreen',
              color: '#fff',
              border: 0,
              cursor: 'pointer',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 'bold',
              whiteSpace: 'nowrap'
            }}
          >
            {creatingStore ? '...' : '확인'}
          </button>
        </form>
      )}
    </div>
  );
}