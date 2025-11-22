'use client';

import React, { useState } from 'react';

type Store = {
  id: string;
  name: string;
};

// ✅ onDeleteStore가 추가된 타입 정의
type StoreSelectorProps = {
  stores: Store[];
  currentStoreId: string | null;
  onChangeStore: (storeId: string) => void;
  creatingStore: boolean;
  onCreateStore: (storeName: string) => Promise<void> | void;
  onDeleteStore: (storeId: string) => void; // 👈 새로 추가됨
};

export function StoreSelector({
  stores,
  currentStoreId,
  onChangeStore,
  creatingStore,
  onCreateStore,
  onDeleteStore, // 👈 새로 추가됨
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

      {stores.length > 0 ? (
        <>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* 1. 매장 선택 드롭다운 */}
            <select
              value={currentStoreId ?? ''}
              onChange={(e) => onChangeStore(e.target.value)}
              style={{
                padding: 8,
                minWidth: 200,
                color: '#000',
                height: 40,
              }}
            >
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>

            {/* 2. 매장 추가 토글 버튼 */}
            <button
              type="button"
              onClick={() => setShowCreateForm((prev) => !prev)}
              style={{
                padding: '0 16px',
                height: 40,
                border: '1px solid #555',
                background: '#333',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 14,
                borderRadius: 4,
              }}
            >
              {showCreateForm ? '닫기' : '+ 매장 추가'}
            </button>

            {/* 3. ✅ 매장 삭제 버튼 (빨간색) */}
            {currentStoreId && (
              <button
                type="button"
                onClick={() => onDeleteStore(currentStoreId)}
                style={{
                  padding: '0 16px',
                  height: 40,
                  background: 'darkred',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: 4,
                  fontSize: 14,
                  marginLeft: 'auto', // 우측 끝으로 밀기
                }}
              >
                매장 삭제
              </button>
            )}
          </div>

          <div style={{ marginTop: 8, fontSize: 14, color: '#aaa' }}>
            현재 선택된 매장:{' '}
            <strong style={{ color: '#fff' }}>
              {stores.find((s) => s.id === currentStoreId)?.name ?? '-'}
            </strong>
          </div>
        </>
      ) : (
        <p style={{ fontSize: 14, marginBottom: 8, color: '#aaa' }}>
          아직 등록된 매장이 없습니다. 아래 버튼을 눌러 첫 매장을 생성해주세요.
        </p>
      )}

      {/* 매장 없을 때나 토글 열렸을 때 보이는 입력 폼 */}
      {(showCreateForm || stores.length === 0) && (
        <form
          onSubmit={handleSubmit}
          style={{
            marginTop: 12,
            padding: 16,
            border: '1px solid #444',
            borderRadius: 8,
            backgroundColor: '#222',
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
              flex: 1,
              minWidth: 200,
              color: '#000',
            }}
          />
          <button
            type="submit"
            disabled={creatingStore}
            style={{
              padding: '8px 16px',
              background: 'seagreen',
              color: '#fff',
              border: 0,
              cursor: 'pointer',
              borderRadius: 4,
              fontSize: 14,
              whiteSpace: 'nowrap',
            }}
          >
            {creatingStore ? '생성 중...' : '확인'}
          </button>
        </form>
      )}

      <hr style={{ borderColor: '#333', marginTop: 24 }} />
    </div>
  );
}