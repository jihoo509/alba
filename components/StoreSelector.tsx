'use client';

import React, { useState } from 'react';

type Store = {
  id: string;
  name: string;
};

type StoreSelectorProps = {
  stores: Store[];
  currentStoreId: string | null;
  onChangeStore: (storeId: string) => void;
  creatingStore: boolean;
  onCreateStore: (storeName: string) => Promise<void> | void;
};

export function StoreSelector({
  stores,
  currentStoreId,
  onChangeStore,
  creatingStore,
  onCreateStore,
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

  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 20, marginBottom: 8 }}>내 매장 선택</h2>

      {/* 매장 선택 드롭다운 */}
      {stores.length > 0 ? (
        <>
          <select
            value={currentStoreId ?? ''}
            onChange={(e) => onChangeStore(e.target.value)}
            style={{
              padding: 8,
              minWidth: 260,
              color: '#000',
              marginBottom: 8,
            }}
          >
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>

          <div style={{ marginBottom: 8, fontSize: 14 }}>
            현재 선택된 매장:{' '}
            <strong>
              {stores.find((s) => s.id === currentStoreId)?.name ?? '-'}
            </strong>
          </div>
        </>
      ) : (
        <p style={{ fontSize: 14, marginBottom: 8 }}>
          아직 등록된 매장이 없습니다. 아래에서 첫 매장을 생성해주세요.
        </p>
      )}

      {/* 매장 추가 토글 버튼 */}
      <button
        type="button"
        onClick={() => setShowCreateForm((prev) => !prev)}
        style={{
          padding: '6px 12px',
          border: '1px solid #555',
          background: 'transparent',
          color: '#fff',
          cursor: 'pointer',
          fontSize: 13,
          borderRadius: 4,
          marginTop: 4,
        }}
      >
        {showCreateForm ? '매장 추가 닫기' : '새 매장 추가하기'}
      </button>

      {/* 매장 추가 폼 */}
      {showCreateForm && (
        <form
          onSubmit={handleSubmit}
          style={{
            marginTop: 12,
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            placeholder="매장 이름 (예: 광주 수완 1호점)"
            value={newStoreName}
            onChange={(e) => setNewStoreName(e.target.value)}
            style={{
              padding: 8,
              minWidth: 260,
              color: '#000',
            }}
          />
          <button
            type="submit"
            disabled={creatingStore}
            style={{
              padding: '8px 14px',
              background: 'seagreen',
              color: '#fff',
              border: 0,
              cursor: 'pointer',
              borderRadius: 4,
              fontSize: 13,
            }}
          >
            {creatingStore ? '생성 중...' : '매장 생성'}
          </button>
        </form>
      )}

      <hr style={{ borderColor: '#333', marginTop: 20 }} />
    </div>
  );
}
