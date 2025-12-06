'use client';

import React, { useState, useEffect, useRef } from 'react';

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
  
  // ✅ [추가] 모바일용 드롭다운 열림/닫힘 상태
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // 드롭다운 외부 클릭 감지용 Ref
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 현재 선택된 매장 이름 찾기
  const currentStore = stores.find(s => s.id === currentStoreId);
  const currentStoreName = currentStore ? currentStore.name : '매장 선택';

  // 외부 클릭 시 드롭다운 닫기 로직
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddClick = () => {
    if (newStoreName.trim()) {
      onCreateStore(newStoreName);
      setNewStoreName('');
      setIsAdding(false);
    }
  };

  // ✅ [중요] 매장 삭제 버튼 클릭 핸들러
  const handleDeleteClick = (e: React.MouseEvent, storeId: string) => {
    e.stopPropagation(); // 💥 핵심: 삭제 버튼 누를 때 매장 선택이 되지 않게 막음
    onDeleteStore(storeId);
  };

  const handleSelectStore = (storeId: string) => {
    onChangeStore(storeId);
    setIsDropdownOpen(false); // 선택 후 바로 닫기
  };

  return (
    <div className="store-selector-wrapper">
      <style jsx>{`
        /* 📱 모바일 스타일: 직접 만든 드롭다운 */
        .store-selector-wrapper {
          width: 100%;
          margin-bottom: 10px;
          position: relative; /* 드롭다운 위치 기준 */
          z-index: 20; /* 다른 요소보다 위에 뜨게 */
        }
        
        /* 1. 평소 보이는 바 (어두운 배경) */
        .mobile-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: #333;
          border-radius: 8px;
          padding: 10px 16px;
          border: 1px solid #444;
          color: #fff;
          cursor: pointer;
        }
        .store-name {
          font-size: 16px;
          font-weight: bold;
        }
        .arrow-icon {
          font-size: 12px;
          color: #aaa;
        }

        /* 2. 매장 추가 버튼 (바 오른쪽 안) */
        .mobile-add-btn {
          background: #555;
          border: 1px solid #666;
          color: #fff;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          margin-left: 10px;
          cursor: pointer;
        }

        /* 3. 열리는 목록 상자 (커스텀 드롭다운) */
        .dropdown-list {
          position: absolute;
          top: 100%; /* 바 바로 아래 */
          left: 0;
          width: 100%;
          background-color: #fff;
          border: 1px solid #ddd;
          border-radius: 8px;
          margin-top: 4px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          overflow: hidden;
          z-index: 30;
        }
        .list-item {
          padding: 12px 16px;
          border-bottom: 1px solid #f0f0f0;
          color: #333;
          font-size: 15px;
          display: flex;
          justify-content: space-between; /* 이름과 삭제버튼 양끝 정렬 */
          align-items: center;
          cursor: pointer;
        }
        .list-item:last-child {
          border-bottom: none;
        }
        .list-item.active {
          background-color: #f0f9ff;
          color: dodgerblue;
          font-weight: bold;
        }
        
        /* 목록 내 삭제 버튼 */
        .list-del-btn {
          background: #ffecec;
          border: 1px solid #ffcccc;
          color: #e74c3c;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }

        /* PC용 요소들 (모바일에서 숨김) */
        .pc-container { display: none; }

        /* 💻 PC 화면 (768px 이상) 스타일 재정의 */
        @media (min-width: 768px) {
          .store-selector-wrapper {
            display: flex;
            justify-content: center;
            margin-bottom: 30px;
          }
          /* 모바일 요소 숨김 */
          .mobile-bar, .dropdown-list { display: none; }

          /* PC 컨테이너 보임 */
          .pc-container {
            display: flex;
            flex-direction: row;
            align-items: center;
            width: auto;
            background-color: rgba(255, 255, 255, 0.1);
            padding: 12px 30px;
            border-radius: 50px;
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
            border-radius: 8px;
            color: #fff;
          }
          .pc-action-area {
            display: flex;
            gap: 16px;
            align-items: center;
          }
          .pc-add-btn {
            background: none;
            border: none;
            font-size: 16px; 
            font-weight: bold;
            color: #fff;
            text-decoration: none;
            opacity: 0.8;
            cursor: pointer;
          }
          .pc-add-btn:hover { opacity: 1; }
          .pc-del-btn {
            background: #e74c3c;
            border: none;
            color: #fff;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
          }
        }
      `}</style>

      {/* --- [공통] 매장 추가 모드 --- */}
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
            style={{ padding: '10px 16px', background: 'dodgerblue', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            확인
          </button>
          <button
            onClick={() => setIsAdding(false)}
            style={{ padding: '10px 16px', background: '#666', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            취소
          </button>
        </div>
      ) : (
        <>
          {/* 📱 [모바일] 커스텀 드롭다운 */}
          <div ref={dropdownRef} style={{ width: '100%' }}>
            {/* 1. 닫혀있을 때 보이는 바 */}
            <div className="mobile-bar" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                <span className="store-name">{currentStoreName}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {/* 매장 추가 버튼은 항상 보이게 */}
                <button 
                    className="mobile-add-btn" 
                    onClick={(e) => { e.stopPropagation(); setIsAdding(true); }}
                >
                    + 추가
                </button>
                <span className="arrow-icon" style={{ marginLeft: 10 }}>
                    {isDropdownOpen ? '▲' : '▼'}
                </span>
              </div>
            </div>

            {/* 2. 열렸을 때 보이는 목록 */}
            {isDropdownOpen && (
              <div className="dropdown-list">
                {stores.map(store => (
                  <div 
                    key={store.id} 
                    className={`list-item ${store.id === currentStoreId ? 'active' : ''}`}
                    onClick={() => handleSelectStore(store.id)}
                  >
                    <span>{store.name}</span>
                    
                    {/* 🗑️ 삭제 버튼 (목록 안에 포함) */}
                    <button 
                        className="list-del-btn"
                        onClick={(e) => handleDeleteClick(e, store.id)}
                    >
                        삭제
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 💻 [PC] 기존 디자인 유지 */}
          <div className="pc-container">
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
            <div className="pc-action-area">
              <button onClick={() => setIsAdding(true)} className="pc-add-btn">
                + 매장 추가
              </button>
              {currentStoreId && (
                <button onClick={() => onDeleteStore(currentStoreId)} className="pc-del-btn">
                  삭제
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}