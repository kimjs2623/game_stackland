// main.js
import { TILES, SELLABLE_ITEMS, CAT_INFO, RECIPES, SPECIALTY_OPTIONS, MARKET_EVENTS, MAX_TURNS, APP_ID } from './data.js';
import { db, auth, currentUser, isFirebaseReady, initAuth } from './firebase.js';
import { doc, setDoc, getDoc, onSnapshot, arrayUnion, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- State ---
window.state = {
  mode: 'single', roomId: null, myPlayerId: null, turnCount: 1, money: 0, stacks: [], sharedPool: [], displayPool: [], draggingStack: null, market: {}, newsHistory: [], unlockedSpecialty: null, 
  playerIds: [], playersData: {}, viewingOpponent: false, viewingPlayerId: null, maxTurns: 30,
  prof: { farming: { lv: 1, exp: 0 }, mining: { lv: 1, exp: 0 }, woodcraft: { lv: 1, exp: 0 }, cooking: { lv: 1, exp: 0 }, smithing: { lv: 1, exp: 0 } },
  chat: [], isChatOpen: false, 
  activeTrade: null, localTradeOffer: { money: 0, items: [] }, lastTradeTime: 0
};
window.nextStackId = 1; window.unsubSnapshot = null; window.dragData = null;

// --- App Flow ---
window.startGame = function(mode) {
  document.getElementById('screen-menu').classList.add('hidden');
  if (mode === 'single') { window.state.mode = 'single'; window.initGame(); }
};

window.showLobby = function() {
  const m = document.getElementById('modal-lobby'); m.classList.remove('hidden'); m.classList.add('flex');
  setTimeout(() => { m.classList.remove('opacity-0'); m.children[0].classList.remove('scale-95'); }, 10);
};
window.hideLobby = function() {
  const m = document.getElementById('modal-lobby'); m.classList.add('opacity-0'); m.children[0].classList.add('scale-95');
  setTimeout(() => { m.classList.add('hidden'); m.classList.remove('flex'); }, 300);
};

window.notify = function(msg, type = 'info') {
  const container = document.getElementById('notif-container');
  if (!container) return;
  const el = document.createElement('div');
  const bg = type === 'error' ? 'bg-rose-100 text-rose-800 border-rose-300' : type === 'success' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : type === 'action' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-white text-sky-800 border-sky-300';
  el.className = `px-6 py-2.5 rounded-full font-black text-sm shadow-xl border-2 backdrop-blur-md animate-notif w-max whitespace-nowrap pointer-events-none ${bg}`;
  el.innerHTML = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 2400);
};

window.showScreen = function(id) {
  ['screen-menu', 'screen-waiting', 'screen-game', 'screen-result'].forEach(s => {
    const el = document.getElementById(s);
    if(el) { el.classList.add('hidden'); el.classList.remove('opacity-100'); el.classList.add('opacity-0'); }
  });
  const target = document.getElementById(id);
  if(target) {
    target.classList.remove('hidden');
    setTimeout(() => { target.classList.remove('opacity-0'); target.classList.add('opacity-100'); if (id === 'screen-game') target.classList.add('flex'); }, 50);
  }
};

window.toggleRecipeModal = function() {
  const m = document.getElementById('modal-recipe');
  if (m.classList.contains('hidden')) { m.classList.remove('hidden'); m.classList.add('flex'); window.renderRecipeList(); setTimeout(() => { m.classList.remove('opacity-0'); m.children[0].classList.remove('scale-95'); }, 10); }
  else { m.classList.add('opacity-0'); m.children[0].classList.add('scale-95'); setTimeout(() => { m.classList.add('hidden'); m.classList.remove('flex'); }, 300); }
};

window.toggleNewsModal = function() {
  const m = document.getElementById('modal-news');
  if (m.classList.contains('hidden')) { m.classList.remove('hidden'); m.classList.add('flex'); window.renderNewsList(); setTimeout(() => { m.classList.remove('opacity-0'); m.children[0].classList.remove('scale-95'); }, 10); }
  else { m.classList.add('opacity-0'); m.children[0].classList.add('scale-95'); setTimeout(() => { m.classList.add('hidden'); m.classList.remove('flex'); }, 300); }
};

window.showNewsSplash = function(title, msg, type) {
  const s = document.getElementById('splash-news'); const c = document.getElementById('splash-news-content');
  if(!s || !c) return;
  document.getElementById('splash-title').innerText = title; document.getElementById('splash-msg').innerText = msg;
  const bColor = type === 'up' ? 'border-emerald-400' : 'border-rose-400';
  c.className = `bg-white/95 backdrop-blur-xl border-4 ${bColor} p-8 rounded-[3rem] shadow-[0_0_50px_rgba(245,158,11,0.3)] text-center transform scale-90 transition-transform duration-500 max-w-2xl`;
  s.classList.remove('hidden');
  setTimeout(() => { s.classList.remove('opacity-0'); c.classList.remove('scale-90'); }, 50);
  setTimeout(() => { s.classList.add('opacity-0'); c.classList.add('scale-90'); setTimeout(() => s.classList.add('hidden'), 500); }, 3500);
};

window.showTooltip = function(id, e) {
  if (window.state.draggingStack || window.state.viewingOpponent) return;
  const rel = RECIPES.filter(r => (!r.isSpecialty || r.unlockId === window.state.unlockedSpecialty) && (r.inputs.includes(id) || r.results.includes(id)));
  if(rel.length === 0) return;
  const tt = document.getElementById('tooltip'); const content = document.getElementById('tooltip-content');
  content.innerHTML = rel.map(r => {
    const iText = r.inputs.map(ing => `<span class="${TILES[ing].textColor} font-bold">${TILES[ing].name}</span>`).join(' <span class="text-slate-400 font-normal">+</span> ');
    const rText = r.results.map(res => `<span class="${TILES[res].textColor} font-bold bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm">${TILES[res].name}</span>`).join(', ');
    return `<div class="flex flex-col gap-1 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200 mb-1 shadow-sm"><div class="flex items-center gap-1">${iText}</div><div class="flex items-center gap-2 mt-1"><i class="ph-bold ph-arrow-elbow-down-right text-sky-400"></i><span class="bg-sky-100 text-sky-600 font-black px-1.5 rounded">${r.turns}턴</span>${rText}</div></div>`;
  }).join('');
  tt.classList.remove('hidden'); window.moveTooltip(e);
};
window.hideTooltip = function() { const tt = document.getElementById('tooltip'); if(tt) tt.classList.add('hidden'); };
window.moveTooltip = function(e) { const tt = document.getElementById('tooltip'); if(tt){ tt.style.left = (e.clientX + 15) + 'px'; tt.style.top = (e.clientY + 15) + 'px'; } };

window.changeViewPlayer = function(pid) {
   window.state.viewingOpponent = (pid !== 'me');
   window.state.viewingPlayerId = pid === 'me' ? null : pid;
   const overlay = document.getElementById('opponent-overlay');
   if (window.state.viewingOpponent) { 
       overlay.classList.remove('hidden'); overlay.classList.add('flex'); 
       document.getElementById('overlay-opp-score').innerText = window.state.playersData[pid].money; 
   } else { 
       overlay.classList.add('hidden'); overlay.classList.remove('flex'); 
       document.getElementById('view-player-select').value = 'me';
   }
   window.renderAll();
};

