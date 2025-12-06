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
  creatingStore,
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
        /* 📱 모바일 기본 스타일 (꽉 찬 너비, 세로 배치) */
        .store-selector-wrapper {
          width: 100%;
          margin-bottom: 20px;
        }
        .container {
          display: flex;
          flex-direction: column; /* 모바일은 세로로 */
          gap: 10px;
          width: 100%;
        }
        .pc-label {
          display: none; /* 모바일에서는 라벨 숨김 */
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
          text-align: left; /* 모바일은 왼쪽 정렬이 국룰 */
        }
        .action-area {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 4px;
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
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
        }

        /* 💻 PC 화면 (768px 이상) 스타일 재정의 */
        @media (min-width: 768px) {
          .store-selector-wrapper {
            display: flex;
            justify-content: center; /* 화면 중앙 정렬 */
            margin-bottom: 30px;
          }
          .container {
            flex-direction: row; /* 가로 배치 */
            align-items: center;
            width: auto; /* 내용물 크기만큼만 */
            background-color: rgba(255, 255, 255, 0.1); /* 둥근 배경 */
            padding: 12px 30px;
            border-radius: 50px;
            gap: 16px;
          }
          .pc-label {
            display: block;
            color: #fff;
            font-weight: bold;
            font-size: 16px;
            white-space: nowrap;
            margin: 0;
          }
          .select-box {
            width: 280px; /* 적당한 고정 너비 */
            padding: 8px 12px;
            font-size: 15px;
            border: 1px solid #666;
            background-color: #222;
            text-align: center; /* 텍스트 가운데 정렬 */
            text-align-last: center; /* 크롬 등에서 강제 가운데 정렬 */
            cursor: pointer;
          }
          /* 드롭다운 옵션도 가운데 정렬 시도 (브라우저마다 다를 수 있음) */
          .select-box option {
            text-align: center;
          }

          .action-area {
            gap: 16px;
            padding: 0;
            justify-content: flex-start;
          }
          /* '+ 매장 추가' 버튼을 라벨과 똑같은 스타일로 변경 */
          .add-btn {
            font-size: 16px; 
            font-weight: bold;
            color: #fff;
            text-decoration: none;
            opacity: 0.8;
            transition: opacity 0.2s;
          }
          .add-btn:hover {
            opacity: 1;
          }
          .del-btn {
            font-size: 13px;
            padding: 6px 12px;
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
              maxWidth: '300px',
              fontSize: '15px'
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
          {/* PC용 라벨 */}
          <span className="pc-label">현재 관리 중인 매장:</span>

          <select
            className="select-box"
            value={currentStoreId || ''}
            onChange={(e) => onChangeStore(e.target.value)}
          >
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <div className="action-area">
            {/* PC에서는 라벨과 같은 스타일, 모바일에서는 작은 링크 스타일 */}
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