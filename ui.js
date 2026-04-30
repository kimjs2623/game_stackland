import * as Config from './config.js';
import * as Engine from './engine.js';
// firebase-manager.js는 멀티플레이 시 연동됩니다.

const state = Engine.state;

// ==========================================
// 1. 글로벌 함수 바인딩 (HTML에서 onclick으로 호출)
// ==========================================

window.startGame = (mode) => {
    const maxTurns = document.getElementById('single-max-turns-input').value;
    Engine.initGame(mode, maxTurns, null); // 일단 특산물 없이 시작

    document.getElementById('screen-menu').classList.add('hidden');
    
    // 특산물 픽 모달 띄우기
    showSpecialtyModal();
};

function showSpecialtyModal() {
    const modal = document.getElementById('modal-specialty');
    const container = document.getElementById('specialty-options');
    
    container.innerHTML = Config.SPECIALTY_OPTIONS_ALL.map(opt => `
        <div class="bg-white/10 border-2 border-white/20 p-6 rounded-3xl cursor-pointer hover:bg-white/20 hover:scale-105 transition-all flex flex-col items-center text-center shadow-lg" onclick="window.selectSpecialty('${opt.id}')">
            ${opt.icon}
            <h3 class="text-xl font-black text-amber-300 mb-2">${opt.name}</h3>
            <p class="text-sm font-bold text-slate-200">${opt.desc}</p>
        </div>
    `).join('');
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => modal.classList.remove('opacity-0'), 50);
}

window.selectSpecialty = (specialtyId) => {
    state.unlockedSpecialty = specialtyId;
    
    const modal = document.getElementById('modal-specialty');
    modal.classList.add('opacity-0');
    setTimeout(() => {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
        
        // 게임 화면 진입
        const gameScreen = document.getElementById('screen-game');
        gameScreen.classList.remove('hidden');
        gameScreen.classList.add('flex');
        setTimeout(() => {
            gameScreen.classList.remove('opacity-0');
            gameScreen.classList.remove('pointer-events-none');
            const wrapper = document.getElementById('board-wrapper');
            if(wrapper) {
                wrapper.scrollLeft = 1200 - wrapper.clientWidth / 2;
                wrapper.scrollTop = 800 - wrapper.clientHeight / 2;
            }
        }, 50);
        
        renderAll();
        showNotif(`특산물 [${Config.TILES[specialtyId].name}]을(를) 선택했습니다!`);
    }, 300);
};

window.setZoom = (delta) => {
    state.zoom = Math.max(0.4, Math.min(1.5, state.zoom + delta));
    document.getElementById('board-area').style.transform = `scale(${state.zoom})`;
    document.getElementById('zoom-level-text').innerText = `${Math.round(state.zoom * 100)}%`;
};

window.completeQuest = () => {
    if (Engine.completeQuest()) {
        showNotif("의뢰를 성공적으로 납품했습니다! 보상을 획득했습니다.", "success");
        renderAll();
    } else {
        showNotif("의뢰에 필요한 자원이 부족합니다.", "error");
    }
};

window.toggleWarehouse = () => {
    const panel = document.getElementById('warehouse-panel');
    if (panel.classList.contains('hidden')) {
        panel.classList.remove('hidden');
        panel.classList.add('flex');
    } else {
        window.closeWarehousePanel();
    }
};

window.closeWarehousePanel = () => {
    const panel = document.getElementById('warehouse-panel');
    panel.classList.add('hidden');
    panel.classList.remove('flex');
};

window.toggleTechModal = () => toggleModal('modal-tech', renderTechOptions);
window.toggleRecipeModal = () => toggleModal('modal-recipe', renderRecipeList);
window.toggleNewsModal = () => toggleModal('modal-news', renderNewsList);

