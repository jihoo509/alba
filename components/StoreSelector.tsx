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
   
  // ✅ 모바일 드롭다운 관련 상태
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentStore = stores.find(s => s.id === currentStoreId);
  const currentStoreName = currentStore ? currentStore.name : '매장 선택';

  // 외부 클릭 시 드롭다운 닫기 (모바일용)
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

  // 모바일 목록에서 매장 선택 시
  const handleMobileSelect = (storeId: string) => {
    onChangeStore(storeId);
    setIsDropdownOpen(false);
  };

  // 모바일 목록 내 삭제 버튼 클릭 시
  const handleMobileDelete = (e: React.MouseEvent, storeId: string) => {
    e.stopPropagation(); // 드롭다운 닫힘 방지
    onDeleteStore(storeId);
  };

  return (
    <div className="store-selector-wrapper">
      <style jsx>{`
        /* =========================================
           📱 모바일 스타일
           ========================================= */
        .store-selector-wrapper {
          width: 100%;
          margin-bottom: 10px;
          position: relative;
          z-index: 20;
        }

        /* 모바일 메인 바 */
        .mobile-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: #333;
          border-radius: 8px;
          padding: 12px 16px;
          border: 1px solid #444;
          color: #fff;
          cursor: pointer;
        }
        .store-name {
          font-size: 16px;
          font-weight: bold;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 60%;
        }
        .right-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .mobile-add-btn {
          background: #555;
          border: 1px solid #666;
          color: #fff;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }
        .arrow-icon {
          font-size: 12px;
          color: #aaa;
        }

        /* 모바일 드롭다운 목록 */
        .dropdown-list {
          position: absolute;
          top: 100%;
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
          justify-content: space-between;
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
        .list-del-btn {
          background: #ffecec;
          border: 1px solid #ffcccc;
          color: #e74c3c;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }

        /* PC 컨테이너 기본 숨김 */
        .pc-container { display: none; }


        /* =========================================
           💻 PC 화면 (768px 이상) - 높이 대폭 축소
           ========================================= */
        @media (min-width: 768px) {
          .store-selector-wrapper {
            display: flex;
            justify-content: center;
            /* 👇 여백 대폭 삭제 (기존 30px -> 0px) */
            margin-bottom: 0px; 
          }
          
          /* 모바일 요소 숨김 */
          .mobile-bar, .dropdown-list { display: none; }

          /* PC 요소 보임 */
          .pc-container {
            display: flex;
            flex-direction: row;
            align-items: center;
            width: auto;
            background-color: rgba(255, 255, 255, 0.1);
            /* 👇 패딩 축소 (기존 12px -> 6px) 높이를 줄임 */
            padding: 6px 24px; 
            border-radius: 50px;
            border: none;
            gap: 12px;
          }
          .pc-label {
            display: block;
            color: #fff;
            font-weight: bold;
            font-size: 15px; /* 폰트 살짝 조정 */
            margin: 0;
          }
          .select-box {
            width: 260px;
            /* 👇 셀렉트 박스 내부 패딩도 축소 */
            padding: 4px 8px; 
            font-size: 15px;
            border: 1px solid #666;
            background-color: #222;
            border-radius: 6px;
            text-align: center;
            text-align-last: center;
            cursor: pointer;
            color: #fff;
            appearance: auto;
          }
          .pc-action-area {
            display: flex;
            gap: 12px;
            align-items: center;
          }
          .pc-add-btn {
            background: none;
            border: none;
            font-size: 15px; 
            font-weight: bold;
            color: #fff;
            opacity: 0.8;
            cursor: pointer;
            padding: 0;
          }
          .pc-add-btn:hover { opacity: 1; }
          
          .pc-del-btn {
            background: #e74c3c;
            border: none;
            color: #fff;
            padding: 4px 10px; /* 버튼 패딩도 축소 */
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
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
              padding: '8px', /* 입력창 높이도 살짝 줄임 */
              borderRadius: '6px',
              border: '1px solid #ddd',
              flex: 1,
              maxWidth: '300px',
              fontSize: '14px'
            }}
          />
          <button
            onClick={handleAddClick}
            style={{ padding: '8px 14px', background: 'dodgerblue', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
          >
            확인
          </button>
          <button
            onClick={() => setIsAdding(false)}
            style={{ padding: '8px 14px', background: '#666', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}
          >
            취소
          </button>
        </div>
      ) : (
        <>
          {/* 📱 [모바일] 커스텀 드롭다운 */}
          <div ref={dropdownRef} style={{ width: '100%' }}>
            <div className="mobile-bar" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              <span className="store-name">{currentStoreName}</span>
              <div className="right-group">
                <button 
                    className="mobile-add-btn" 
                    onClick={(e) => { e.stopPropagation(); setIsAdding(true); }}
                >
                    + 추가
                </button>
                <span className="arrow-icon">{isDropdownOpen ? '▲' : '▼'}</span>
              </div>
            </div>

            {isDropdownOpen && (
              <div className="dropdown-list">
                {stores.map(store => (
                  <div 
                    key={store.id} 
                    className={`list-item ${store.id === currentStoreId ? 'active' : ''}`}
                    onClick={() => handleMobileSelect(store.id)}
                  >
                    <span>{store.name}</span>
                    <button 
                        className="list-del-btn"
                        onClick={(e) => handleMobileDelete(e, store.id)}
                    >
                        삭제
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 💻 [PC] 높이 축소된 컨테이너 */}
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