import { TILES, RECIPES, SPECIALTY_OPTIONS_ALL } from './data.js';

window.toggleTechModal = function() {
    const m = document.getElementById('modal-tech'); if (!m) return;
    const available = (window.countItemOnBoard ? window.countItemOnBoard('research') : 0) + (window.state.warehouseItems['research'] || 0);
    const rdEl = document.getElementById('tech-available-rd'); if(rdEl) rdEl.innerText = available;

    const techUI = document.getElementById('tech-options');
    if (techUI) {
        const t2 = window.state.tech.tier_2;
        const su = window.state.tech.steel_upgrade;
        const wh = window.state.tech.warehouse;
        techUI.innerHTML = `
            <div class="border-2 ${t2 ? 'border-emerald-400 bg-emerald-50' : 'border-indigo-200 bg-slate-50'} rounded-2xl p-5 flex flex-col items-center text-center shadow-sm">
                <i class="ph-fill ph-flask text-4xl ${t2 ? 'text-emerald-500' : 'text-indigo-400'} mb-2"></i>
                <h3 class="font-black text-lg text-slate-800 mb-1">2티어 특산물 해금</h3>
                <p class="text-xs text-slate-600 font-bold mb-4 flex-1">상위 특산물 제작 권한을 획득합니다.</p>
                ${t2 ? `<span class="px-4 py-2 bg-emerald-100 text-emerald-700 font-black rounded-xl">연구 완료</span>` : `<button onclick="window.unlockTech('tier_2', 2)" class="px-4 py-2 bg-indigo-500 text-white font-black rounded-xl hover:bg-indigo-400">데이터 2개 소모</button>`}
            </div>
            <div class="border-2 ${su ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 bg-slate-50'} rounded-2xl p-5 flex flex-col items-center text-center shadow-sm">
                <i class="ph-fill ph-hammer text-4xl ${su ? 'text-emerald-500' : 'text-slate-500'} mb-2"></i>
                <h3 class="font-black text-lg text-slate-800 mb-1">강철 인프라 강화</h3>
                <p class="text-xs text-slate-600 font-bold mb-4 flex-1">건물에 '강철' 드롭 시 생산량을 추가합니다.</p>
                ${su ? `<span class="px-4 py-2 bg-emerald-100 text-emerald-700 font-black rounded-xl">연구 완료</span>` : `<button onclick="window.unlockTech('steel_upgrade', 1)" class="px-4 py-2 bg-slate-700 text-white font-black rounded-xl hover:bg-slate-600">데이터 1개 소모</button>`}
            </div>
            <div class="border-2 ${wh ? 'border-emerald-400 bg-emerald-50' : 'border-amber-200 bg-amber-50'} rounded-2xl p-5 flex flex-col items-center text-center shadow-sm">
                <i class="ph-fill ph-package text-4xl ${wh ? 'text-emerald-500' : 'text-amber-500'} mb-2"></i>
                <h3 class="font-black text-lg text-slate-800 mb-1">창고 물류 시스템</h3>
                <p class="text-xs text-slate-600 font-bold mb-4 flex-1">대형 창고 건설 시 생산품이 자동 수집됩니다.</p>
                ${wh ? `<span class="px-4 py-2 bg-emerald-100 text-emerald-700 font-black rounded-xl">연구 완료</span>` : `<button onclick="window.unlockTech('warehouse', 1)" class="px-4 py-2 bg-amber-500 text-white font-black rounded-xl hover:bg-amber-400">데이터 1개 소모</button>`}
            </div>`;
    }
    if (m.classList.contains('hidden')) { m.classList.remove('hidden'); m.classList.add('flex'); setTimeout(() => { m.classList.remove('opacity-0'); m.children[0].classList.remove('scale-95'); }, 10); } 
    else { m.classList.add('opacity-0'); m.children[0].classList.add('scale-95'); setTimeout(() => { m.classList.add('hidden'); m.classList.remove('flex'); }, 300); }
};

// 👉 핵심 3: 제작서 창 열 때 그리기 함수 호출
window.toggleRecipeModal = function() {
    const m = document.getElementById('modal-recipe'); if (!m) return;
    if (m.classList.contains('hidden')) { 
        m.classList.remove('hidden'); m.classList.add('flex'); 
        if(window.renderRecipeList) window.renderRecipeList();
        setTimeout(() => { m.classList.remove('opacity-0'); m.children[0].classList.remove('scale-95'); }, 10); 
    } else { m.classList.add('opacity-0'); m.children[0].classList.add('scale-95'); setTimeout(() => { m.classList.add('hidden'); m.classList.remove('flex'); }, 300); }
};