function toggleModal(modalId, renderFunc) {
    const modal = document.getElementById(modalId);
    if (modal.classList.contains('hidden')) {
        if(renderFunc) renderFunc();
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => modal.classList.remove('opacity-0'), 10);
    } else {
        modal.classList.add('opacity-0');
        setTimeout(() => {
            modal.classList.remove('flex');
            modal.classList.add('hidden');
        }, 300);
    }
}

// ==========================================
// 2. 렌더링 함수군 (화면 업데이트)
// ==========================================

export function renderAll() {
    document.getElementById('score').innerText = state.money;
    document.getElementById('turn-count').innerText = state.turnCount;
    document.getElementById('max-turn-display').innerText = `/ ${state.maxTurns}`;
    
    renderPool();
    renderBoard();
    renderMarketPrices();
    renderQuestBox();
    renderProf();
    renderWarehouseItems();

    if (state.latestEvent) {
        showSplashNews(state.latestEvent.title, state.latestEvent.msg);
        state.latestEvent = null; // 처리 후 초기화
    }

    if (state.isGameOver) showResultScreen();
}

function renderPool() {
    const poolEl = document.getElementById('ui-shared-pool');
    if (!poolEl) return;
    poolEl.innerHTML = state.displayPool.map((id, i) => {
        const t = Config.TILES[id];
        return `
            <div class="pool-item w-12 h-16 rounded-xl flex flex-col items-center justify-center border-2 bg-white cursor-pointer border-slate-200 hover:scale-105 hover:border-sky-400 hover:shadow-md transition-all" data-idx="${i}" onclick="handlePoolClick(${i})">
                <div class="${t.textColor} text-xl">${t.icon}</div>
                <span class="text-[9px] font-black ${t.textColor}">${t.name}</span>
            </div>`;
    }).join('');
}

window.handlePoolClick = (idx) => {
    if(Engine.takeResource(idx)) {
        renderAll();
    }
};

function renderBoard() {
    const boardArea = document.getElementById('board-area');
    if (!boardArea) return;

    let html = state.stacks.map((stack, i) => renderStackDOM(stack, i, false)).join('');
    if (state.draggingStack) {
        html += renderStackDOM(state.draggingStack, 999, true);
    }
    boardArea.innerHTML = html;
}

function renderStackDOM(stack, index, isDragging = false) {
    let cardsHtml = stack.cards.map((cardId, idx) => {
        const pureId = Engine.normalizeCard(cardId);
        const t = Config.TILES[pureId];
        return `
            <div class="game-card ${t.cardClass} tooltip-target" data-id="${pureId}"
                 style="top: ${idx * 28}px; z-index: ${idx};">
                <div class="text-2xl">${t.icon}</div>
                <span class="text-[10px] font-black">${t.name}</span>
            </div>`;
    }).join('');

    let craftBar = '';
    if (stack.crafting && !isDragging) {
        const pct = ((stack.crafting.total - stack.crafting.left) / stack.crafting.total) * 100;
        craftBar = `
            <div class="absolute -top-4 left-1/2 -translate-x-1/2 w-16 bg-slate-200 rounded-full h-2 shadow-sm border border-slate-300 overflow-hidden z-50">
                <div class="bg-sky-500 h-full transition-all duration-300" style="width: ${pct}%"></div>
            </div>`;
    }

    return `
        <div class="stack-container absolute cursor-grab active:cursor-grabbing" 
             data-stack-id="${stack.id}"
             style="left: ${stack.x}px; top: ${stack.y}px; z-index: ${isDragging ? 1000 : 10 + index};">
            ${craftBar}
            ${cardsHtml}
        </div>`;
}

