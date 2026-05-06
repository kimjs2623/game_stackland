// engine.js
import { TILES, RECIPES, SELLABLE_ITEMS, PROCESSING_ITEMS, TIER1_ITEMS, TIER2_ITEMS, CAT_INFO, MARKET_EVENTS, SKY_CHANCES } from './data.js';

export const normalizeCard = (c) => c ? c.replace('_upgraded', '') : '';
window.normalizeCard = normalizeCard;

window.countItemOnBoard = function(itemId) {
    let count = 0;
    window.state.stacks.forEach(s => { s.cards.forEach(c => { if(normalizeCard(c) === itemId) count++; }); });
    return count;
};

window.removeItemsFromBoard = function(itemId, amount) {
    let remaining = amount;
    for (let i = 0; i < window.state.stacks.length && remaining > 0; i++) {
        let s = window.state.stacks[i];
        for (let j = s.cards.length - 1; j >= 0 && remaining > 0; j--) {
            if (normalizeCard(s.cards[j]) === itemId) { s.cards.splice(j, 1); remaining--; }
        }
    }
    window.state.stacks = window.state.stacks.filter(s => s.cards.length > 0);
};

window.unlockTech = function(techId, cost) {
    let total = (window.state.warehouseItems['research'] || 0) + window.countItemOnBoard('research');
    if (total < cost) return window.notify("연구 데이터가 부족합니다.", "error");
    
    let needed = cost;
    while(needed > 0 && window.state.warehouseItems['research'] > 0) { window.state.warehouseItems['research']--; needed--; }
    if (needed > 0) window.removeItemsFromBoard('research', needed);

    window.state.tech[techId] = true;
    window.notify("기술 연구가 완료되었습니다! 🧪", "success");
    window.toggleTechModal(); window.renderAll();
};

window.acceptQuest = function(reqItem, reqCount, reward) {
    window.state.activeQuest = { reqItem, reqCount, reward };
    window.state.questTimer = 10;
    const m = document.getElementById('modal-quest');
    if(m) {
        m.classList.add('opacity-0'); m.children[0].classList.add('scale-95');
        setTimeout(() => { m.classList.add('hidden'); m.classList.remove('flex'); }, 300);
    }
    window.notify("새로운 의뢰를 수락했습니다!", "action"); window.renderAll();
};

window.completeQuest = function() {
    let q = window.state.activeQuest; if (!q) return;
    
    let total = (window.state.warehouseItems[q.reqItem] || 0) + window.countItemOnBoard(q.reqItem);
    if (total < q.reqCount) return window.notify(`${TILES[q.reqItem].name} ${q.reqCount}개가 필요합니다.`, "error");

    let needed = q.reqCount;
    while(needed > 0 && window.state.warehouseItems[q.reqItem] > 0) { window.state.warehouseItems[q.reqItem]--; needed--; }
    if (needed > 0) window.removeItemsFromBoard(q.reqItem, needed);

    window.state.money += q.reward;
    window.state.activeQuest = null;
    
    // [신규] 스카이 찬스 랜덤 발동
    const chance = SKY_CHANCES[Math.floor(Math.random() * SKY_CHANCES.length)];
    window.applySkyChance(chance);

    window.notify(`의뢰 완료! <span class="text-amber-500 font-black">+${q.reward} G</span><br><span class="text-sky-500">스카이 찬스: ${chance.name} 발동!</span>`, "success");
    window.renderAll();
};

window.applySkyChance = function(chance) {
    const cx = 1200, cy = 800;
    const drop = (items) => items.forEach((item, i) => window.state.stacks.push({ id: `sc_${Date.now()}_${i}`, x: cx + (Math.random()-0.5)*100, y: cy + (Math.random()-0.5)*100, cards: [item], crafting: null }));

    if (chance.id === 1) { // 벼락치기
        let craftingStack = window.state.stacks.find(s => s.crafting);
        if(craftingStack) craftingStack.crafting.left = 0;
    } else if (chance.id === 2) { drop(['wood','wood','wood','stone','stone','stone','wheat','wheat','wheat']); }
    else if (chance.id === 3) { drop(['bread','bread','iron','iron']); }
    else if (chance.id === 4) { drop(['villager']); }
    else if (chance.id === 5) { // 장인의 비급
        Object.keys(window.state.prof).forEach(k => {
            window.state.prof[k].exp += 20;
            window.state.prof[k].lv = window.state.prof[k].exp >= 50 ? 4 : (window.state.prof[k].exp >= 20 ? 3 : (window.state.prof[k].exp >= 10 ? 2 : 1));
        });
    } else if (chance.id === 6) { // 설계 자동화 (간소화 적용)
        drop(['paper', 'brick']);
    } else if (chance.id === 7) { window.state.money += 500; }
    else if (chance.id === 8) { drop(['warehouse_building']); }
    else if (chance.id === 9) { drop(['research']); }
    else if (chance.id === 10) { drop(['wood', 'stone', 'iron', 'wheat', 'water']); }
};

