// ui_render.js
import { TILES, RECIPES, SELLABLE_ITEMS, CAT_INFO } from './data.js';

const norm = (id) => window.normalizeCard ? window.normalizeCard(id) : id.replace('_upgraded', '');

window.renderAll = function() {
    const scoreEl = document.getElementById('score'); if(scoreEl) scoreEl.innerText = window.state.money;
    const maxTurnDisplay = document.getElementById('max-turn-display'); if (maxTurnDisplay) maxTurnDisplay.innerText = `/ ${window.state.maxTurns}`;
    const turnCountEl = document.getElementById('turn-count'); if(turnCountEl) turnCountEl.innerText = window.state.turnCount;

    const poolEl = document.getElementById('ui-shared-pool');
    if(poolEl) {
        poolEl.innerHTML = window.state.displayPool.map((id, i) => {
          const t = TILES[norm(id)];
          // 💡 공용 풀 카드에도 onwheel 이벤트 추가
          return `<div onclick="window.handlePoolClick(${i})" onmouseenter="window.showTooltip('${id}', event)" onmouseleave="window.hideTooltip()" onmousemove="window.moveTooltip(event)" onwheel="window.scrollTooltip(event)" class="w-12 h-16 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer border-2 bg-white hover:scale-105 shadow-sm border-slate-200"><div class="${t.textColor} drop-shadow-sm mb-1">${t.icon.replace('text-3xl', 'text-xl')}</div><span class="text-[9px] font-black ${t.textColor}">${t.name}</span></div>`;
        }).join('');
    }

    let targetStacks = window.state.stacks;
    let html = targetStacks.map((stack, i) => window.renderStackDOM(stack, false, false, i)).join(''); 
    if (window.state.draggingStack) html += window.renderStackDOM(window.state.draggingStack, true, false, 999);
    
    const boardArea = document.getElementById('board-area'); if(boardArea) boardArea.innerHTML = html;

    const activeQuestBox = document.getElementById('active-quest-box');
    if (activeQuestBox && window.state.activeQuest) {
        activeQuestBox.classList.remove('hidden'); activeQuestBox.classList.add('flex');
        document.getElementById('quest-timer').innerText = `${window.state.questTimer}턴 남음`;
        document.getElementById('quest-req-text').innerText = `${TILES[window.state.activeQuest.reqItem].name} ${window.state.activeQuest.reqCount}개`;
    } else if (activeQuestBox) {
        activeQuestBox.classList.add('hidden'); activeQuestBox.classList.remove('flex');
    }

    window.renderRecipeList();
    window.renderMarketPrices(); 
    window.renderProficiency();
};

window.renderProficiency = function() {
  const profList = document.getElementById('prof-list'); if(!profList) return;
  profList.innerHTML = ['farming', 'mining', 'woodcraft', 'cooking', 'smithing'].map(cat => {
    const p = window.state.prof[cat]; let pct = 0;
    if (p.lv === 1) pct = (p.exp / 10) * 100; else if (p.lv === 2) pct = ((p.exp - 10) / 10) * 100; else if (p.lv === 3) pct = ((p.exp - 20) / 30) * 100; else pct = 100;
    return `<div class="flex flex-col items-center flex-1" title="${CAT_INFO[cat].name}"><div class="text-sm mb-0.5">${CAT_INFO[cat].icon}</div><div class="w-full bg-slate-200 h-1 rounded-full overflow-hidden mb-0.5 shadow-inner"><div class="h-full ${p.lv >= 3 ? 'bg-purple-500' : 'bg-amber-400'}" style="width: ${pct}%"></div></div><span class="text-[8px] font-black text-slate-600">Lv.${p.lv}</span></div>`;
  }).join('');
};

window.renderMarketPrices = function() {
  const marketPrices = document.getElementById('market-prices'); if(!marketPrices) return;
  marketPrices.innerHTML = SELLABLE_ITEMS.map(id => {
    const t = TILES[id]; const m = window.state.market[id]; if(!m) return '';
    let tIcon = m.trend > 0 ? '<i class="ph-bold ph-trend-up text-emerald-500"></i>' : m.trend < 0 ? '<i class="ph-bold ph-trend-down text-red-500"></i>' : '<i class="ph-bold ph-minus text-slate-400"></i>';
    const fp = window.getFinalPrice(id); const hb = fp > m.currentPrice;
    return `<div class="flex items-center justify-between bg-slate-50 hover:bg-slate-100 p-2.5 rounded-2xl border border-slate-200 transition-colors"><div class="flex items-center gap-2 w-16"><div class="w-6 h-6 rounded flex items-center justify-center bg-white border border-slate-200 ${t.textColor}">${t.icon.replace('text-3xl', 'text-sm')}</div><span class="text-[11px] font-black text-slate-700">${t.name}</span></div><div class="flex items-center gap-3 w-20 justify-end"><div class="flex items-center gap-1 ${m.trend>0?'price-up':m.trend<0?'price-down':'price-neutral'} text-xs font-bold w-12 justify-end">${tIcon} ${Math.abs(m.trend)}</div><div class="flex flex-col items-end w-14 leading-tight relative"><div class="flex items-center gap-0.5 text-sm font-black ${hb ? 'text-amber-600' : 'text-slate-800'}">${fp} <span class="text-[9px] text-amber-500 font-black">G</span></div><span class="text-[8.5px] font-bold text-slate-400">시장가 ${m.currentPrice}</span>${hb ? '<div class="absolute -top-1 -right-2 text-[8px] text-amber-500 animate-bounce">▲</div>' : ''}</div></div></div>`;
  }).join('');
};