function renderMarketPrices() {
    const container = document.getElementById('market-prices');
    if (!container) return;
    container.innerHTML = Config.SELLABLE_ITEMS.map(id => {
        const t = Config.TILES[id];
        const m = state.market[id];
        if(!m) return '';
        
        let trendIcon = '<i class="ph-bold ph-minus text-slate-400"></i>';
        let trendColor = 'text-slate-500';
        if (m.trend > 0) { trendIcon = '<i class="ph-bold ph-trend-up text-emerald-500"></i>'; trendColor = 'text-emerald-600'; }
        else if (m.trend < 0) { trendIcon = '<i class="ph-bold ph-trend-down text-red-500"></i>'; trendColor = 'text-red-600'; }

        return `
            <div class="flex justify-between items-center px-2 py-1 bg-slate-50 rounded-lg border border-slate-100 shadow-sm hover:bg-slate-100 transition-colors">
                <span class="text-[11px] font-black text-slate-700 flex items-center gap-1 w-20 truncate">${t.icon} ${t.name}</span>
                <span class="text-xs font-black w-10 text-right ${trendColor}">${trendIcon}</span>
                <span class="text-xs font-black ${trendColor} w-12 text-right">${m.currentPrice}G</span>
            </div>`;
    }).join('');
}

function renderQuestBox() {
    const box = document.getElementById('active-quest-box');
    if (state.activeQuest) {
        box.classList.remove('hidden');
        box.classList.add('flex');
        const q = state.activeQuest;
        const t = Config.TILES[q.reqItem];
        document.getElementById('quest-timer').innerText = `${state.questTimer}턴 남음`;
        document.getElementById('quest-req-text').innerHTML = `${t.icon} ${t.name} ${q.reqAmount}개 <span class="text-amber-600 ml-1">(${q.reward} G)</span>`;
    } else {
        box.classList.add('hidden');
        box.classList.remove('flex');
    }
}

function renderProf() {
    const container = document.getElementById('prof-list');
    if(!container) return;
    container.innerHTML = Object.keys(state.prof).map(cat => {
        const p = state.prof[cat];
        const info = Config.CAT_INFO[cat];
        const pct = p.lv >= 5 ? 100 : (p.exp / (p.lv * 100)) * 100;
        return `
            <div class="flex flex-col items-center w-10 tooltip-target" data-cat="${cat}">
                <div class="relative w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-sm shadow-inner overflow-hidden mb-0.5">
                    <div class="absolute bottom-0 left-0 w-full bg-amber-200/50 transition-all" style="height: ${pct}%"></div>
                    <span class="relative z-10">${info.icon}</span>
                </div>
                <span class="text-[9px] font-black text-slate-600 bg-slate-100 px-1.5 rounded-sm">Lv.${p.lv}</span>
            </div>`;
    }).join('');
}

function renderWarehouseItems() {
    const container = document.getElementById('warehouse-items-container');
    if(!container) return;
    
    const items = Object.entries(state.warehouseItems);
    if(items.length === 0) {
        container.innerHTML = `<div class="text-xs font-bold text-stone-400 w-full text-center py-4">창고가 비어있습니다.</div>`;
        return;
    }

    container.innerHTML = items.map(([id, count]) => {
        const t = Config.TILES[id];
        return `
            <div class="flex flex-col items-center bg-stone-50 border border-stone-200 p-2 rounded-xl w-16 shadow-sm cursor-pointer hover:bg-stone-100 transition-colors" onclick="window.takeFromWarehouseUI('${id}')">
                <div class="${t.textColor} text-2xl mb-1">${t.icon}</div>
                <span class="text-[10px] font-black text-stone-700">${t.name}</span>
                <span class="text-[9px] font-black text-white bg-stone-500 px-2 rounded-full mt-1">x${count}</span>
            </div>`;
    }).join('');
}

window.takeFromWarehouseUI = (id) => {
    // 화면 중앙 쯤에 스폰
    const wrapper = document.getElementById('board-wrapper');
    const spawnX = wrapper.scrollLeft + wrapper.clientWidth / 2;
    const spawnY = wrapper.scrollTop + wrapper.clientHeight / 2;
    
    if(Engine.takeFromWarehouse(id, spawnX, spawnY)) {
        renderAll();
    }
};