window.evaluatePool = function() {
    const counts = {}; let maxFreq = 0;
    window.state.displayPool.forEach(id => { counts[id] = (counts[id] || 0) + 1; if (counts[id] > maxFreq) maxFreq = counts[id]; });
    const rerollBtn = document.getElementById('btn-reroll-pool'); if(!rerollBtn) return;
    if (maxFreq === 4) { window.notify("자동 갱신됩니다 🔄", "info"); window.state.displayPool = window.state.displayPool.map(() => window.state.sharedPool.shift() || 'wood'); window.evaluatePool(); } 
    else if (maxFreq === 3) { rerollBtn.classList.remove('hidden'); rerollBtn.classList.add('flex'); } 
    else { rerollBtn.classList.add('hidden'); rerollBtn.classList.remove('flex'); }
};

window.rerollPool = function() {
    window.state.displayPool = window.state.displayPool.map(() => window.state.sharedPool.shift() || 'wood');
    window.notify("선택지를 초기화했습니다 🔄", "action"); window.evaluatePool(); window.renderAll();
};

window.handlePoolClick = function(poolIdx) {
    if (window.state.isGameOver || window.state.viewingOpponent) return;
    const picked = window.state.displayPool[poolIdx];
    const wrapper = document.getElementById('board-wrapper');
    const br = document.getElementById('board-area').getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();
    const cx = (wrapperRect.left + wrapper.clientWidth / 2 - br.left) / window.state.zoom - 40;
    const cy = (wrapperRect.top + wrapper.clientHeight / 2 - br.top) / window.state.zoom - 50;

    window.state.stacks.push({ id: `s${window.nextStackId++}`, x: cx, y: cy, cards: [picked], crafting: null });
    window.state.displayPool[poolIdx] = window.state.sharedPool.shift() || 'wood';
    window.evaluatePool(); window.processTurnEnd();
};

