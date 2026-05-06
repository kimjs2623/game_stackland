// flow.js
import { SPECIALTY_OPTIONS_ALL } from './data.js';

// 싱글 플레이 시작
window.startGame = function(mode) {
    document.getElementById('screen-menu').classList.add('hidden');
    if (mode === 'single') { window.state.mode = 'single'; window.initGame(); }
};

window.initGame = function() {
    const sTurnsInput = document.getElementById('single-max-turns-input');
    window.state.maxTurns = sTurnsInput ? parseInt(sTurnsInput.value) || 50 : 50;
    window.state.turnCount = 1; window.state.money = 0; window.state.stacks = []; window.nextStackId = 1; window.state.viewingOpponent = false; 
    window.state.isGameOver = false; window.state.lastEventTitle = null;
    window.state.prof = { farming: {lv:1,exp:0}, mining: {lv:1,exp:0}, woodcraft: {lv:1,exp:0}, cooking: {lv:1,exp:0}, smithing: {lv:1,exp:0} };
    window.state.tech = { tier_2: false, steel_upgrade: false, warehouse: false };
    window.state.warehouseItems = {}; window.state.activeQuest = null;
    
    if(window.initMarket) window.initMarket();
    
    const poolItems = ['wood', 'stone', 'seed', 'water', 'fire'];
    const fullPool = Array.from({length: 200}, () => poolItems[Math.floor(Math.random() * poolItems.length)]);
    window.state.sharedPool = fullPool.slice(4); window.state.displayPool = fullPool.slice(0, 4);

    window.spawnInitialResources(); 
    if(window.evaluatePool) window.evaluatePool(); 
    if(window.renderAll) window.renderAll(); 
    if(window.showScreen) window.showScreen('screen-game'); 
    window.showSpecialtySelector();
};

window.spawnInitialResources = function() {
    const cx = 1200; const cy = 800;
    const starts = ['wood', 'stone', 'seed', 'water', 'fire', 'villager'];
    starts.forEach((id, idx) => {
       const angle = (idx / starts.length) * Math.PI * 2; const r = 120;
       window.state.stacks.push({ id: `s${window.nextStackId++}`, x: cx + Math.cos(angle)*r - 30, y: cy + Math.sin(angle)*r - 50, cards: [id], crafting: null });
    });
};

window.showSpecialtySelector = function() {
    const m = document.getElementById('modal-specialty'); const c = document.getElementById('specialty-options');
    if(!m || !c) return;
    const randomOptions = [...SPECIALTY_OPTIONS_ALL].sort(() => 0.5 - Math.random()).slice(0, 3);
    c.innerHTML = randomOptions.map(opt => `
      <div onclick="window.selectSpecialty('${opt.id}')" class="bg-slate-800/80 hover:bg-slate-700/90 border-2 border-slate-600 hover:border-amber-400 p-8 rounded-3xl cursor-pointer transition-all transform hover:-translate-y-2 flex flex-col items-center shadow-xl group">
        ${opt.icon} <h3 class="text-2xl font-black text-amber-300 mb-2 group-hover:text-amber-200">${opt.name}</h3>
        <p class="text-slate-300 text-sm font-bold text-center leading-relaxed">${opt.desc}</p>
      </div>`).join('');
    m.classList.remove('hidden'); m.classList.add('flex');
    setTimeout(() => { m.classList.remove('opacity-0'); m.children[0].classList.remove('scale-95'); }, 10);
};

window.selectSpecialty = function(id) {
    window.state.unlockedSpecialty = id;
    const modal = document.getElementById('modal-specialty');
    if(modal) {
        modal.classList.add('opacity-0'); modal.children[0].classList.add('scale-95');
        setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); }, 300);
    }
    if(window.notify) window.notify(`특산물 레시피가 해금되었습니다!`, "success");
    if(window.fb_syncMyState) window.fb_syncMyState();
};

// 멀티플레이 로비 관리
window.showLobby = function() {
  const m = document.getElementById('modal-lobby');
  if(!m) return;
  m.classList.remove('hidden'); m.classList.add('flex');
  setTimeout(() => { m.classList.remove('opacity-0'); m.children[0].classList.remove('scale-95'); }, 10);
};

window.hideLobby = function() {
  const m = document.getElementById('modal-lobby');
  if(!m) return;
  m.classList.add('opacity-0'); m.children[0].classList.add('scale-95');
  setTimeout(() => { m.classList.add('hidden'); m.classList.remove('flex'); }, 300);
};