window.renderRecipeList = function() {
  const recipeList = document.getElementById('recipe-list'); if(!recipeList) return;
  const specialty = window.state ? window.state.unlockedSpecialty : null;
  const availableRecipes = RECIPES.filter(r => !r.isSpecialty || r.unlockId === specialty);

  recipeList.innerHTML = availableRecipes.map(r => {
    const iH = r.inputs.map(ing => `<div class="w-12 h-14 rounded-xl border border-slate-200 flex flex-col items-center justify-center shadow-sm bg-slate-50 shrink-0"><div class="${TILES[ing].textColor}">${TILES[ing].icon.replace('text-3xl', 'text-xl')}</div><span class="text-[9px] font-black ${TILES[ing].textColor} mt-1">${TILES[ing].name}</span></div>`).join('<span class="text-slate-300 font-bold mx-1 shrink-0">+</span>');
    const rH = r.results.map(res => `<div class="w-12 h-14 rounded-xl border-2 border-sky-200 flex flex-col items-center justify-center shadow-sm bg-sky-50 shrink-0"><div class="${TILES[res].textColor}">${TILES[res].icon.replace('text-3xl', 'text-xl')}</div><span class="text-[9px] font-black ${TILES[res].textColor} mt-1">${TILES[res].name}</span></div>`).join('<span class="text-slate-300 font-bold mx-1 shrink-0">, </span>');
    return `<div class="flex flex-col bg-white p-4 rounded-2xl border border-slate-100 shadow-sm shrink-0 mb-3"><div class="text-[11px] font-black text-slate-600 mb-2 flex items-center">${r.desc} <span class="text-sky-500 bg-sky-50 px-2 py-0.5 rounded-full ml-1">${r.turns} 턴</span></div><div class="flex items-center gap-3 overflow-x-auto pb-1"><div class="flex items-center shrink-0">${iH}</div><i class="ph-bold ph-arrow-right text-slate-300 text-xl shrink-0 mx-1"></i><div class="flex items-center shrink-0">${rH}</div></div></div>`;
  }).join('');
};

window.renderStackDOM = function(stack, isDragging = false, isViewOnly = false, stackIdx = 0) {
  let cardsHtml = stack.cards.map((cardId, idx) => {
    let pureId = norm(cardId); const t = TILES[pureId] || TILES.wood; 
    let upgradedUI = cardId.endsWith('_upgraded') ? '<div class="absolute -top-2 -right-2 text-slate-600 drop-shadow-md text-lg"><i class="ph-fill ph-star"></i></div>' : '';
    // 💡 필드 카드에도 onwheel 이벤트 추가
    return `<div class="game-card ${t.cardClass} pointer-events-auto cursor-grab" data-stack-id="${stack.id}" data-card-idx="${idx}" style="top: ${idx * 28}px; z-index: ${idx};" onmouseenter="window.showTooltip('${pureId}', event)" onmouseleave="window.hideTooltip()" onmousemove="window.moveTooltip(event)" onwheel="window.scrollTooltip(event)">${upgradedUI}<div class="drop-shadow-sm mb-1">${t.icon.replace('text-3xl', 'text-2xl')}</div><span class="text-[10px] font-black">${t.name}</span></div>`;
  }).join('');

  let craftHtml = '';
  if (stack.crafting) {
    const r = RECIPES.find(rec => rec.id === stack.crafting.recipeId);
    const resultNames = r ? r.results.map(id => TILES[norm(id)].name).join(',') : '...';
    const progress = (1 - stack.crafting.left / stack.crafting.total) * 100;
    
    // 💡 제작창 우선순위를 z-[99]에서 z-[300]으로 상향! (호버해도 안 가려짐)
    craftHtml = `
      <div class="absolute w-[4.5rem] h-[6.5rem] rounded-[0.75rem] bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center border-2 border-amber-400 z-[300]" style="top: ${(stack.cards.length-1)*28}px; pointer-events: none;">
        <span class="text-[8px] font-black text-amber-400 mb-1 leading-tight text-center px-1">제작 중:<br>${resultNames}</span>
        <div class="text-2xl font-black text-white animate-pulse">${stack.crafting.left} <span class="text-xs">T</span></div>
        <div class="w-10 h-1 bg-slate-700 rounded-full mt-2 overflow-hidden">
          <div class="h-full bg-amber-400 transition-all duration-300" style="width: ${progress}%"></div>
        </div>
      </div>`;
  }
  return `<div ${isDragging?'id="dragging-stack"':''} class="absolute" style="left: ${stack.x}px; top: ${stack.y}px; z-index: ${isDragging?999:10+stackIdx}; transition: left 0.2s cubic-bezier(0.2, 0, 0, 1), top 0.2s cubic-bezier(0.2, 0, 0, 1);">${cardsHtml}${craftHtml}</div>`;
};