function renderTechOptions() {} // (추후 구현을 위해 빈 함수 유지)
function renderRecipeList() {} // (추후 구현을 위해 빈 함수 유지)
function renderNewsList() {} // (추후 구현을 위해 빈 함수 유지)

function showNotif(msg, type='info') {
    const c = document.getElementById('notif-container');
    const el = document.createElement('div');
    const color = type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-red-500' : 'bg-sky-500';
    el.className = `${color} text-white px-4 py-2 rounded-2xl shadow-lg text-xs font-black animate-notif flex items-center gap-2`;
    el.innerHTML = `<i class="ph-bold ph-info"></i> ${msg}`;
    c.appendChild(el);
    setTimeout(() => el.remove(), 2500);
}

function showSplashNews(title, msg) {
    const splash = document.getElementById('splash-news');
    document.getElementById('splash-title').innerText = title;
    document.getElementById('splash-msg').innerText = msg;
    
    splash.classList.remove('hidden');
    setTimeout(() => splash.classList.remove('opacity-0'), 10);
    
    setTimeout(() => {
        splash.classList.add('opacity-0');
        setTimeout(() => splash.classList.add('hidden'), 500);
    }, 3000);
}

function showResultScreen() {
    const screen = document.getElementById('screen-result');
    document.getElementById('result-score').innerText = state.money;
    screen.classList.remove('hidden');
    screen.classList.add('flex');
    setTimeout(() => screen.classList.remove('opacity-0'), 50);
}

window.cleanupAndLeave = () => { location.reload(); };

// ==========================================
// 3. 드래그 앤 드롭 마우스 추적 이벤트
// ==========================================

let activeDrag = null;
let startX = 0, startY = 0;
let initialStackX = 0, initialStackY = 0;

document.addEventListener('pointerdown', (e) => {
    const stackEl = e.target.closest('.stack-container');
    if (!stackEl || e.button !== 0) return;
    
    const stackId = stackEl.dataset.stackId;
    const stack = state.stacks.find(s => s.id === stackId);
    if (!stack) return;

    activeDrag = stackId;
    startX = e.clientX;
    startY = e.clientY;
    initialStackX = stack.x;
    initialStackY = stack.y;

    // 드래그 중인 요소를 state.stacks에서 빼서 draggingStack으로 이동 (최상단 렌더링용)
    const idx = state.stacks.findIndex(s => s.id === stackId);
    state.draggingStack = state.stacks.splice(idx, 1)[0];
    
    stackEl.remove(); // 기존 DOM에서 즉시 제거
    renderBoard();    // 다시 그려서 마우스에 붙임
    
    const dragEl = document.querySelector(`[data-stack-id="${stackId}"]`);
    if(dragEl) dragEl.setPointerCapture(e.pointerId);
});

document.addEventListener('pointermove', (e) => {
    if (!activeDrag || !state.draggingStack) return;

    const dx = (e.clientX - startX) / state.zoom;
    const dy = (e.clientY - startY) / state.zoom;

    state.draggingStack.x = initialStackX + dx;
    state.draggingStack.y = initialStackY + dy;

    // 시각적 업데이트만 빠르게 처리 (렌더링 전체 X)
    const dragEl = document.querySelector(`[data-stack-id="${activeDrag}"]`);
    if (dragEl) {
        dragEl.style.left = `${state.draggingStack.x}px`;
        dragEl.style.top = `${state.draggingStack.y}px`;
    }

    // 마켓존, 창고 호버링 하이라이트 감지 로직
    const marketZone = document.getElementById('market-zone');
    const warehouseZone = document.getElementById('warehouse-panel');
    const dragRect = dragEl.getBoundingClientRect();
    
    // 마켓 호버 확인
    if (marketZone) {
        const mzRect = marketZone.getBoundingClientRect();
        if (Engine.checkCollision(dragRect, mzRect)) marketZone.classList.add('market-zone-active');
        else marketZone.classList.remove('market-zone-active');
    }
});

