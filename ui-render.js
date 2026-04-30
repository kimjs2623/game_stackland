import * as Config from './config.js';
import * as Engine from './engine.js';

const state = Engine.state;

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
        state.latestEvent = null;
    }

    if (state.isGameOver) showResultScreen();
}

export function renderPool() {
    const poolEl = document.getElementById('ui-shared-pool');
    if (!poolEl) return;
    poolEl.innerHTML = state.displayPool.map((id, i) => {
        const t = Config.TILES[id];
        return `
            <div class="pool-item w-12 h-16 rounded-xl flex flex-col items-center justify-center border-2 bg-white cursor-pointer border-slate-200 hover:scale-105 hover:border-sky-400 hover:shadow-md transition-all" data-idx="${i}" onclick="window.handlePoolClick(${i})">
                <div class="${t.textColor} text-xl">${t.icon}</div>
                <span class="text-[9px] font-black ${t.textColor}">${t.name}</span>
            </div>`;
    }).join('');

    const rerollBtn = document.getElementById('btn-reroll-pool');
    if (!rerollBtn) return;
    if (state.tech.warehouse) {
        rerollBtn.classList.remove('hidden');
        rerollBtn.classList.add('flex');
    } else {
        rerollBtn.classList.add('hidden');
        rerollBtn.classList.remove('flex');
    }
}

export function renderBoard() {
    const boardArea = document.getElementById('board-area');
    if (!boardArea) return;
    let html = state.stacks.map((stack, i) => renderStackDOM(stack, i, false)).join('');
    if (state.draggingStack) html += renderStackDOM(state.draggingStack, 999, true);
    boardArea.innerHTML = html;
}

function renderStackDOM(stack, index, isDragging = false) {
    const cardsHtml = stack.cards.map((cardId, idx) => {
        const pureId = Engine.normalizeCard(cardId);
        const t = Config.TILES[pureId];
        return `
            <div class="game-card ${t.cardClass} tooltip-target" data-id="${pureId}" style="top: ${idx * 28}px; z-index: ${idx};">
                <div class="text-2xl">${t.icon}</div>
                <span class="text-[10px] font-black">${t.name}</span>
            </div>`;
    }).join('');

    let craftBar = '';
    if (stack.crafting && !isDragging) {
        const pct = ((stack.crafting.total - stack.crafting.left) / stack.crafting.total) * 100;
        craftBar = `<div class="absolute -top-4 left-1/2 -translate-x-1/2 w-16 bg-slate-200 rounded-full h-2 shadow-sm border border-slate-300 overflow-hidden z-50"><div class="bg-sky-500 h-full transition-all duration-300" style="width: ${pct}%"></div></div>`;
    }

    return `<div class="stack-container absolute cursor-grab active:cursor-grabbing" data-stack-id="${stack.id}" style="left: ${stack.x}px; top: ${stack.y}px; z-index: ${isDragging ? 1000 : 10 + index};">${craftBar}${cardsHtml}</div>`;
}

function renderMarketPrices() {
    const container = document.getElementById('market-prices');
    if (!container) return;
    container.innerHTML = Config.SELLABLE_ITEMS.map(id => {
        const t = Config.TILES[id];
        const m = state.market[id];
        if (!m) return '';
        let trendIcon = '<i class="ph-bold ph-minus text-slate-400"></i>';
        let trendColor = 'text-slate-500';
        if (m.trend > 0) { trendIcon = '<i class="ph-bold ph-trend-up text-emerald-500"></i>'; trendColor = 'text-emerald-600'; }
        else if (m.trend < 0) { trendIcon = '<i class="ph-bold ph-trend-down text-red-500"></i>'; trendColor = 'text-red-600'; }
        return `<div class="flex justify-between items-center px-2 py-1 bg-slate-50 rounded-lg border border-slate-100 shadow-sm hover:bg-slate-100 transition-colors"><span class="text-[11px] font-black text-slate-700 flex items-center gap-1 w-20 truncate">${t.icon} ${t.name}</span><span class="text-xs font-black w-10 text-right ${trendColor}">${trendIcon}</span><span class="text-xs font-black ${trendColor} w-12 text-right">${m.currentPrice}G</span></div>`;
    }).join('');
}

function renderQuestBox() {
    const box = document.getElementById('active-quest-box');
    if (!box) return;
    if (!state.activeQuest) {
        box.classList.add('hidden');
        box.classList.remove('flex');
        return;
    }
    box.classList.remove('hidden');
    box.classList.add('flex');
    const q = state.activeQuest;
    const t = Config.TILES[q.reqItem];
    document.getElementById('quest-timer').innerText = `${state.questTimer}턴 남음`;
    document.getElementById('quest-req-text').innerHTML = `${t.icon} ${t.name} ${q.reqAmount}개 <span class="text-amber-600 ml-1">(${q.reward} G)</span>`;
}

function renderProf() {
    const container = document.getElementById('prof-list');
    if (!container) return;
    container.innerHTML = Object.keys(state.prof).map(cat => {
        const p = state.prof[cat];
        const info = Config.CAT_INFO[cat];
        const pct = p.lv >= 5 ? 100 : (p.exp / (p.lv * 100)) * 100;
        return `<div class="flex flex-col items-center w-10 tooltip-target" data-cat="${cat}"><div class="relative w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-sm shadow-inner overflow-hidden mb-0.5"><div class="absolute bottom-0 left-0 w-full bg-amber-200/50 transition-all" style="height: ${pct}%"></div><span class="relative z-10">${info.icon}</span></div><span class="text-[9px] font-black text-slate-600 bg-slate-100 px-1.5 rounded-sm">Lv.${p.lv}</span></div>`;
    }).join('');
}