window.createRoom = async function() {
    if (window.authErrorMsg) return window.notify(`서버 차단됨: ${window.authErrorMsg}`, "error");
    if (!window.isFirebaseReady || !window.user) return window.notify("서버 연결 중입니다. 잠시 후 다시 시도해주세요.", "error");
    
    const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
    const maxTurnsInput = document.getElementById('room-max-turns-input');
    window.state.maxTurns = maxTurnsInput ? parseInt(maxTurnsInput.value) || 50 : 50;
    window.state.myPlayerId = 'Player 1'; window.state.mode = 'multi-wait';
    window.state.roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    window.hideLobby(); window.showScreen('screen-waiting');
    document.getElementById('waiting-room-code').innerText = window.state.roomId;
    
    const roomRef = doc(window.db, 'artifacts', window.appId, 'public', 'data', 'rooms', window.state.roomId);
    await setDoc(roomRef, {
      status: 'waiting', host: 'Player 1', playerIds: ['Player 1'], chat: [], maxTurns: window.state.maxTurns, lastEventTitle: null
    });
    window.startSync(roomRef);
};

window.joinRoom = async function() {
    if (window.authErrorMsg) return window.notify(`서버 차단됨: ${window.authErrorMsg}`, "error");
    if (!window.isFirebaseReady || !window.user) return window.notify("서버 연결 중입니다.", "error");
    
    const { doc, getDoc, updateDoc, arrayUnion } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
    const codeInput = document.getElementById('room-code-input');
    const code = codeInput ? codeInput.value.toUpperCase() : "";
    if(code.length !== 4) return window.notify('4자리 코드를 입력하세요.', 'error');
    
    const roomRef = doc(window.db, 'artifacts', window.appId, 'public', 'data', 'rooms', code);
    const snap = await getDoc(roomRef);
    if(!snap.exists()) return window.notify('존재하지 않는 방입니다.', 'error');
    const data = snap.data();
    if(data.status !== 'waiting') return window.notify('이미 게임이 진행 중인 방입니다.', 'error');

    const myId = `Player ${data.playerIds.length + 1}`;
    window.state.myPlayerId = myId; window.state.mode = 'multi-wait';
    window.state.roomId = code; window.state.maxTurns = data.maxTurns || 50;
    
    window.hideLobby(); window.showScreen('screen-waiting');
    document.getElementById('waiting-room-code').innerText = window.state.roomId;

    await updateDoc(roomRef, { playerIds: arrayUnion(myId) });
    window.startSync(roomRef); 
};

window.startMultiGame = async function() {
    const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
    const roomRef = doc(window.db, 'artifacts', window.appId, 'public', 'data', 'rooms', window.state.roomId);
    
    const initialStacks = [];
    const cx = 1200; const cy = 800; 
    const starts = ['wood', 'stone', 'seed', 'water', 'fire', 'villager'];
    starts.forEach((id, idx) => {
       const angle = (idx / starts.length) * Math.PI * 2; const r = 120;
       initialStacks.push({ id: `s${idx}`, x: cx + Math.cos(angle)*r - 30, y: cy + Math.sin(angle)*r - 50, cards: [id], crafting: null });
    });

    const playersData = {};
    window.state.playerIds.forEach(pid => {
       playersData[pid] = { money: 0, prof: { farming: {lv:1,exp:0}, mining: {lv:1,exp:0}, woodcraft: {lv:1,exp:0}, cooking: {lv:1,exp:0}, smithing: {lv:1,exp:0} }, tech: { tier_2: false, steel_upgrade: false, warehouse: false }, warehouseItems: {}, activeQuest: null, stacks: initialStacks };
    });

    if(window.initMarket) window.initMarket();
    const poolItems = ['wood', 'stone', 'seed', 'water', 'fire'];
    const fullPool = Array.from({length: 200}, () => poolItems[Math.floor(Math.random() * poolItems.length)]);
    
    await updateDoc(roomRef, {
       status: 'playing', turnCount: 1, playersData: playersData, 
       sharedPool: fullPool.slice(4), displayPool: fullPool.slice(0, 4), market: window.state.market, newsHistory: window.state.newsHistory,
       activeTrade: null, lastTradeTime: 0, lastEventTitle: null
    });
};