document.addEventListener('pointerup', (e) => {
    if (!activeDrag || !state.draggingStack) return;

    const dragRect = document.querySelector(`[data-stack-id="${activeDrag}"]`).getBoundingClientRect();
    const dropX = state.draggingStack.x;
    const dropY = state.draggingStack.y;

    // draggingStack을 다시 stacks 배열에 복귀
    state.stacks.push(state.draggingStack);
    const draggedId = state.draggingStack.id;
    state.draggingStack = null;
    activeDrag = null;

    // 1. 매각 존 드롭 확인
    const marketZone = document.getElementById('market-zone');
    if (marketZone && Engine.checkCollision(dragRect, marketZone.getBoundingClientRect())) {
        marketZone.classList.remove('market-zone-active');
        const earned = Engine.sellStack(draggedId);
        if (earned > 0) {
            showNotif(`${earned}G 에 매각 완료!`, "success");
            renderAll();
            return;
        } else {
            showNotif("매각할 수 없는 아이템이거나 제작 중입니다.", "error");
        }
    }

    // 2. 스택 병합(충돌) 처리
    // 화면에 있는 모든 스택들의 Rect를 모아서 엔진에 전달
    const otherStacksRects = state.stacks
        .filter(s => s.id !== draggedId)
        .map(s => {
            const el = document.querySelector(`[data-stack-id="${s.id}"]`);
            return el ? { id: s.id, rect: el.getBoundingClientRect() } : null;
        }).filter(Boolean);

    Engine.handleDrop(draggedId, dropX, dropY, dragRect, otherStacksRects);
    renderAll();
});

// ==========================================
// 4. 툴팁 표시 로직
// ==========================================

const tooltip = document.getElementById('tooltip');
const tooltipContent = document.getElementById('tooltip-content');

document.addEventListener('mouseover', (e) => {
    const target = e.target.closest('.tooltip-target');
    if (!target) {
        tooltip.classList.add('hidden');
        return;
    }

    const itemId = target.dataset.id;
    if (itemId) {
        // 아이템 관련 조합법 찾기
        const related = Config.RECIPES.filter(r => r.inputs.includes(itemId) || r.results.includes(itemId));
        if (related.length === 0) {
            tooltipContent.innerHTML = `<div class="text-xs text-slate-500">관련 조합법이 없습니다.</div>`;
        } else {
            tooltipContent.innerHTML = related.map(r => `
                <div class="bg-slate-50 p-2 rounded-lg text-[10px] border border-slate-200">
                    <span class="font-black text-slate-700">${r.desc}</span> <span class="text-slate-400">(${r.turns}턴)</span><br>
                    <span class="text-slate-500">재료: ${r.inputs.map(i => Config.TILES[i].name).join(', ')}</span><br>
                    <span class="text-sky-600">결과: ${r.results.map(i => Config.TILES[i].name).join(', ')}</span>
                </div>
            `).join('');
        }
        
        const rect = target.getBoundingClientRect();
        tooltip.style.left = `${rect.right + 10}px`;
        tooltip.style.top = `${rect.top}px`;
        tooltip.classList.remove('hidden');
    }
});

// 패널 드래그 (창고 UI 이동)
const whHeader = document.getElementById('warehouse-header');
const whPanel = document.getElementById('warehouse-panel');
let isDraggingWH = false, whStartX, whStartY, whInitialX, whInitialY;

whHeader?.addEventListener('mousedown', (e) => {
    isDraggingWH = true;
    whStartX = e.clientX; whStartY = e.clientY;
    whInitialX = whPanel.offsetLeft; whInitialY = whPanel.offsetTop;
});

document.addEventListener('mousemove', (e) => {
    if(!isDraggingWH) return;
    whPanel.style.left = `${whInitialX + (e.clientX - whStartX)}px`;
    whPanel.style.top = `${whInitialY + (e.clientY - whStartY)}px`;
});
document.addEventListener('mouseup', () => { isDraggingWH = false; });