// --- Multiplayer ---
window.createRoom = async function() {
  if (!isFirebaseReady || !currentUser) return window.notify("서버 연결 중입니다. 잠시 후 다시 시도해주세요.", "error");
  
  const maxTurnsInput = document.getElementById('room-max-turns-input');
  window.state.maxTurns = maxTurnsInput ? parseInt(maxTurnsInput.value) || 30 : 30;

  window.state.myPlayerId = 'Player 1';
  window.state.mode = 'multi-wait';
  window.state.roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  window.hideLobby(); window.showScreen('screen-waiting');
  document.getElementById('waiting-room-code').innerText = window.state.roomId;
  
  const roomRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'rooms', window.state.roomId);
  await setDoc(roomRef, {
    status: 'waiting', host: 'Player 1', playerIds: ['Player 1'], chat: [], maxTurns: window.state.maxTurns
  });
  window.startSync(roomRef);
};

window.joinRoom = async function() {
  if (!isFirebaseReady || !currentUser) return window.notify("서버 연결 중입니다. 잠시 후 다시 시도해주세요.", "error");
  const code = document.getElementById('room-code-input').value.toUpperCase();
  if(code.length !== 4) return window.notify('4자리 코드를 입력하세요.', 'error');
  
  const roomRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'rooms', code);
  const snap = await getDoc(roomRef);
  if(!snap.exists()) return window.notify('존재하지 않는 방입니다.', 'error');
  const data = snap.data();
  if(data.status !== 'waiting') return window.notify('이미 게임이 진행 중인 방입니다.', 'error');

  const myId = `Player ${data.playerIds.length + 1}`;
  window.state.myPlayerId = myId;
  window.state.mode = 'multi-wait';
  window.state.roomId = code;
  window.state.maxTurns = data.maxTurns || 30;
  
  window.hideLobby(); window.showScreen('screen-waiting');
  document.getElementById('waiting-room-code').innerText = window.state.roomId;

  await updateDoc(roomRef, { playerIds: arrayUnion(myId) });
  window.startSync(roomRef); 
};

window.startMultiGame = async function() {
  const roomRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'rooms', window.state.roomId);
  
  const initialStacks = [];
  const w = document.getElementById('board-area').clientWidth || 800; const h = document.getElementById('board-area').clientHeight || 600;
  const starts = ['wood', 'stone', 'seed', 'water', 'fire', 'villager'];
  starts.forEach((id, idx) => {
     const angle = (idx / starts.length) * Math.PI * 2; const r = 120;
     initialStacks.push({ id: `s${idx}`, xRatio: (w/2 + Math.cos(angle)*r - 30)/w, yRatio: (h/2 + Math.sin(angle)*r - 50)/h, cards: [id], crafting: null });
  });

  const playersData = {};
  window.state.playerIds.forEach(pid => {
     playersData[pid] = { money: 0, prof: { farming: {lv:1,exp:0}, mining: {lv:1,exp:0}, woodcraft: {lv:1,exp:0}, cooking: {lv:1,exp:0}, smithing: {lv:1,exp:0} }, stacks: initialStacks };
  });

  window.initMarket();
  const poolItems = ['wood', 'stone', 'seed', 'water', 'fire'];
  const fullPool = Array.from({length: 200}, () => poolItems[Math.floor(Math.random() * poolItems.length)]);
  
  await updateDoc(roomRef, {
     status: 'playing', turnCount: 1, playersData: playersData, 
     sharedPool: fullPool.slice(4), displayPool: fullPool.slice(0, 4), market: window.state.market, newsHistory: window.state.newsHistory,
     activeTrade: null, lastTradeTime: 0
  });
};

window.initMultiPlayEnv = function(data) {
  window.state.mode = 'multi-play';
  window.state.turnCount = data.turnCount; window.state.market = data.market; window.state.sharedPool = data.sharedPool; window.state.displayPool = data.displayPool; window.state.newsHistory = data.newsHistory || [];
  window.state.playersData = data.playersData;
  window.state.maxTurns = data.maxTurns || 30;
  
  const myData = data.playersData[window.state.myPlayerId];
  window.state.money = myData.money; window.state.prof = myData.prof; 
  
  const boardEl = document.getElementById('board-area');
  const w = boardEl.clientWidth || 800; const h = boardEl.clientHeight || 600;
  window.state.stacks = myData.stacks.map(s => ({...s, id: s.id || `s${window.nextStackId++}`, x: s.xRatio * w, y: s.yRatio * h}));

  let opts = `<option value="me">내 영지 보기</option>`;
  window.state.playerIds.forEach(p => { if(p !== window.state.myPlayerId) opts += `<option value="${p}">${p} 영지 정찰</option>`; });
  document.getElementById('view-player-select').innerHTML = opts;

  let chatOpts = `<option value="all">전체에게</option>`;
  window.state.playerIds.forEach(p => { if(p !== window.state.myPlayerId) chatOpts += `<option value="${p}">${p}에게 귓속말</option>`; });
  document.getElementById('chat-target-select').innerHTML = chatOpts;

  window.showScreen('screen-game');
  document.getElementById('room-info').classList.remove('hidden'); document.getElementById('room-info').classList.add('flex');
  document.getElementById('display-room-code').innerText = window.state.roomId;
  document.getElementById('btn-trade').classList.remove('hidden'); document.getElementById('btn-trade').classList.add('flex');
  document.getElementById('chat-container').classList.remove('hidden');
  document.getElementById('opponent-panel').classList.remove('hidden'); document.getElementById('opponent-panel').classList.add('flex');

  window.showSpecialtySelector();
  window.renderAll();
};

window.initGame = function() {
  window.state.turnCount = 1; window.state.money = 0; window.state.stacks = []; window.nextStackId = 1; window.state.viewingOpponent = false; window.state.maxTurns = 30;
  window.state.prof = { farming: {lv:1,exp:0}, mining: {lv:1,exp:0}, woodcraft: {lv:1,exp:0}, cooking: {lv:1,exp:0}, smithing: {lv:1,exp:0} };
  
  window.initMarket();
  
  const poolItems = ['wood', 'stone', 'seed', 'water', 'fire'];
  const fullPool = Array.from({length: 200}, () => poolItems[Math.floor(Math.random() * poolItems.length)]);
  window.state.sharedPool = fullPool.slice(4); window.state.displayPool = fullPool.slice(0, 4);

  window.spawnInitialResources();
  window.evaluatePool(); window.renderAll(); window.showScreen('screen-game');
  window.showSpecialtySelector();
};

window.spawnInitialResources = function() {
  const boardEl = document.getElementById('board-area');
  const w = boardEl.clientWidth || window.innerWidth/2; const h = boardEl.clientHeight || window.innerHeight/2;
  const cx = w / 2; const cy = h / 2;
  const starts = ['wood', 'stone', 'seed', 'water', 'fire', 'villager'];
  starts.forEach((id, idx) => {
     const angle = (idx / starts.length) * Math.PI * 2; const r = 120;
     window.state.stacks.push({ id: `s${window.nextStackId++}`, x: cx + Math.cos(angle)*r - 30, y: cy + Math.sin(angle)*r - 50, cards: [id], crafting: null });
  });
};