window.initMultiPlayEnv = function(data) {
    window.state.mode = 'multi-play';
    window.state.turnCount = data.turnCount; window.state.market = data.market; window.state.sharedPool = data.sharedPool; window.state.displayPool = data.displayPool; window.state.newsHistory = data.newsHistory || [];
    window.state.playersData = data.playersData; window.state.maxTurns = data.maxTurns || 50; window.state.lastEventTitle = data.lastEventTitle || null; window.state.isGameOver = false;
    
    const myData = data.playersData[window.state.myPlayerId];
    window.state.money = myData.money; window.state.prof = myData.prof; 
    window.state.tech = myData.tech || { tier_2: false, steel_upgrade: false, warehouse: false };
    window.state.warehouseItems = myData.warehouseItems || {};
    window.state.activeQuest = myData.activeQuest || null;
    window.state.stacks = myData.stacks.map(s => ({...s, id: s.id || `s${window.nextStackId++}`}));

    let opts = `<option value="me">내 영지 보기</option>`;
    window.state.playerIds.forEach(p => { if(p !== window.state.myPlayerId) opts += `<option value="${p}">${p} 영지 정찰</option>`; });
    const viewSelect = document.getElementById('view-player-select');
    if(viewSelect) viewSelect.innerHTML = opts;

    let chatOpts = `<option value="all">전체에게</option>`;
    window.state.playerIds.forEach(p => { if(p !== window.state.myPlayerId) chatOpts += `<option value="${p}">${p}에게 귓속말</option>`; });
    const chatSelect = document.getElementById('chat-target-select');
    if(chatSelect) chatSelect.innerHTML = chatOpts;

    if(window.showScreen) window.showScreen('screen-game');
    
    const roomInfo = document.getElementById('room-info'); if(roomInfo) { roomInfo.classList.remove('hidden'); roomInfo.classList.add('flex'); }
    const codeDisplay = document.getElementById('display-room-code'); if(codeDisplay) codeDisplay.innerText = window.state.roomId;
    
    const btnTrade = document.getElementById('btn-trade'); if(btnTrade) { btnTrade.classList.remove('hidden'); btnTrade.classList.add('flex'); }
    const chatCont = document.getElementById('chat-container'); if(chatCont) chatCont.classList.remove('hidden');
    const oppPanel = document.getElementById('opponent-panel'); if(oppPanel) { oppPanel.classList.remove('hidden'); oppPanel.classList.add('flex'); }

    window.showSpecialtySelector(); 
    if(window.renderAll) window.renderAll();
};