window.processTurnEnd = function() {
    if (window.state.activeQuest) {
        window.state.questTimer--;
        if (window.state.questTimer <= 0) {
            window.state.activeQuest = null; window.notify("시간 초과로 의뢰가 취소되었습니다.", "error");
        }
    }

    let hasWarehouse = window.state.tech && window.state.tech.warehouse && window.countItemOnBoard('warehouse_building') > 0;

    window.state.stacks.forEach(stack => {
      if (stack.crafting) {
        stack.crafting.left--;
        if (stack.crafting.left <= 0) {
          const recipe = RECIPES.find(r => r.id === stack.crafting.recipeId);
          let finalCards = [...recipe.results];

          if (recipe.id === 'r8' && Math.random() < 0.5) { finalCards.push('seed'); }

          let isUpgraded = stack.cards.some(c => c.endsWith('_upgraded'));
          let pureOutputs = [...recipe.results];
          recipe.inputs.forEach(inp => { let idx = pureOutputs.indexOf(inp); if (idx !== -1) pureOutputs.splice(idx, 1); });
          
          if (recipe.category && recipe.category !== 'general') {
             let p = window.state.prof[recipe.category];
             p.exp += 0.2; 
             p.lv = p.exp >= 50 ? 4 : (p.exp >= 20 ? 3 : (p.exp >= 10 ? 2 : 1));

             let isBuildingProd = recipe.inputs.includes('villager') && recipe.inputs.some(i => ['lumber_mill', 'quarry', 'farm', 'furnace', 'well'].includes(i));
             let multiplier = (p.lv >= 3 && isBuildingProd) ? 2 : 1;

             finalCards = [...recipe.results]; 
             for(let i=1; i<multiplier; i++) finalCards.push(...pureOutputs);
             if (isUpgraded && isBuildingProd) finalCards.push(...pureOutputs);
          }
          
          stack.cards.forEach(c => {
              if (c.endsWith('_upgraded')) { let base = c.replace('_upgraded', ''); let idx = finalCards.indexOf(base); if (idx !== -1) finalCards[idx] = c; }
          });

          if (hasWarehouse) {
              let toBoard = [];
              finalCards.forEach(c => {
                  let bc = normalizeCard(c);
                  if (['villager', 'lumber_mill', 'quarry', 'farm', 'house', 'furnace', 'well', 'laboratory', 'warehouse_building'].includes(bc)) toBoard.push(c);
                  else window.state.warehouseItems[bc] = (window.state.warehouseItems[bc] || 0) + 1;
              });
              stack.cards = toBoard;
          } else {
              stack.cards = finalCards;
          }
          stack.crafting = null; if (stack.cards.length > 0) window.checkAndSetRecipe(stack);
        }
      }
    });
    window.state.stacks = window.state.stacks.filter(s => s.cards.length > 0);

    let ev = null;
    if (window.state.turnCount % 5 === 0 && Math.random() < 0.4) {
      ev = MARKET_EVENTS[Math.floor(Math.random() * MARKET_EVENTS.length)];
      window.state.newsHistory.unshift({ turn: window.state.turnCount + 1, msg: ev.msg, type: ev.type });
      window.showNewsSplash(ev.title, ev.msg, ev.type);
    }

    // [수정] 퀘스트는 무조건 10턴부터 시작, 이후 5턴 주기
    if (window.state.turnCount >= 10 && window.state.turnCount % 5 === 0) {
        window.showQuestDraft();
    }

    let targetPrices = {};
    SELLABLE_ITEMS.forEach(id => {
        const m = window.state.market[id]; const sf = Math.max(0.2, 1 - (m.supply * 0.08)); 
        targetPrices[id] = TILES[id].basePrice * sf * (1 + (Math.random() * 0.1 - 0.05) * TILES[id].volatility) * ((ev && ev.target === id) ? ev.effect : 1);
    });

    SELLABLE_ITEMS.forEach(id => {
      const m = window.state.market[id]; m.previousPrice = m.currentPrice;
      m.supply += m.pendingSupply; m.pendingSupply = 0; m.supply *= 0.85; 
      m.currentPrice = Math.max(1, Math.floor(m.previousPrice * 0.5 + targetPrices[id] * 0.5));
      m.trend = m.currentPrice - m.previousPrice;
    });

    if (window.state.turnCount >= window.state.maxTurns) { window.endGame(); return; }
    window.state.turnCount++; window.renderAll();
};

window.checkAndSetRecipe = function(stack) {
    stack.crafting = null; if (stack.cards.length < 2) return;
    const currentSorted = [...stack.cards].map(normalizeCard).sort().join(',');
    const matched = RECIPES.filter(r => !r.isSpecialty || r.unlockId === window.state.unlockedSpecialty).find(r => [...r.inputs].sort().join(',') === currentSorted);
    if (matched) { 
        if (matched.tier === 2 && window.state.tech && !window.state.tech.tier_2) return window.notify("2차 특산물은 기술 연구가 필요합니다.", "error");
        let turns = matched.turns;
        if (matched.tier === 2 && window.state.prof[matched.category]?.lv >= 4) turns = Math.max(1, turns - 1);
        stack.crafting = { recipeId: matched.id, left: turns, total: turns };
    }
};

window.getFinalPrice = function(itemId) {
    if (!window.state.market[itemId]) return 0;
    const base = window.state.market[itemId].currentPrice; const cat = TILES[itemId].category;
    return cat && window.state.prof[cat] ? Math.floor(base * (1 + (window.state.prof[cat].lv - 1) * 0.15)) : base;
};

window.initMarket = function() {
    window.state.market = {};
    SELLABLE_ITEMS.forEach(id => { window.state.market[id] = { currentPrice: TILES[id].basePrice, previousPrice: TILES[id].basePrice, trend: 0, supply: 0, pendingSupply: 0 }; });
    window.state.newsHistory = [{ turn: 1, msg: "시장이 개장되었습니다.", type: "up" }];
};

window.endGame = function() {
    window.state.isGameOver = true;
    document.getElementById('result-score').innerText = window.state.money;
    window.showScreen('screen-result');
};