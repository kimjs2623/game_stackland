// ui.js
import { TILES, RECIPES, SELLABLE_ITEMS, SPECIALTY_OPTIONS_ALL, CAT_INFO, PROCESSING_ITEMS, TIER1_ITEMS, TIER2_ITEMS, UPGRADABLE_BUILDINGS } from './data.js';

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

window.showFloatingText = function(x, y, text, colorClass) {
    const board = document.getElementById('board-area'); if(!board) return;
    const el = document.createElement('div');
    el.className = `absolute z-[1000] font-black text-[13px] bg-white/90 border border-slate-200 px-3 py-1.5 rounded-lg drop-shadow-md animate-float-up ${colorClass}`;
    el.style.left = `${x}px`; el.style.top = `${y}px`; el.innerText = text;
    board.appendChild(el); setTimeout(() => el.remove(), 1200);
};

window.showScreen = function(id) {
    ['screen-menu', 'screen-waiting', 'screen-game', 'screen-result'].forEach(s => {
        const el = document.getElementById(s);
        if(el) { el.classList.add('hidden'); el.classList.remove('opacity-100'); el.classList.add('opacity-0'); }
    });
    const target = document.getElementById(id);
    if(target) {
        target.classList.remove('hidden');
        setTimeout(() => { 
            target.classList.remove('opacity-0'); target.classList.add('opacity-100'); 
            if (id === 'screen-game') {
                target.classList.add('flex'); 
                setTimeout(() => {
                    const wrapper = document.getElementById('board-wrapper');
                    if (wrapper) {
                        wrapper.scrollLeft = 1200 - wrapper.clientWidth / 2;
                        wrapper.scrollTop = 800 - wrapper.clientHeight / 2;
                    }
                }, 100);
            }
        }, 50);
    }
};

window.setZoom = function(delta) {
    window.state.zoom = Math.max(0.4, Math.min(1.5, window.state.zoom + delta));
    const zt = document.getElementById('zoom-level-text'); if(zt) zt.innerText = Math.round(window.state.zoom * 100) + '%';
    const ba = document.getElementById('board-area'); if(ba) ba.style.transform = `scale(${window.state.zoom})`;
};

window.takeFromWarehouse = function(itemId) {
    if (window.state.warehouseItems[itemId] > 0) {
        window.state.warehouseItems[itemId]--;
        const wrapper = document.getElementById('board-wrapper');
        const br = document.getElementById('board-area').getBoundingClientRect();
        const wrapperRect = wrapper.getBoundingClientRect();
        const cx = (wrapperRect.left + wrapper.clientWidth / 2 - br.left) / window.state.zoom + (Math.random()-0.5)*50;
        const cy = (wrapperRect.top + wrapper.clientHeight / 2 - br.top) / window.state.zoom + (Math.random()-0.5)*50;

        window.state.stacks.push({ id: `s${window.nextStackId++}`, x: cx, y: cy, cards: [itemId], crafting: null });
        window.renderAll();
    }
};

window.toggleWarehouse = function() {
    const wp = document.getElementById('warehouse-panel'); if(!wp) return;
    if(wp.classList.contains('hidden')) { wp.classList.remove('hidden'); wp.classList.add('flex'); wp.style.left = '24px'; wp.style.top = '24px'; } 
    else { wp.classList.add('hidden'); wp.classList.remove('flex'); }
};

window.closeWarehousePanel = function() {
    const wp = document.getElementById('warehouse-panel'); if(wp) { wp.classList.add('hidden'); wp.classList.remove('flex'); }
};