window.showQuestDraft = function() {
    const m = document.getElementById('modal-quest'); const c = document.getElementById('quest-options'); if (!m || !c) return;
    let pool = ['bread', 'iron', 'paper', 'brick', 'steel', 'charcoal', 'seed', 'wood'];
    if (window.state.unlockedSpecialty && !pool.includes(window.state.unlockedSpecialty)) { pool.push(window.state.unlockedSpecialty); }
    pool = pool.sort(() => 0.5 - Math.random()).slice(0, 3);
    
    c.innerHTML = pool.map(id => {
        let mult = (id === window.state.unlockedSpecialty) ? 2.5 : 1.8;
        let reqCount = Math.floor(Math.random() * 2) + 2; let rReward = Math.floor(TILES[id].basePrice * reqCount * mult);
        
        // 💡 보상 텍스트에 '+ ❓' 표시 추가
        return `<div onclick="window.acceptQuest('${id}', ${reqCount}, ${rReward})" class="bg-slate-800/80 hover:bg-slate-700/90 border-2 border-slate-600 hover:border-amber-400 p-8 rounded-3xl cursor-pointer transition-all transform hover:-translate-y-2 flex flex-col items-center shadow-xl group">
          <div class="text-white drop-shadow-sm mb-2">${TILES[id].icon.replace('text-3xl', 'text-5xl')}</div>
          <h3 class="text-xl font-black text-white mb-1 group-hover:text-amber-200">${TILES[id].name} ${reqCount}개 납품</h3>
          <p class="text-amber-400 text-lg font-black bg-amber-900/50 px-4 py-1 rounded-full mt-2">보상: ${rReward} G <span class="text-sky-300 font-bold ml-1">+ ❓</span></p>
        </div>`;
    }).join('');
    
    m.classList.remove('hidden'); m.classList.add('flex'); setTimeout(() => { m.classList.remove('opacity-0'); m.children[0].classList.remove('scale-95'); }, 10);
};

window.toggleNewsModal = function() {
    const m = document.getElementById('modal-news'); if (!m) return;
    if (m.classList.contains('hidden')) { m.classList.remove('hidden'); m.classList.add('flex'); setTimeout(() => { m.classList.remove('opacity-0'); m.children[0].classList.remove('scale-95'); }, 10); } 
    else { m.classList.add('opacity-0'); m.children[0].classList.add('scale-95'); setTimeout(() => { m.classList.add('hidden'); m.classList.remove('flex'); }, 300); }
};

window.showNewsSplash = function(title, msg, type) {
    const s = document.getElementById('splash-news'); const c = document.getElementById('splash-news-content'); if(!s || !c) return;
    const titleEl = document.getElementById('splash-title'); const msgEl = document.getElementById('splash-msg');
    if (titleEl) titleEl.innerText = title; if (msgEl) msgEl.innerText = msg;
    const bColor = type === 'up' ? 'border-emerald-400' : 'border-rose-400';
    c.className = `bg-white/95 backdrop-blur-xl border-4 ${bColor} p-8 rounded-[3rem] shadow-[0_0_50px_rgba(245,158,11,0.3)] text-center transform scale-90 transition-transform duration-500 max-w-2xl`;
    s.classList.remove('hidden'); setTimeout(() => { s.classList.remove('opacity-0'); c.classList.remove('scale-90'); }, 50);
    setTimeout(() => { s.classList.add('opacity-0'); c.classList.add('scale-90'); setTimeout(() => s.classList.add('hidden'), 500); }, 3500);
};

window.showDrawModal = function() {
    const m = document.getElementById('modal-draw');
    const v = document.getElementById('draw-card-visual');
    if (!m || !v) return;

    // 모달을 열 때마다 카드를 뒷면 '?' 상태로 초기화
    v.className = 'w-56 h-80 bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-800 rounded-3xl border-4 border-indigo-300 shadow-[0_0_40px_rgba(99,102,241,0.6)] flex items-center justify-center transition-all duration-300 hover:scale-110 hover:-translate-y-4';
    v.innerHTML = '<span class="text-9xl font-black text-white drop-shadow-xl">?</span>';

    m.classList.remove('hidden'); m.classList.add('flex');
    setTimeout(() => m.classList.remove('opacity-0'), 10);
};

window.hideDrawModal = function() {
    const m = document.getElementById('modal-draw');
    if (!m) return;
    m.classList.add('opacity-0');
    setTimeout(() => { m.classList.add('hidden'); m.classList.remove('flex'); }, 300);
};

window.showLeaderboardModal = function(turns) {
    if (!turns) {
        const input = document.getElementById('single-max-turns-input');
        turns = input ? input.value : 50;
    }
    const m = document.getElementById('modal-leaderboard');
    if(!m) return;
    const sel = document.getElementById('leaderboard-turn-select');
    if(sel) sel.value = turns;
    
    m.classList.remove('hidden'); m.classList.add('flex');
    setTimeout(() => { m.classList.remove('opacity-0'); m.children[0].classList.remove('scale-95'); }, 10);
    if(window.fetchLeaderboard) window.fetchLeaderboard(turns);
};

window.closeLeaderboard = function() {
    const m = document.getElementById('modal-leaderboard');
    if(!m) return;
    m.classList.add('opacity-0'); m.children[0].classList.add('scale-95');
    setTimeout(() => { m.classList.add('hidden'); m.classList.remove('flex'); }, 300);
};