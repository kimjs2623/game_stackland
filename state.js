// state.js

// 게임의 전체 상태를 담아두는 전역 객체입니다.
window.state = {
    mode: 'single', 
    roomId: null, 
    myPlayerId: null, 
    turnCount: 1, 
    money: 0, 
    stacks: [], 
    sharedPool: [], 
    displayPool: [], 
    draggingStack: null, 
    market: {}, 
    newsHistory: [], 
    unlockedSpecialty: null, 
    playerIds: [], 
    playersData: {}, 
    viewingOpponent: false, 
    viewingPlayerId: null, 
    maxTurns: 50,
    prof: { 
      farming: { lv: 1, exp: 0 }, 
      mining: { lv: 1, exp: 0 }, 
      woodcraft: { lv: 1, exp: 0 }, 
      cooking: { lv: 1, exp: 0 }, 
      smithing: { lv: 1, exp: 0 } 
    },
    chat: [], 
    isChatOpen: false, 
    activeTrade: null, 
    localTradeOffer: { money: 0, items: [] }, 
    lastTradeTime: 0,
    isGameOver: false, 
    lastEventTitle: null,
    zoom: 1.0,
    tech: { tier_2: false, steel_upgrade: false, warehouse: false },
    warehouseItems: {},
    activeQuest: null,
    questTimer: 0
  };
  
  // 드래그 기능과 스택 관리를 위한 글로벌 변수입니다.
  window.nextStackId = 1; 
  window.unsubSnapshot = null; 
  window.dragData = null;