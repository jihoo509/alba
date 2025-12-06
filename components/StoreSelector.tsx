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
        /* 📱 모바일 스타일 (어두운 바 안에 모두 포함) */
        .store-selector-wrapper {
          width: 100%;
          margin-bottom: 10px;
        }
        .container {
          display: flex;
          flex-direction: row; /* 가로 배치 */
          align-items: center;
          justify-content: space-between;
          background-color: #333; /* 어두운 배경 */
          border-radius: 8px;
          padding: 8px 12px;
          border: 1px solid #444;
        }
        .pc-label {
          display: none;
        }
        /* 선택 박스 (배경 투명, 글자 흰색) */
        .select-box {
          flex: 1;
          width: 100%;
          background-color: transparent;
          color: #fff;
          border: none;
          font-size: 16px;
          font-weight: bold;
          outline: none;
          padding: 4px 0;
          cursor: pointer;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          /* 기본 화살표 스타일링 (브라우저마다 다름) */
          appearance: none; 
          background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
          background-repeat: no-repeat;
          background-position: right 0px top 50%;
          background-size: 10px auto;
          padding-right: 20px; /* 화살표 공간 확보 */
        }
        /* 옵션 배경은 어둡게 (안 그러면 흰 배경에 흰 글씨 됨) */
        .select-box option {
          background-color: #333;
          color: #fff;
        }

        .action-area {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-left: 12px;
          flex-shrink: 0;
        }
        /* 모바일용 버튼 스타일 (작고 심플하게) */
        .add-btn {
          background: #555;
          border: 1px solid #666;
          color: #fff;
          padding: 6px 10px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          white-space: nowrap;
        }
        .del-btn {
          background: #e74c3c;
          border: none;
          color: #fff;
          padding: 6px 10px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          white-space: nowrap;
        }

        /* 💻 PC 화면 스타일 재정의 (기존 유지) */
        @media (min-width: 768px) {
          .store-selector-wrapper {
            display: flex;
            justify-content: center;
            margin-bottom: 30px;
          }
          .container {
            width: auto;
            background-color: rgba(255, 255, 255, 0.1);
            padding: 12px 30px;
            border-radius: 50px;
            border: none;
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
            flex: none;
            width: 280px;
            padding: 8px 12px;
            font-size: 15px;
            border: 1px solid #666;
            background-color: #222;
            border-radius: 8px;
            text-align: center;
            text-align-last: center;
            background-image: none; /* PC는 기본 화살표 사용 */
            padding-right: 12px;
            appearance: auto;
          }
          .action-area {
            gap: 16px;
            margin-left: 0;
          }
          /* PC용 버튼 스타일 (텍스트 형태) */
          .add-btn {
            background: none;
            border: none;
            font-size: 16px; 
            font-weight: bold;
            padding: 0;
            opacity: 0.8;
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