const initUIEvents = () => {
    const bw = document.getElementById('board-wrapper');
    if(bw) bw.addEventListener('wheel', function(e) { if(e.ctrlKey || e.metaKey) e.preventDefault(); }, {passive: false});

    const customScrolls = document.querySelectorAll('.custom-scroll');
    customScrolls.forEach(el => el.addEventListener('wheel', function(e) { e.stopPropagation(); }, {passive: false}));

    const boardArea = document.getElementById('board-area');
    if(!boardArea) return;

    boardArea.addEventListener('pointerdown', e => {
      if (window.state.viewingOpponent || window.state.isGameOver) return;
      const cardEl = e.target.closest('.game-card'); if (!cardEl) return;
      if(window.hideTooltip) window.hideTooltip();
      const stackId = cardEl.dataset.stackId; const cardIdx = parseInt(cardEl.dataset.cardIdx);
      const sIdx = window.state.stacks.findIndex(s => s.id === stackId); if (sIdx === -1) return;
      const stack = window.state.stacks[sIdx];
      const rect = cardEl.getBoundingClientRect(); const br = boardArea.getBoundingClientRect();
      const ox = (e.clientX - rect.left) / window.state.zoom; const oy = (e.clientY - rect.top) / window.state.zoom;

      if (stack.crafting && stack.crafting.left < stack.crafting.total) {
         const detached = stack.cards.splice(0); const craftingData = stack.crafting; 
         window.state.stacks.splice(sIdx, 1);
         const dragX = (e.clientX - br.left) / window.state.zoom - ox; const dragY = (e.clientY - br.top) / window.state.zoom - oy;
         window.state.draggingStack = { id: `drag_${Date.now()}`, x: dragX, y: dragY, cards: detached, crafting: craftingData };
      } else {
         stack.crafting = null; const detached = stack.cards.splice(cardIdx);
         if (stack.cards.length === 0) window.state.stacks.splice(sIdx, 1); else window.checkAndSetRecipe(stack);
         const dragX = (e.clientX - br.left) / window.state.zoom - ox; const dragY = (e.clientY - br.top) / window.state.zoom - oy;
         window.state.draggingStack = { id: `drag_${Date.now()}`, x: dragX, y: dragY, cards: detached, crafting: null };
      }
      window.dragData = { ox, oy }; window.renderAll(); boardArea.setPointerCapture(e.pointerId);
    });

    boardArea.addEventListener('pointermove', e => {
      if (!window.state.draggingStack) return;
      const br = boardArea.getBoundingClientRect();
      window.state.draggingStack.x = (e.clientX - br.left) / window.state.zoom - window.dragData.ox;
      window.state.draggingStack.y = (e.clientY - br.top) / window.state.zoom - window.dragData.oy;
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
      const mz = document.getElementById('market-zone'); if(mz) mz.classList.remove('market-zone-active');
      const mRect = mz ? mz.getBoundingClientRect() : {left:-1,right:-1,top:-1,bottom:-1};
      if (e.clientX >= mRect.left && e.clientX <= mRect.right && e.clientY >= mRect.top && e.clientY <= mRect.bottom) {
          if (window.state.draggingStack.crafting) {
             window.notify("제작 중인 물건은 팔 수 없습니다 ❌", "error");
             window.state.stacks.push({ ...window.state.draggingStack, id: `s${window.nextStackId++}` });
             window.state.draggingStack = null; window.dragData = null; window.renderAll(); return;
          }
          let earned = 0, success = false, remains = [];
          window.state.draggingStack.cards.forEach(cardId => {
            let pureId = window.normalizeCard(cardId); const m = window.state.market[pureId];
            if (m && TILES[pureId].basePrice > 0) { 
                earned += window.getFinalPrice(pureId); m.pendingSupply += 1; success = true; 
                if(TILES[pureId].category && TILES[pureId].category !== 'general'){
                    let p = window.state.prof[TILES[pureId].category]; let oldLv = p.lv;
                    if(PROCESSING_ITEMS.includes(pureId)) p.exp += 1;
                    if(TIER1_ITEMS.includes(pureId)) p.exp += 3;
                    if(TIER2_ITEMS.includes(pureId)) p.exp += 10;
                    p.lv = p.exp >= 50 ? 4 : (p.exp >= 20 ? 3 : (p.exp >= 10 ? 2 : 1));
                    if(p.lv > oldLv) window.notify(`${CAT_INFO[TILES[pureId].category].name} 레벨업 (Lv.${p.lv}) 🎉`, 'action');
                }
            } else remains.push(cardId);
          });
          if (success) { window.state.money += earned; window.notify(`매각 예약됨! <span class="text-amber-500 font-black">+${earned} G</span>`, "action"); }
          if (remains.length > 0) window.state.stacks.push({ id: `s${window.nextStackId++}`, x: window.state.draggingStack.x, y: window.state.draggingStack.y, cards: remains, crafting: null });
          window.state.draggingStack = null; window.dragData = null; window.renderAll(); return;
      }
      let ts = null; let minD = 55; 
      for (let s of window.state.stacks) {
        const targetY = s.y + (s.cards.length - 1) * 28;
        const dist = Math.sqrt(Math.pow(s.x - window.state.draggingStack.x, 2) + Math.pow(targetY - window.state.draggingStack.y, 2));
        if (dist < minD) { minD = dist; ts = s; }
      }
      if (ts) {
        ts.cards.push(...window.state.draggingStack.cards); ts.crafting = null; window.checkAndSetRecipe(ts);
      } else {
        window.state.stacks.push({ ...window.state.draggingStack, id: `s${window.nextStackId++}` });
        if(!window.state.stacks[window.state.stacks.length-1].crafting) window.checkAndSetRecipe(window.state.stacks[window.state.stacks.length - 1]);
      }
      window.state.draggingStack = null; window.dragData = null; window.renderAll();
    });
};

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initUIEvents); } 
else { initUIEvents(); }