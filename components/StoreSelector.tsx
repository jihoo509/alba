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
        /* 📱 모바일 기본 스타일 (완전 초기화 상태) */
        .store-selector-wrapper {
          width: 100%;
          margin-bottom: 20px;
        }
        /* 컨테이너: 모바일에서는 아무런 디자인 요소가 없어야 함 */
        .container {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
          padding: 0;
          background-color: transparent;
          border-radius: 0;
        }
        .pc-label {
          display: none;
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
        /* 버튼 영역: 모바일에서는 패딩 없이 양끝 정렬 */
        .action-area {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0; 
        }
        .add-btn {
          background: none;
          border: none;
          color: #ccc;
          cursor: pointer;
          font-size: 14px; /* 모바일 폰트 크기 */
          text-decoration: underline;
          padding: 0;
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
            justify-content: center;
            margin-bottom: 30px;
          }
          /* PC 전용 디자인 컨테이너 */
          .container {
            flex-direction: row;
            align-items: center;
            width: auto;
            background-color: rgba(255, 255, 255, 0.1); /* 둥근 배경 */
            padding: 12px 30px; /* 패딩 */
            border-radius: 50px; /* 둥근 모서리 */
            gap: 16px;
          }
          .pc-label {
            display: block;
            color: #fff;
            font-weight: bold;
            font-size: 16px;
            margin: 0;
          }
          .select-box {
            width: 280px;
            padding: 8px 12px;
            font-size: 15px;
            border: 1px solid #666;
            background-color: #222;
            text-align: center;
            text-align-last: center;
            cursor: pointer;
          }
          .action-area {
            gap: 16px;
            justify-content: flex-start;
          }
          /* PC에서는 버튼 스타일을 라벨과 통일 */
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
            text-decoration: none;
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