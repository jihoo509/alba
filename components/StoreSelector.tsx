'use client';

import React, { useState } from 'react';

type Store = { id: string; name: string };

type Props = {
  stores: Store[];
  currentStoreId: string | null;
  onChangeStore: (storeId: string) => void;
  creatingStore: boolean;
  onCreateStore: (name: string) => void;
  onDeleteStore: (storeId: string) => void;
};

export function StoreSelector({
  stores,
  currentStoreId,
  onChangeStore,
  creatingStore, // (상위에서 안 쓰면 무시 가능)
  onCreateStore,
  onDeleteStore,
}: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');

  const handleAddClick = () => {
    if (newStoreName.trim()) {
      onCreateStore(newStoreName);
      setNewStoreName('');
      setIsAdding(false);
    }
  };

  return (
    <div className="store-selector-wrapper">
      <style jsx>{`
        /* 📱 모바일 기본 스타일 (기존 유지) */
        .store-selector-wrapper {
          width: 100%;
          margin-bottom: 20px;
        }
        .container {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
        }
        .pc-label {
          display: none; /* 모바일에서는 숨김 */
        }
        .select-box {
          width: 100%;
          padding: 12px;
          font-size: 16px;
          border: 1px solid #444;
          background-color: #333;
          color: #fff;
          border-radius: 8px;
          outline: none;
        }
        .action-area {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .add-btn {
          background: none;
          border: none;
          color: #ccc;
          cursor: pointer;
          font-size: 13px;
          text-decoration: underline;
        }
        .del-btn {
          background: #e74c3c;
          border: none;
          color: #fff;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        /* 💻 PC 화면 (768px 이상) 스타일 재정의 */
        @media (min-width: 768px) {
          .store-selector-wrapper {
            display: flex;
            justify-content: center; /* 중앙 정렬 */
            margin-bottom: 30px;
          }
          .container {
            flex-direction: row; /* 가로 배치 */
            align-items: center;
            width: auto; /* 내용물 크기만큼만 */
            background-color: rgba(255, 255, 255, 0.1); /* 살짝 배경 깔기 */
            padding: 8px 20px;
            border-radius: 50px; /* 둥글게 */
          }
          .pc-label {
            display: block;
            color: #fff;
            font-weight: bold;
            margin-right: 12px;
            font-size: 15px;
            white-space: nowrap;
          }
          .select-box {
            width: 250px; /* 너비 고정 */
            padding: 8px 12px;
            font-size: 14px;
            border: 1px solid #666;
            background-color: #222;
          }
          .action-area {
            gap: 12px;
            margin-left: 12px;
          }
        }
      `}</style>

      {isAdding ? (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', width: '100%' }}>
          <input
            autoFocus
            type="text"
            placeholder="새 매장 이름"
            value={newStoreName}
            onChange={(e) => setNewStoreName(e.target.value)}
            style={{
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              flex: 1,
              maxWidth: '300px'
            }}
          />
          <button
            onClick={handleAddClick}
            style={{
              padding: '10px 16px',
              background: 'dodgerblue',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            확인
          </button>
          <button
            onClick={() => setIsAdding(false)}
            style={{
              padding: '10px 16px',
              background: '#666',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            취소
          </button>
        </div>
      ) : (
        <div className="container">
          {/* PC에서만 보이는 텍스트 */}
          <span className="pc-label">현재 관리 중인 매장:</span>

          <select
            className="select-box"
            value={currentStoreId || ''}
            onChange={(e) => onChangeStore(e.target.value)}
          >
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                🏢 {s.name}
              </option>
            ))}
          </select>

          <div className="action-area">
            <button onClick={() => setIsAdding(true)} className="add-btn">
              + 매장 추가
            </button>
            {currentStoreId && (
              <button onClick={() => onDeleteStore(currentStoreId)} className="del-btn">
                삭제
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}