window.cleanupAndLeave = async function() {
    if (window.state.mode.startsWith('multi') && window.state.roomId && window.user && !window.isExternalMode) {
       try { 
           const { doc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
           await deleteDoc(doc(window.db, 'artifacts', window.appId, 'public', 'data', 'rooms', window.state.roomId)); 
       } catch(e) {}
    }
    location.reload();
};

// 파이어베이스 동기화 및 거래 로직
window.startSync = async function(roomRef) {
    const { onSnapshot } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
    window.unsubSnapshot = onSnapshot(roomRef, (docSnap) => {
      if (!docSnap.exists()) return;
      const data = docSnap.data();
      
      if (data.status === 'waiting') {
         window.state.playerIds = data.playerIds;
         const wp = document.getElementById('waiting-players-list');
         if(wp) wp.innerHTML = data.playerIds.map(p => `<li>${p} ${p===window.state.myPlayerId?'<span class="text-xs text-indigo-400">(나)</span>':''} ${p===data.host?'👑':''}</li>`).join('');
         
         if (window.state.myPlayerId === data.host) {
             const wh = document.getElementById('waiting-host-controls'); if(wh) wh.classList.remove('hidden');
         } else {
             const wg = document.getElementById('waiting-guest-controls'); if(wg) wg.classList.remove('hidden');
         }
         return;
      }

      if (data.status === 'playing' && window.state.mode === 'multi-wait') {
         window.state.playerIds = data.playerIds; window.initMultiPlayEnv(data); return;
      }

      if (window.state.mode !== 'multi-play') return;

      if (data.turnCount > window.state.turnCount) {
         window.state.turnCount = data.turnCount; window.state.market = data.market; window.state.sharedPool = data.sharedPool; window.state.displayPool = data.displayPool;
         if(data.newsHistory) window.state.newsHistory = data.newsHistory;
         if(window.notify) window.notify("턴이 갱신되었습니다.", "info");
      }
      if (data.maxTurns) window.state.maxTurns = data.maxTurns;
      if (data.lastEventTitle !== undefined) window.state.lastEventTitle = data.lastEventTitle;
      
      window.state.playersData = data.playersData;

      if (data.lastTradeTime && data.lastTradeTime > (window.state.lastTradeTime || 0)) {
          window.state.lastTradeTime = data.lastTradeTime;
          const myData = data.playersData[window.state.myPlayerId];
          if (myData) {
              window.state.money = myData.money;
              window.state.stacks = myData.stacks.map(s => ({...s, id: s.id || `s${window.nextStackId++}`, x: s.x, y: s.y}));
              if (data.activeTrade?.pA !== window.state.myPlayerId && window.notify) { 
                  window.notify("거래 성사! 보드 중앙과 골드를 확인하세요 🎁", "success");
                  window.state.localTradeOffer = { money: 0, items: [] };
              }
          }
      }

      if (data.activeTrade) {
         const prevTrade = window.state.activeTrade;
         window.state.activeTrade = data.activeTrade; 
         
         if (data.activeTrade.status === 'requested' && data.activeTrade.pB === window.state.myPlayerId && (!prevTrade || prevTrade.status !== 'requested')) {
             const m = document.getElementById('modal-trade');
             if(m && m.classList.contains('hidden')) { 
                 m.classList.remove('hidden'); m.classList.add('flex'); 
                 setTimeout(()=> { m.classList.remove('opacity-0'); m.children[0].classList.remove('scale-95'); }, 10); 
             }
             if(window.notify) window.notify(`${data.activeTrade.pA}님의 거래 요청이 도착했습니다!`, 'action');
         }
         
         const tradeModal = document.getElementById('modal-trade');
         if(tradeModal && !tradeModal.classList.contains('hidden') && window.renderTradeUI) window.renderTradeUI();

         if (data.activeTrade.status === 'negotiating' && data.activeTrade.pAAccept && data.activeTrade.pBAccept && window.state.myPlayerId === data.activeTrade.pA) {
             if(window.executeTradeInDB) window.executeTradeInDB(roomRef, data);
         }
      } else {
         window.state.activeTrade = null;
         const tradeModal = document.getElementById('modal-trade');
         if(tradeModal && !tradeModal.classList.contains('hidden') && window.renderTradeUI) window.renderTradeUI();
      }

      if (data.chat && data.chat.length > window.state.chat.length) {
         const myChats = data.chat.filter(m => m.target === 'all' || m.target === window.state.myPlayerId || m.sender === window.state.myPlayerId);
         if(window.renderChat) window.renderChat(myChats);
         if (!window.state.isChatOpen && myChats.length > window.state.chat.length && myChats[myChats.length-1].sender !== window.state.myPlayerId) {
             const badge = document.getElementById('chat-unread');
             if(badge) badge.classList.remove('hidden');
         }
      }
      if(window.renderAll) window.renderAll();
    }, (error) => console.error("Sync Error:", error));
};

window.fb_syncMyState = async () => {
    if (!window.state.mode.startsWith('multi') || !window.user) return;
    const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
    const roomRef = doc(window.db, 'artifacts', window.appId, 'public', 'data', 'rooms', window.state.roomId);
    await updateDoc(roomRef, { [`playersData.${window.state.myPlayerId}`]: { money: window.state.money, prof: window.state.prof, tech: window.state.tech, warehouseItems: window.state.warehouseItems, activeQuest: window.state.activeQuest, stacks: window.serializeStacks(window.state.stacks) } });
};

window.fb_syncGlobalState = async () => {
    if (!window.state.mode.startsWith('multi') || !window.user) return;
    const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
    const roomRef = doc(window.db, 'artifacts', window.appId, 'public', 'data', 'rooms', window.state.roomId);
    await updateDoc(roomRef, { turnCount: window.state.turnCount, sharedPool: window.state.sharedPool, displayPool: window.state.displayPool, market: window.state.market, newsHistory: window.state.newsHistory, lastEventTitle: window.state.lastEventTitle || null });
};

window.executeTradeInDB = async function(roomRef, data) {
    const { updateDoc } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
    const tr = data.activeTrade; const pA_id = tr.pA; const pB_id = tr.pB;
     
    let pA_money = data.playersData[pA_id].money - tr.pAMoney + tr.pBMoney;
    let pB_money = data.playersData[pB_id].money - tr.pBMoney + tr.pAMoney;
     
    const newPAStacks = window.removeItemsFromStacks(data.playersData[pA_id].stacks, tr.pAItems);
    const newPBStacks = window.removeItemsFromStacks(data.playersData[pB_id].stacks, tr.pBItems);
     
    let dropX = 1200 + (Math.random() - 0.5) * 100; let dropY = 800 + (Math.random() - 0.5) * 100;
     
    tr.pBItems.forEach((item, idx) => newPAStacks.push({ id: `t_${Date.now()}_${idx}_b`, x: dropX, y: dropY, cards: [item], crafting: null }));
    tr.pAItems.forEach((item, idx) => newPBStacks.push({ id: `t_${Date.now()}_${idx}_a`, x: dropX, y: dropY, cards: [item], crafting: null }));

    await updateDoc(roomRef, {
        [`playersData.${pA_id}.money`]: pA_money, [`playersData.${pA_id}.stacks`]: newPAStacks,
        [`playersData.${pB_id}.money`]: pB_money, [`playersData.${pB_id}.stacks`]: newPBStacks,
        activeTrade: null, lastTradeTime: Date.now()
    });
    if(window.notify) window.notify("거래 성사! 보드 중앙과 골드를 확인하세요 🎁", "success");
    window.state.localTradeOffer = { money: 0, items: [] };
     
    if (window.state.myPlayerId === pA_id || window.state.myPlayerId === pB_id) {
        const myNewData = window.state.myPlayerId === pA_id ? {m: pA_money, s: newPAStacks} : {m: pB_money, s: newPBStacks};
        window.state.money = myNewData.m;
        window.state.stacks = myNewData.s.map(s => ({...s, id: s.id}));
        if(window.renderAll) window.renderAll();
    }
};

window.removeItemsFromStacks = function(stacks, itemsToRemove) {
    let newStacks = JSON.parse(JSON.stringify(stacks)); let toRemove = [...itemsToRemove];
    for (let i = 0; i < toRemove.length; i++) {
        let item = toRemove[i];
        for (let s of newStacks) { let idx = s.cards.lastIndexOf(item); if (idx !== -1) { s.cards.splice(idx, 1); break; } }
    }
    return newStacks.filter(s => s.cards.length > 0);
};

window.serializeStacks = function(stacks) { return stacks.map(s => ({ id: s.id || `s${window.nextStackId++}`, x: s.x, y: s.y, cards: s.cards, crafting: s.crafting })); };

// 채팅 관련
window.toggleChat = function() {
    const c = document.getElementById('chat-container'); const ic = document.getElementById('chat-icon');
    if(!c || !ic) return;
    window.state.isChatOpen = !window.state.isChatOpen;
    if (window.state.isChatOpen) { c.classList.remove('chat-closed'); c.classList.add('chat-open'); ic.classList.replace('ph-caret-up', 'ph-caret-down'); const badge = document.getElementById('chat-unread'); if(badge) badge.classList.add('hidden'); } 
    else { c.classList.remove('chat-open'); c.classList.add('chat-closed'); ic.classList.replace('ph-caret-down', 'ph-caret-up'); }
};

window.renderChat = function(msgs) {
    window.state.chat = msgs; const box = document.getElementById('chat-messages'); if(!box) return;
    box.innerHTML = msgs.map(m => {
       const isMe = m.sender === window.state.myPlayerId;
       const whisperLabel = m.target !== 'all' ? `<span class="text-[9px] text-indigo-400 font-bold block mb-0.5">[귓속말: ${isMe ? 'To '+m.target : 'From '+m.sender}]</span>` : `<span class="text-[9px] text-slate-400 font-bold block mb-0.5">[${m.sender}]</span>`;
       return `<div class="flex ${isMe?'justify-end':'justify-start'}"><div class="max-w-[80%] px-3 py-1.5 rounded-xl ${isMe?'bg-indigo-500 text-white rounded-br-none':'bg-white border border-slate-200 text-slate-700 rounded-bl-none'} shadow-sm">${whisperLabel}${m.msg}</div></div>`;
    }).join('');
    box.scrollTop = box.scrollHeight;
};

window.sendChat = async function() {
    const input = document.getElementById('chat-input'); const text = input ? input.value.trim() : '';
    const targetSel = document.getElementById('chat-target-select'); const target = targetSel ? targetSel.value : 'all'; 
    if (!text || !window.state.mode.startsWith('multi') || !window.user) return;
    const { doc, updateDoc, arrayUnion } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
    const roomRef = doc(window.db, 'artifacts', window.appId, 'public', 'data', 'rooms', window.state.roomId);
    await updateDoc(roomRef, { chat: arrayUnion({ sender: window.state.myPlayerId, target: target, msg: text, time: Date.now() }) });
    input.value = '';
};