function renderWarehouseItems() {
    const container = document.getElementById('warehouse-items-container');
    if (!container) return;
    const items = Object.entries(state.warehouseItems);
    if (items.length === 0) {
        container.innerHTML = `<div class="text-xs font-bold text-stone-400 w-full text-center py-4">창고가 비어있습니다.</div>`;
        return;
    }
    container.innerHTML = items.map(([id, count]) => {
        const t = Config.TILES[id];
        return `<div class="flex flex-col items-center bg-stone-50 border border-stone-200 p-2 rounded-xl w-16 shadow-sm cursor-pointer hover:bg-stone-100 transition-colors" onclick="window.takeFromWarehouseUI('${id}')"><div class="${t.textColor} text-2xl mb-1">${t.icon}</div><span class="text-[10px] font-black text-stone-700">${t.name}</span><span class="text-[9px] font-black text-white bg-stone-500 px-2 rounded-full mt-1">x${count}</span></div>`;
    }).join('');
}

export function renderTechOptions() {
    const container = document.getElementById('tech-options');
    const rd = Engine.countItemOnBoard('research');
    const rdEl = document.getElementById('tech-available-rd');
    if (rdEl) rdEl.innerText = rd;
    if (!container) return;
    const techCards = [
        { id: 'tier_2', name: '2티어 특산물 해금', desc: '선택한 특산물 라인의 상위 제작법을 해금합니다.', cost: 3, color: 'indigo' },
        { id: 'steel_upgrade', name: '강철 공정 최적화', desc: '제련 계열 숙련도 성장과 조합 안내를 강화합니다.', cost: 2, color: 'slate' },
        { id: 'warehouse', name: '대형 창고 운영', desc: '자원 리롤 및 창고 UI를 활성화합니다.', cost: 2, color: 'stone' }
    ];
    container.innerHTML = techCards.map((tech) => {
        const bought = !!state.tech[tech.id];
        const canBuy = rd >= tech.cost && !bought;
        const btnClass = bought ? 'bg-emerald-100 text-emerald-700 border-emerald-300 cursor-default' : canBuy ? 'bg-indigo-500 text-white border-indigo-300 hover:bg-indigo-400' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed';
        return `<div class="rounded-2xl border p-4 shadow-sm bg-white flex flex-col gap-3"><div><h3 class="font-black text-${tech.color}-700 text-sm">${tech.name}</h3><p class="text-xs text-slate-500 font-bold mt-1">${tech.desc}</p></div><div class="flex items-center justify-between"><span class="text-xs font-black text-purple-600">비용: 연구 데이터 ${tech.cost}</span><button class="px-3 py-1.5 rounded-xl text-xs font-black border transition-colors ${btnClass}" onclick="window.buyTech('${tech.id}', ${tech.cost})" ${bought ? 'disabled' : ''}>${bought ? '연구 완료' : '연구'}</button></div></div>`;
    }).join('');
}

export function renderRecipeList() {
    const list = document.getElementById('recipe-list');
    if (!list) return;
    list.innerHTML = Config.RECIPES
        .filter(r => !r.isSpecialty || r.unlockId === state.unlockedSpecialty)
        .filter(r => !(r.tier === 2 && !state.tech.tier_2))
        .map(r => `<div class="rounded-2xl border border-slate-200 p-3 bg-slate-50"><div class="text-sm font-black text-slate-700">${r.desc}</div><div class="text-[11px] text-slate-500 font-bold mt-1">재료: ${r.inputs.map(i => Config.TILES[i]?.name || i).join(', ')}</div><div class="text-[11px] text-sky-700 font-black">결과: ${r.results.map(i => Config.TILES[i]?.name || i).join(', ')}</div><div class="text-[10px] text-slate-400 font-bold mt-1">소요 턴: ${r.turns}</div></div>`)
        .join('');
}

export function renderNewsList() {
    const list = document.getElementById('news-list');
    if (!list) return;
    if (state.newsHistory.length === 0) {
        list.innerHTML = `<div class="text-sm text-slate-400 font-bold text-center py-12">아직 발생한 시장 뉴스가 없습니다.</div>`;
        return;
    }
    list.innerHTML = state.newsHistory.map((news) => `<div class="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-600">${news}</div>`).join('');
}

export function showNotif(msg, type = 'info') {
    const c = document.getElementById('notif-container');
    if (!c) return;
    const el = document.createElement('div');
    const color = type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-red-500' : 'bg-sky-500';
    el.className = `${color} text-white px-4 py-2 rounded-2xl shadow-lg text-xs font-black animate-notif flex items-center gap-2`;
    el.innerHTML = `<i class="ph-bold ph-info"></i> ${msg}`;
    c.appendChild(el);
    setTimeout(() => el.remove(), 2500);
}

function showSplashNews(title, msg) {
    const splash = document.getElementById('splash-news');
    if (!splash) return;
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
    if (!screen) return;
    document.getElementById('result-score').innerText = state.money;
    const registerSection = document.getElementById('register-score-section');
    if (registerSection) registerSection.classList.remove('hidden');
    const successSection = document.getElementById('register-success-section');
    if (successSection) successSection.classList.add('hidden');
    screen.classList.remove('hidden');
    screen.classList.add('flex');
    setTimeout(() => screen.classList.remove('opacity-0'), 50);
}