window.showSpecialtySelector = function() {
  const m = document.getElementById('modal-specialty'); const c = document.getElementById('specialty-options');
  c.innerHTML = SPECIALTY_OPTIONS.map(opt => `
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
  modal.classList.add('opacity-0'); modal.children[0].classList.add('scale-95');
  setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); }, 300);
  window.notify(`${SPECIALTY_OPTIONS.find(o=>o.id===id).name} 레시피가 해금되었습니다!`, "success");
  window.fb_syncMyState();
};

window.evaluatePool = function() {
  const counts = {}; let maxFreq = 0;
  window.state.displayPool.forEach(id => { counts[id] = (counts[id] || 0) + 1; if (counts[id] > maxFreq) maxFreq = counts[id]; });
  const rerollBtn = document.getElementById('btn-reroll-pool');
  if (maxFreq === 4) { window.notify("자동 갱신됩니다 🔄", "info"); window.state.displayPool = window.state.displayPool.map(() => window.state.sharedPool.shift() || 'wood'); window.evaluatePool(); } 
  else if (maxFreq === 3) { rerollBtn.classList.remove('hidden'); rerollBtn.classList.add('flex'); } 
  else { rerollBtn.classList.add('hidden'); rerollBtn.classList.remove('flex'); }
};

window.rerollPool = function() {
  if (window.state.viewingOpponent) return;
  window.state.displayPool = window.state.displayPool.map(() => window.state.sharedPool.shift() || 'wood');
  window.notify("선택지를 초기화했습니다 🔄", "action");
  window.evaluatePool(); window.renderAll(); window.fb_syncGlobalState();
};

window.handlePoolClick = function(poolIdx) {
  if (window.state.mode.startsWith('multi')) {
     const currentTurnPlayer = window.state.playerIds[(window.state.turnCount - 1) % window.state.playerIds.length];
     if (window.state.myPlayerId !== currentTurnPlayer) return window.notify("상대방의 턴입니다. 내 영지 정리만 가능합니다.", "error");
  }
  if (window.state.viewingOpponent) return window.notify("내 영지로 돌아와주세요.", "error");

  const picked = window.state.displayPool[poolIdx];
  const boardEl = document.getElementById('board-area');
  const cx = boardEl.clientWidth / 2 - 40; const cy = boardEl.clientHeight / 2 - 50;
  window.state.stacks.push({ id: `s${window.nextStackId++}`, x: cx, y: cy, cards: [picked], crafting: null });
  window.state.displayPool[poolIdx] = window.state.sharedPool.shift() || 'wood';
  
  window.evaluatePool(); window.processTurnEnd();
};

window.processTurnEnd = function() {
  window.state.stacks.forEach(stack => {
    if (stack.crafting) {
      stack.crafting.left--;
      if (stack.crafting.left <= 0) {
        const recipe = RECIPES.find(r => r.id === stack.crafting.recipeId);
        stack.cards = [...recipe.results]; stack.crafting = null;
        window.notify(`${recipe.desc} 완성! ✨`, "success");
        if (recipe.category && recipe.category !== 'general') {
           window.state.prof[recipe.category].exp += 1;
           if(window.state.prof[recipe.category].exp >= 3){
              window.state.prof[recipe.category].lv += 1; window.state.prof[recipe.category].exp = 0;
              window.notify(`${CAT_INFO[recipe.category].name} 레벨업 (Lv.${window.state.prof[recipe.category].lv}) 🎉`, 'action');
           }
        }
        window.checkAndSetRecipe(stack);
      }
    }
  });

  let ev = null;
  if (window.state.turnCount % 5 === 0 && Math.random() < 0.4) {
    ev = MARKET_EVENTS[Math.floor(Math.random() * MARKET_EVENTS.length)];
    window.state.newsHistory.unshift({ turn: window.state.turnCount + 1, msg: ev.msg, type: ev.type });
    window.showNewsSplash(ev.title, ev.msg, ev.type);
  }
  SELLABLE_ITEMS.forEach(id => {
    const m = window.state.market[id]; m.previousPrice = m.currentPrice;
    m.supply += m.pendingSupply; m.pendingSupply = 0; m.supply *= 0.85; 
    const sf = Math.max(0.2, 1 - (m.supply * 0.08)); const n = 1 + (Math.random() * 0.1 - 0.05) * TILES[id].volatility;
    let tp = Math.floor(TILES[id].basePrice * sf * n);
    if (ev && (ev.target === id || (ev.targets && ev.targets.includes(id)))) tp = Math.floor(tp * ev.effect);
    m.currentPrice = Math.floor(m.previousPrice * 0.5 + tp * 0.5);
    if (m.currentPrice < 1) m.currentPrice = 1; m.trend = m.currentPrice - m.previousPrice;
  });

  if (window.state.turnCount >= window.state.maxTurns) {
    window.endGame(); return;
  }
  
  window.state.turnCount++; window.renderAll(); window.fb_syncMyState(); window.fb_syncGlobalState();
};

window.checkAndSetRecipe = function(stack) {
  stack.crafting = null; 
  if (stack.cards.length < 2) return;
  const currentSorted = [...stack.cards].sort().join(',');
  const matched = RECIPES.filter(r => !r.isSpecialty || r.unlockId === window.state.unlockedSpecialty).find(r => [...r.inputs].sort().join(',') === currentSorted);
  if (matched) stack.crafting = { recipeId: matched.id, left: matched.turns, total: matched.turns };
};

window.getFinalPrice = function(itemId) {
  if (!window.state.market[itemId]) return 0;
  const base = window.state.market[itemId].currentPrice; const cat = TILES[itemId].category;
  return cat && window.state.prof[cat] ? Math.floor(base * (1 + (window.state.prof[cat].lv - 1) * 0.15)) : base;
};

window.initMarket = function() {
  window.state.market = {};
  SELLABLE_ITEMS.forEach(id => { window.state.market[id] = { currentPrice: TILES[id].basePrice, previousPrice: TILES[id].basePrice, trend: 0, supply: 0, pendingSupply: 0 }; });
  window.state.newsHistory = [{ turn: 1, msg: "시장이 개장되었습니다. 매각 시 다음 턴에 시세가 하락합니다.", type: "up" }];
};

window.endGame = function() {
  document.getElementById('result-score').innerText = window.state.money;
  const res = document.getElementById('result-text');
  if(window.state.money < 5000) res.innerText = "평범한 상인 🛒";
  else if(window.state.money < 15000) res.innerText = "성공한 사업가 💼";
  else res.innerText = "하늘 섬의 만수르 💎";
  if(window.unsubSnapshot) window.unsubSnapshot();
  window.showScreen('screen-result');
};

window.cleanupAndLeave = async function() {
  if (window.state.mode.startsWith('multi') && window.state.roomId && currentUser) {
     try { await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'rooms', window.state.roomId)); } catch(e) {}
  }
  location.reload();
};

window.startSync = function(roomRef) {
  window.unsubSnapshot = onSnapshot(roomRef, (docSnap) => {
    if (!docSnap.exists()) return;
    const data = docSnap.data();
    
    if (data.status === 'waiting') {
       window.state.playerIds = data.playerIds;
       document.getElementById('waiting-players-list').innerHTML = data.playerIds.map(p => `<li>${p} ${p===window.state.myPlayerId?'<span class="text-xs text-indigo-400">(나)</span>':''} ${p===data.host?'👑':''}</li>`).join('');
       if (window.state.myPlayerId === data.host) document.getElementById('waiting-host-controls').classList.remove('hidden');
       else document.getElementById('waiting-guest-controls').classList.remove('hidden');
       return;
    }

    if (data.status === 'playing' && window.state.mode === 'multi-wait') {
       window.state.playerIds = Object.keys(data.playersData);
       window.initMultiPlayEnv(data);
       return;
    }

    if (window.state.mode !== 'multi-play') return;

    if (data.turnCount > window.state.turnCount) {
       window.state.turnCount = data.turnCount; window.state.market = data.market; window.state.sharedPool = data.sharedPool; window.state.displayPool = data.displayPool;
       if(data.newsHistory) window.state.newsHistory = data.newsHistory;
       window.notify("턴이 갱신되었습니다.", "info");
    }
    if (data.maxTurns) window.state.maxTurns = data.maxTurns;
    
    window.state.playersData = data.playersData;

    if (data.lastTradeTime && data.lastTradeTime > (window.state.lastTradeTime || 0)) {
        window.state.lastTradeTime = data.lastTradeTime;
        const myData = data.playersData[window.state.myPlayerId];
        if (myData) {
            window.state.money = myData.money;
            const w = document.getElementById('board-area').clientWidth || 800; const h = document.getElementById('board-area').clientHeight || 600;
            window.state.stacks = myData.stacks.map(s => ({...s, id: s.id || `s${window.nextStackId++}`, x: s.xRatio * w, y: s.yRatio * h}));
            if (data.activeTrade?.pA !== window.state.myPlayerId) { 
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
           if(m.classList.contains('hidden')) { 
               m.classList.remove('hidden'); m.classList.add('flex'); 
               setTimeout(()=> { m.classList.remove('opacity-0'); m.children[0].classList.remove('scale-95'); }, 10); 
           }
           window.notify(`${data.activeTrade.pA}님의 거래 요청이 도착했습니다!`, 'action');
       }
       
       window.renderTradeUI();

       if (data.activeTrade.status === 'negotiating' && data.activeTrade.pAAccept && data.activeTrade.pBAccept && window.state.myPlayerId === data.activeTrade.pA) {
           window.executeTradeInDB(roomRef, data);
       }
    } else {
       window.state.activeTrade = null;
       if(!document.getElementById('modal-trade').classList.contains('hidden')) window.renderTradeUI();
    }

    if (data.chat && data.chat.length > window.state.chat.length) {
       const myChats = data.chat.filter(m => m.target === 'all' || m.target === window.state.myPlayerId || m.sender === window.state.myPlayerId);
       window.renderChat(myChats);
       if (!window.state.isChatOpen && myChats.length > window.state.chat.length && myChats[myChats.length-1].sender !== window.state.myPlayerId) {
           const badge = document.getElementById('chat-unread');
           if(badge) badge.classList.remove('hidden');
       }
    }
    window.renderAll();
  }, (error) => console.error("Sync Error:", error));
};

window.fb_syncMyState = async () => {
  if (!window.state.mode.startsWith('multi') || !currentUser) return;
  const roomRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'rooms', window.state.roomId);
  await updateDoc(roomRef, { [`playersData.${window.state.myPlayerId}`]: { money: window.state.money, prof: window.state.prof, stacks: window.serializeStacks(window.state.stacks) } });
};

window.fb_syncGlobalState = async () => {
  if (!window.state.mode.startsWith('multi') || !currentUser) return;
  const roomRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'rooms', window.state.roomId);
  await updateDoc(roomRef, { turnCount: window.state.turnCount, sharedPool: window.state.sharedPool, displayPool: window.state.displayPool, market: window.state.market, newsHistory: window.state.newsHistory });
};

window.executeTradeInDB = async function(roomRef, data) {
   const tr = data.activeTrade;
   const pA_id = tr.pA; const pB_id = tr.pB;
   
   let pA_money = data.playersData[pA_id].money - tr.pAMoney + tr.pBMoney;
   let pB_money = data.playersData[pB_id].money - tr.pBMoney + tr.pAMoney;
   
   const newPAStacks = window.removeItemsFromStacks(data.playersData[pA_id].stacks, tr.pAItems);
   const newPBStacks = window.removeItemsFromStacks(data.playersData[pB_id].stacks, tr.pBItems);
   
   tr.pBItems.forEach((item, idx) => newPAStacks.push({ id: `t_${Date.now()}_${idx}_b`, xRatio: 0.45 + Math.random()*0.1, yRatio: 0.45 + Math.random()*0.1, cards: [item], crafting: null }));
   tr.pAItems.forEach((item, idx) => newPBStacks.push({ id: `t_${Date.now()}_${idx}_a`, xRatio: 0.45 + Math.random()*0.1, yRatio: 0.45 + Math.random()*0.1, cards: [item], crafting: null }));

   await updateDoc(roomRef, {
       [`playersData.${pA_id}.money`]: pA_money, [`playersData.${pA_id}.stacks`]: newPAStacks,
       [`playersData.${pB_id}.money`]: pB_money, [`playersData.${pB_id}.stacks`]: newPBStacks,
       activeTrade: null, lastTradeTime: Date.now()
   });
   window.notify("거래 성사! 보드 중앙과 골드를 확인하세요 🎁", "success");
   window.state.localTradeOffer = { money: 0, items: [] };
   
   if (window.state.myPlayerId === pA_id || window.state.myPlayerId === pB_id) {
       const myNewData = window.state.myPlayerId === pA_id ? {m: pA_money, s: newPAStacks} : {m: pB_money, s: newPBStacks};
       window.state.money = myNewData.m;
       const w = document.getElementById('board-area').clientWidth || 800; const h = document.getElementById('board-area').clientHeight || 600;
       window.state.stacks = myNewData.s.map(s => ({...s, id: s.id, x: s.xRatio * w, y: s.yRatio * h}));
       window.renderAll();
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

window.serializeStacks = function(stacks) {
   const w = document.getElementById('board-area').clientWidth || 800; const h = document.getElementById('board-area').clientHeight || 600;
   return stacks.map(s => ({ id: s.id || `s${window.nextStackId++}`, xRatio: s.x / w, yRatio: s.y / h, cards: s.cards, crafting: s.crafting }));
};

const boardArea = document.getElementById('board-area');
boardArea.addEventListener('pointerdown', e => {
  if (window.state.viewingOpponent) return;
  const cardEl = e.target.closest('.game-card'); if (!cardEl) return;
  window.hideTooltip();
  const stackId = cardEl.dataset.stackId; const cardIdx = parseInt(cardEl.dataset.cardIdx);
  const sIdx = window.state.stacks.findIndex(s => s.id === stackId); if (sIdx === -1) return;

  const stack = window.state.stacks[sIdx];
  if (stack.crafting && stack.crafting.left < stack.crafting.total) return window.notify("턴을 넘긴 제작은 취소 불가 ⏳", "error");

  stack.crafting = null; 
  const rect = cardEl.getBoundingClientRect(); const br = boardArea.getBoundingClientRect();
  const ox = e.clientX - rect.left; const oy = e.clientY - rect.top;

  const detached = stack.cards.splice(cardIdx);
  if (stack.cards.length === 0) window.state.stacks.splice(sIdx, 1); else window.checkAndSetRecipe(stack);

  window.state.draggingStack = { id: `drag_${Date.now()}`, x: e.clientX - br.left - ox, y: e.clientY - br.top - oy, cards: detached };
  window.dragData = { ox, oy };
  window.renderAll(); boardArea.setPointerCapture(e.pointerId);
});

boardArea.addEventListener('pointermove', e => {
  if (!window.state.draggingStack) return;
  const br = boardArea.getBoundingClientRect();
  window.state.draggingStack.x = e.clientX - br.left - window.dragData.ox; window.state.draggingStack.y = e.clientY - br.top - window.dragData.oy;
  const el = document.getElementById('dragging-stack');
  if (el) { el.style.left = `${window.state.draggingStack.x}px`; el.style.top = `${window.state.draggingStack.y}px`; }

  const mz = document.getElementById('market-zone');
  if (mz) {
     const r = mz.getBoundingClientRect();
     if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) mz.classList.add('market-zone-active');
     else mz.classList.remove('market-zone-active');
  }
});

boardArea.addEventListener('pointerup', async e => {
  if (!window.state.draggingStack) return;
  boardArea.releasePointerCapture(e.pointerId);
  document.getElementById('market-zone').classList.remove('market-zone-active');

  const mz = document.getElementById('market-zone'); const mRect = mz.getBoundingClientRect();
  if (e.clientX >= mRect.left && e.clientX <= mRect.right && e.clientY >= mRect.top && e.clientY <= mRect.bottom) {
      let earned = 0, success = false, remains = [];
      window.state.draggingStack.cards.forEach(cardId => {
        const m = window.state.market[cardId];
        if (m && TILES[cardId].basePrice > 0) { earned += window.getFinalPrice(cardId); m.pendingSupply += 1; success = true; } 
        else remains.push(cardId);
      });
      if (success) { window.state.money += earned; window.notify(`매각 예약됨! 턴 종료 시 반영됩니다. <span class="text-amber-500 font-black">+${earned} G</span>`, "action"); }
      else window.notify("시장에서 안 사는 물건입니다 ❌", "error");

      if (remains.length > 0) window.state.stacks.push({ id: `s${window.nextStackId++}`, x: window.state.draggingStack.x - 50, y: window.state.draggingStack.y - 100, cards: remains, crafting: null });
      window.state.draggingStack = null; window.dragData = null; window.renderAll(); window.fb_syncMyState(); return;
  }

  let ts = null; let minD = 55; 
  for (let s of window.state.stacks) {
    const targetY = s.y + (s.cards.length - 1) * 28;
    const dist = Math.sqrt(Math.pow(s.x - window.state.draggingStack.x, 2) + Math.pow(targetY - window.state.draggingStack.y, 2));
    if (dist < minD) { minD = dist; ts = s; }
  }

  if (ts) {
    if (ts.crafting && ts.crafting.left < ts.crafting.total) {
      window.notify("제작 중인 곳에 겹칠 수 없습니다 ❌", "error");
      window.state.stacks.push({ id: `s${window.nextStackId++}`, x: window.state.draggingStack.x, y: window.state.draggingStack.y, cards: window.state.draggingStack.cards, crafting: null });
    } else {
      ts.cards.push(...window.state.draggingStack.cards); ts.crafting = null; window.checkAndSetRecipe(ts);
    }
  } else {
    window.state.stacks.push({ id: `s${window.nextStackId++}`, x: window.state.draggingStack.x, y: window.state.draggingStack.y, cards: window.state.draggingStack.cards, crafting: null });
    window.checkAndSetRecipe(window.state.stacks[window.state.stacks.length - 1]);
  }
  window.state.draggingStack = null; window.dragData = null; window.renderAll(); window.fb_syncMyState();
});

window.renderAll = function() {
  document.getElementById('score').innerText = window.state.money;
  
  const maxTurnDisplay = document.getElementById('max-turn-display');
  if (maxTurnDisplay) maxTurnDisplay.innerText = `/ ${window.state.maxTurns}`;

  if (window.state.mode.startsWith('multi')) {
     const currentTurnPlayer = window.state.playerIds[(window.state.turnCount - 1) % window.state.playerIds.length];
     const isMyTurn = (currentTurnPlayer === window.state.myPlayerId);
     document.getElementById('turn-status').innerText = isMyTurn ? "진행 턴 (내 차례!)" : `진행 턴 (${currentTurnPlayer} 대기중)`;
     document.getElementById('turn-status').className = isMyTurn ? "text-[10px] font-black text-sky-500 uppercase text-center" : "text-[10px] font-black text-slate-400 uppercase text-center";
  } else document.getElementById('turn-count').innerText = window.state.turnCount;

  document.getElementById('ui-shared-pool').innerHTML = window.state.displayPool.map((id, i) => {
    const t = TILES[id];
    return `<div onclick="window.handlePoolClick(${i})" onmouseenter="window.showTooltip('${id}', event)" onmouseleave="window.hideTooltip()" onmousemove="window.moveTooltip(event)" class="w-12 h-16 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer border-2 bg-white hover:scale-105 shadow-sm border-slate-200"><div class="${t.textColor} drop-shadow-sm mb-1">${t.icon.replace('text-3xl', 'text-xl')}</div><span class="text-[9px] font-black ${t.textColor}">${t.name}</span></div>`;
  }).join('');

  let targetStacks = window.state.stacks;
  if (window.state.viewingOpponent && window.state.viewingPlayerId && window.state.playersData[window.state.viewingPlayerId]) {
     const oppData = window.state.playersData[window.state.viewingPlayerId];
     document.getElementById('overlay-opp-score').innerText = oppData.money;
     const w = document.getElementById('board-area').clientWidth || 800; const h = document.getElementById('board-area').clientHeight || 600;
     targetStacks = oppData.stacks.map(s => ({...s, x: s.xRatio * w, y: s.yRatio * h}));
  }

  let html = targetStacks.map((stack, i) => window.renderStackDOM(stack, false, window.state.viewingOpponent, i)).join(''); 
  if (window.state.draggingStack && !window.state.viewingOpponent) html += window.renderStackDOM(window.state.draggingStack, true, false, 999);
  document.getElementById('board-area').innerHTML = html;

  window.renderMarketPrices(); window.renderProficiency();
  if(!document.getElementById('modal-trade').classList.contains('hidden')) window.renderTradeUI();
};

window.renderProficiency = function() {
  document.getElementById('prof-list').innerHTML = ['farming', 'mining', 'woodcraft', 'cooking', 'smithing'].map(cat => {
    const p = window.state.prof[cat];
    return `<div class="flex flex-col items-center flex-1" title="${CAT_INFO[cat].name}"><div class="text-sm mb-0.5">${CAT_INFO[cat].icon}</div><div class="w-full bg-slate-200 h-1 rounded-full overflow-hidden mb-0.5 shadow-inner"><div class="h-full bg-amber-400" style="width: ${(p.exp/3)*100}%"></div></div><span class="text-[8px] font-black text-slate-600">Lv.${p.lv}</span></div>`;
  }).join('');
};

window.renderMarketPrices = function() {
  document.getElementById('market-prices').innerHTML = SELLABLE_ITEMS.map(id => {
    const t = TILES[id]; const m = window.state.market[id]; if(!m) return '';
    let tIcon = m.trend > 0 ? '<i class="ph-bold ph-trend-up text-emerald-500"></i>' : m.trend < 0 ? '<i class="ph-bold ph-trend-down text-red-500"></i>' : '<i class="ph-bold ph-minus text-slate-400"></i>';
    const fp = window.getFinalPrice(id); const hb = fp > m.currentPrice;
    return `<div class="flex items-center justify-between bg-slate-50 hover:bg-slate-100 p-2.5 rounded-2xl border border-slate-200 transition-colors"><div class="flex items-center gap-2 w-16"><div class="w-6 h-6 rounded flex items-center justify-center bg-white border border-slate-200 ${t.textColor}">${t.icon.replace('text-3xl', 'text-sm')}</div><span class="text-[11px] font-black text-slate-700">${t.name}</span></div><div class="flex items-center gap-3 w-20 justify-end"><div class="flex items-center gap-1 ${m.trend>0?'price-up':m.trend<0?'price-down':'price-neutral'} text-xs font-bold w-12 justify-end">${tIcon} ${Math.abs(m.trend)}</div><div class="flex flex-col items-end w-14 leading-tight relative"><div class="flex items-center gap-0.5 text-sm font-black ${hb ? 'text-amber-600' : 'text-slate-800'}">${fp} <span class="text-[9px] text-amber-500 font-black">G</span></div><span class="text-[8.5px] font-bold text-slate-400">시장가 ${m.currentPrice}</span>${hb ? '<div class="absolute -top-1 -right-2 text-[8px] text-amber-500 animate-bounce">▲</div>' : ''}</div></div></div>`;
  }).join('');
};

window.renderStackDOM = function(stack, isDragging = false, isViewOnly = false, stackIdx = 0) {
  let cardsHtml = stack.cards.map((cardId, idx) => {
    const t = TILES[cardId] || TILES.wood; 
    return `<div class="game-card ${t.cardClass} ${isViewOnly?'pointer-events-none':'pointer-events-auto cursor-grab'}" data-stack-id="${stack.id}" data-card-idx="${idx}" style="top: ${idx * 28}px; z-index: ${idx};" ${isDragging||isViewOnly?'':`onmouseenter="window.showTooltip('${cardId}', event)" onmouseleave="window.hideTooltip()" onmousemove="window.moveTooltip(event)"`}><div class="drop-shadow-sm mb-1">${t.icon.replace('text-3xl', 'text-2xl')}</div><span class="text-[10px] font-black">${t.name}</span></div>`;
  }).join('');
  let craftHtml = '';
  if (stack.crafting) {
    const r = RECIPES.find(r => r.id === stack.crafting.recipeId);
    const rn = r ? Array.from(new Set(r.results.map(id => TILES[id].name))).join(',') : '';
    const ip = stack.crafting.left === stack.crafting.total;
    craftHtml = `<div class="absolute w-[4.5rem] h-[6.5rem] rounded-[0.75rem] bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center border-2 ${ip?'border-sky-300':'border-amber-400'} z-[99]" style="top: ${(stack.cards.length-1)*28}px; pointer-events: none;"><span class="text-[9px] font-black ${ip?'text-sky-100':'text-amber-400'} mb-1 leading-tight text-center px-1 break-keep">${ip?'제작 준비:<br>':'제작 중:<br>'}${rn}</span><div class="text-2xl font-black text-white ${ip?'':'animate-pulse'}">${stack.crafting.left} <span class="text-xs">T</span></div><div class="w-10 h-1.5 bg-slate-700 rounded-full mt-1.5 overflow-hidden"><div class="h-full ${ip?'bg-sky-300':'bg-amber-400'} transition-all" style="width: ${(1-stack.crafting.left/stack.crafting.total)*100}%"></div></div></div>`;
  }
  return `<div ${isDragging?'id="dragging-stack"':''} class="absolute" style="left: ${stack.x}px; top: ${stack.y}px; z-index: ${isDragging?999:10+stackIdx}; ${isDragging?'opacity: 0.95; transform: scale(1.05);':''}">${cardsHtml}${craftHtml}</div>`;
};

window.renderRecipeList = function() {
  const availableRecipes = RECIPES.filter(r => !r.isSpecialty || r.unlockId === window.state.unlockedSpecialty);
  document.getElementById('recipe-list').innerHTML = availableRecipes.map(r => {
    const iH = r.inputs.map(ing => `<div class="w-12 h-14 rounded-xl border border-slate-200 flex flex-col items-center justify-center shadow-sm bg-slate-50 shrink-0"><div class="${TILES[ing].textColor}">${TILES[ing].icon.replace('text-3xl', 'text-xl')}</div><span class="text-[9px] font-black ${TILES[ing].textColor} mt-1">${TILES[ing].name}</span></div>`).join('<span class="text-slate-300 font-bold mx-1 shrink-0">+</span>');
    const rH = r.results.map(res => `<div class="w-12 h-14 rounded-xl border-2 border-sky-200 flex flex-col items-center justify-center shadow-sm bg-sky-50 shrink-0"><div class="${TILES[res].textColor}">${TILES[res].icon.replace('text-3xl', 'text-xl')}</div><span class="text-[9px] font-black ${TILES[res].textColor} mt-1">${TILES[res].name}</span></div>`).join('<span class="text-slate-300 font-bold mx-1 shrink-0">, </span>');
    return `<div class="flex flex-col bg-white p-4 rounded-2xl border border-slate-100 shadow-sm shrink-0"><div class="text-[11px] font-black text-slate-600 mb-2 flex items-center">${r.desc} <span class="text-sky-500 bg-sky-50 px-2 py-0.5 rounded-full ml-1">${r.turns} 턴</span> ${r.tier ? `<span class="text-white bg-indigo-500 px-2 py-0.5 rounded-full ml-1 text-[9px] shadow-sm">Tier ${r.tier}</span>`:''}</div><div class="flex items-center gap-3 overflow-x-auto custom-scroll pb-1"><div class="flex items-center shrink-0">${iH}</div><i class="ph-bold ph-arrow-right text-slate-300 text-xl shrink-0 mx-1"></i><div class="flex items-center shrink-0">${rH}</div></div></div>`;
  }).join('');
};

window.renderNewsList = function() {
  document.getElementById('news-list').innerHTML = window.state.newsHistory.map(n => `<div class="flex flex-col bg-slate-50 p-3 rounded-2xl border border-slate-100 shadow-sm"><div class="flex items-center gap-2 mb-1"><span class="text-[10px] font-black text-white bg-slate-400 px-2 py-0.5 rounded-full">Turn ${n.turn}</span>${n.type === 'up' ? '<i class="ph-bold ph-trend-up text-emerald-500 text-lg"></i>' : n.type === 'down' ? '<i class="ph-bold ph-trend-down text-red-500 text-lg"></i>' : '<i class="ph-bold ph-minus text-slate-400 text-lg"></i>'}</div><p class="text-xs font-bold text-slate-700">${n.msg}</p></div>`).join('');
};

window.toggleTradeModal = function() {
  const m = document.getElementById('modal-trade');
  if(m.classList.contains('hidden')) { m.classList.remove('hidden'); m.classList.add('flex'); window.renderTradeUI(); setTimeout(()=> { m.classList.remove('opacity-0'); m.children[0].classList.remove('scale-95'); }, 10); } 
  else { m.classList.add('opacity-0'); m.children[0].classList.add('scale-95'); setTimeout(()=> { m.classList.add('hidden'); m.classList.remove('flex'); }, 300); }
};

window.renderTradeUI = function() {
  if(document.getElementById('modal-trade').classList.contains('hidden')) return;
  const c = document.getElementById('trade-dynamic-content');
  
  if (!window.state.activeTrade) {
     let opts = `<option value="">거래할 상대를 선택하세요</option>`;
     window.state.playerIds.forEach(p => { if (p !== window.state.myPlayerId) opts += `<option value="${p}">${p}</option>`; });
     c.innerHTML = `<div class="p-8 w-full text-center flex flex-col items-center justify-center min-h-[300px]"><h3 class="text-xl font-black text-slate-700 mb-6">새로운 1:1 거래 시작하기</h3><select id="trade-target-sel" class="p-3 border-2 border-indigo-200 rounded-xl font-black text-indigo-700 mb-6 outline-none">${opts}</select><button onclick="window.initiateTrade()" class="bg-indigo-500 text-white font-black px-8 py-3 rounded-xl hover:bg-indigo-400 shadow-md">거래 요청 보내기</button></div>`;
     return;
  }

  const tr = window.state.activeTrade;
  const isPA = tr.pA === window.state.myPlayerId;
  const isPB = tr.pB === window.state.myPlayerId;

  if (!isPA && !isPB) {
     c.innerHTML = `<div class="p-8 w-full text-center text-slate-500 font-bold min-h-[300px] flex items-center justify-center">현재 ${tr.pA} 님과 ${tr.pB} 님이 거래를 진행/준비 중입니다.<br>끝날 때까지 잠시 기다려 주세요.</div>`;
     return;
  }

  if (tr.status === 'requested') {
      if (isPA) {
          c.innerHTML = `<div class="p-8 w-full text-center flex flex-col items-center justify-center min-h-[300px]"><h3 class="text-xl font-black text-slate-700 mb-6">${tr.pB}님의 수락을 기다리는 중입니다... ⏳</h3><button onclick="window.cancelTrade()" class="bg-rose-500 text-white font-black px-8 py-3 rounded-xl hover:bg-rose-400 shadow-md">요청 취소</button></div>`;
      } else {
          c.innerHTML = `<div class="p-8 w-full text-center flex flex-col items-center justify-center min-h-[300px]"><h3 class="text-2xl font-black text-indigo-600 mb-2">🤝 거래 요청</h3><p class="text-slate-600 font-bold mb-6">${tr.pA}님이 1:1 거래를 요청했습니다.</p><div class="flex gap-4"><button onclick="window.acceptTradeRequest()" class="bg-indigo-500 text-white font-black px-8 py-3 rounded-xl hover:bg-indigo-400 shadow-md">수락</button><button onclick="window.cancelTrade()" class="bg-slate-300 text-slate-700 font-black px-8 py-3 rounded-xl hover:bg-slate-200 shadow-md">거절</button></div></div>`;
      }
      return;
  }

  const oppName = isPA ? tr.pB : tr.pA;
  const myTrade = isPA ? {money: tr.pAMoney, items: tr.pAItems, accept: tr.pAAccept} : {money: tr.pBMoney, items: tr.pBItems, accept: tr.pBAccept};
  const oppTrade = isPA ? {money: tr.pBMoney, items: tr.pBItems, accept: tr.pBAccept} : {money: tr.pAMoney, items: tr.pAItems, accept: tr.pAAccept};

  let inv = {}; window.state.stacks.forEach(s => s.cards.forEach(card => inv[card] = (inv[card]||0) + 1));
  myTrade.items.forEach(card => { if(inv[card]) inv[card]--; });
  const invHtml = Object.entries(inv).filter(([k,v])=>v>0).map(([k,v]) => `<div onclick="window.addToOffer('${k}')" class="px-2 py-1 bg-white border border-slate-200 rounded cursor-pointer hover:bg-sky-50 flex items-center gap-1 shadow-sm"><span class="${TILES[k].textColor}">${TILES[k].icon.replace('text-3xl','text-sm')}</span> <span class="text-[10px] font-bold text-slate-700">${TILES[k].name} x${v}</span></div>`).join('') || '<span class="text-[10px] text-slate-400">자원이 없습니다.</span>';
  const myOfferHtml = myTrade.items.map((k, idx) => `<div onclick="window.removeFromOffer(${idx})" class="px-2 py-1 bg-white border border-sky-300 rounded cursor-pointer hover:bg-rose-50 flex items-center gap-1 shadow-sm"><span class="${TILES[k].textColor}">${TILES[k].icon.replace('text-3xl','text-sm')}</span> <span class="text-[10px] font-bold text-slate-700">${TILES[k].name}</span></div>`).join('') || '<span class="text-[10px] text-sky-400">클릭하여 자원을 올려주세요.</span>';
  const oppOfferHtml = oppTrade.items.map(k => `<div class="px-2 py-1 bg-white border border-rose-300 rounded flex items-center gap-1 shadow-sm pointer-events-none"><span class="${TILES[k].textColor}">${TILES[k].icon.replace('text-3xl','text-sm')}</span> <span class="text-[10px] font-bold text-slate-700">${TILES[k].name}</span></div>`).join('') || '<span class="text-[10px] text-rose-400">제안된 자원이 없습니다.</span>';

  c.innerHTML = `
    <div class="flex-1 border-r border-slate-100 p-5 flex flex-col gap-4 overflow-y-auto custom-scroll relative">
      <button onclick="window.cancelTrade()" class="absolute top-2 right-2 text-xs bg-slate-100 text-slate-500 font-bold px-2 py-1 rounded hover:bg-rose-100 hover:text-rose-600">거래 파기</button>
      <h3 class="font-black text-sky-600 text-center bg-sky-50 py-1 rounded-lg">내가 줄 물건</h3>
      <div class="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200">
        <span class="text-xs font-black text-slate-600">골드 제안</span>
        <div class="flex items-center gap-2">
          <button onclick="window.adjTradeMoney(-100)" class="px-2 py-0.5 bg-slate-200 rounded text-xs font-bold">-100</button>
          <span class="font-black text-amber-500 w-12 text-center">${myTrade.money} G</span>
          <button onclick="window.adjTradeMoney(100)" class="px-2 py-0.5 bg-slate-200 rounded text-xs font-bold">+100</button>
        </div>
      </div>
      <div class="text-xs font-black text-slate-500 mt-2">내 영지의 자원 (클릭하여 추가)</div>
      <div class="flex flex-wrap gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 min-h-[60px]">${invHtml}</div>
      <div class="text-xs font-black text-sky-500 mt-2">현재 제안 품목 (클릭하여 빼기)</div>
      <div class="flex flex-wrap gap-2 p-3 bg-sky-50 rounded-xl border border-sky-200 min-h-[80px]">${myOfferHtml}</div>
    </div>
    <div class="flex-1 p-5 flex flex-col gap-4 overflow-y-auto custom-scroll">
      <h3 class="font-black text-rose-600 text-center bg-rose-50 py-1 rounded-lg">${oppName}님이 줄 물건</h3>
      <div class="flex items-center justify-center bg-slate-50 p-2 rounded-xl border border-slate-200 mt-1">
        <span class="font-black text-amber-500 text-lg">${oppTrade.money} G</span>
      </div>
      <div class="text-xs font-black text-rose-500 mt-2">상대방 제안 품목</div>
      <div class="flex flex-wrap gap-2 p-3 bg-rose-50 rounded-xl border border-rose-200 min-h-[160px] content-start">${oppOfferHtml}</div>
      <div class="mt-auto flex flex-col gap-2">
         <div class="text-center text-[10px] font-bold text-slate-500">조건을 바꾸면 양측의 수락이 취소됩니다.</div>
         <button onclick="window.acceptTradeNegotiation()" class="py-3 ${myTrade.accept ? 'bg-slate-300 text-slate-500' : 'bg-purple-600 text-white hover:bg-purple-500'} font-black rounded-xl transition-colors shadow-md flex items-center justify-center gap-2">
           <i class="ph-bold ${myTrade.accept ? 'ph-hourglass' : 'ph-check-circle'}"></i> ${myTrade.accept ? '상대방 최종 수락 대기 중...' : '현재 조건으로 거래 확정!'}
         </button>
      </div>
    </div>
  `;
};

window.initiateTrade = async function() {
  const sel = document.getElementById('trade-target-sel');
  if(!sel || !sel.value) return window.notify("상대방을 선택하세요", "error");
  const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', window.state.roomId);
  await updateDoc(roomRef, {
      activeTrade: { status: 'requested', pA: window.state.myPlayerId, pB: sel.value }
  });
  window.state.localTradeOffer = { money: 0, items: [] };
};

window.acceptTradeRequest = async function() {
  const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', window.state.roomId);
  await updateDoc(roomRef, {
      'activeTrade.status': 'negotiating',
      'activeTrade.pAMoney': 0, 'activeTrade.pAItems': [],
      'activeTrade.pBMoney': 0, 'activeTrade.pBItems': [],
      'activeTrade.pAAccept': false, 'activeTrade.pBAccept': false
  });
};

window.cancelTrade = async function() {
  const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', window.state.roomId);
  await updateDoc(roomRef, { activeTrade: null });
  window.state.localTradeOffer = { money: 0, items: [] };
  window.notify("거래가 취소되었습니다.", "info");
};

window.adjTradeMoney = async function(amt) {
  if(!window.state.activeTrade) return;
  const isPA = window.state.activeTrade.pA === window.state.myPlayerId;
  const curM = isPA ? window.state.activeTrade.pAMoney : window.state.activeTrade.pBMoney;
  const newM = curM + amt;
  if (newM < 0 || newM > window.state.money) return window.notify("보유한 골드를 초과할 수 없습니다.", "error");
  
  const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', window.state.roomId);
  await updateDoc(roomRef, {
     [`activeTrade.${isPA ? 'pAMoney' : 'pBMoney'}`]: newM,
     'activeTrade.pAAccept': false, 'activeTrade.pBAccept': false 
  });
};

window.addToOffer = async function(itemId) { 
  const isPA = window.state.activeTrade.pA === window.state.myPlayerId;
  const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', window.state.roomId);
  await updateDoc(roomRef, {
     [`activeTrade.${isPA ? 'pAItems' : 'pBItems'}`]: arrayUnion(itemId),
     'activeTrade.pAAccept': false, 'activeTrade.pBAccept': false 
  });
};

window.removeFromOffer = async function(idx) { 
  const isPA = window.state.activeTrade.pA === window.state.myPlayerId;
  const curItems = isPA ? [...window.state.activeTrade.pAItems] : [...window.state.activeTrade.pBItems];
  curItems.splice(idx, 1);
  const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', window.state.roomId);
  await updateDoc(roomRef, {
     [`activeTrade.${isPA ? 'pAItems' : 'pBItems'}`]: curItems,
     'activeTrade.pAAccept': false, 'activeTrade.pBAccept': false 
  });
};

window.acceptTradeNegotiation = async function() {
  const isPA = window.state.activeTrade.pA === window.state.myPlayerId;
  const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', window.state.roomId);
  await updateDoc(roomRef, { [`activeTrade.${isPA ? 'pAAccept' : 'pBAccept'}`]: true });
};

window.toggleChat = function() {
  const c = document.getElementById('chat-container'); const ic = document.getElementById('chat-icon');
  window.state.isChatOpen = !window.state.isChatOpen;
  if (window.state.isChatOpen) { c.classList.remove('chat-closed'); c.classList.add('chat-open'); ic.classList.replace('ph-caret-up', 'ph-caret-down'); document.getElementById('chat-unread').classList.add('hidden'); } 
  else { c.classList.remove('chat-open'); c.classList.add('chat-closed'); ic.classList.replace('ph-caret-down', 'ph-caret-up'); }
};

window.renderChat = function(msgs) {
  window.state.chat = msgs; const box = document.getElementById('chat-messages');
  box.innerHTML = msgs.map(m => {
     const isMe = m.sender === window.state.myPlayerId;
     const whisperLabel = m.target !== 'all' ? `<span class="text-[9px] text-indigo-400 font-bold block mb-0.5">[귓속말: ${isMe ? 'To '+m.target : 'From '+m.sender}]</span>` : `<span class="text-[9px] text-slate-400 font-bold block mb-0.5">[${m.sender}]</span>`;
     return `<div class="flex ${isMe?'justify-end':'justify-start'}"><div class="max-w-[80%] px-3 py-1.5 rounded-xl ${isMe?'bg-indigo-500 text-white rounded-br-none':'bg-white border border-slate-200 text-slate-700 rounded-bl-none'} shadow-sm">${whisperLabel}${m.msg}</div></div>`;
  }).join('');
  box.scrollTop = box.scrollHeight;
};

window.sendChat = async function() {
  const input = document.getElementById('chat-input'); const text = input.value.trim();
  const target = document.getElementById('chat-target-select').value; 
  if (!text || !window.state.mode.startsWith('multi') || !user) return;
  const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', window.state.roomId);
  await updateDoc(roomRef, { chat: arrayUnion({ sender: window.state.myPlayerId, target: target, msg: text, time: Date.now() }) });
  input.value = '';
};

window.addEventListener("beforeunload", (e) => {
    if (window.state.mode.startsWith('multi') && window.state.roomId && user) {
        const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', window.state.roomId);
        deleteDoc(roomRef).catch(()=>{}); 
    }
});

  </script>
</body>
</html>
