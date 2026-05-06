// tooltip.js
import { TILES, RECIPES } from './data.js';

window.isAnyModalOpen = function() {
    const blockingIds = [
        'modal-leaderboard', 'modal-lobby', 'modal-specialty', 
        'modal-tech', 'modal-quest', 'modal-trade', 
        'modal-news', 'modal-recipe', 'screen-menu', 
        'screen-waiting', 'screen-result'
    ];
    return blockingIds.some(id => {
        const el = document.getElementById(id);
        return el && !el.classList.contains('hidden');
    });
};

window.showTooltip = function(id, e) {
    if (window.state && (window.state.draggingStack || window.state.viewingOpponent || window.state.isGameOver)) return;
    if (window.isAnyModalOpen()) return;

    id = window.normalizeCard ? window.normalizeCard(id) : id.replace('_upgraded', '');
    
    const rel = RECIPES.filter(r => (!r.isSpecialty || r.unlockId === window.state.unlockedSpecialty) && r.inputs.includes(id));
    if(rel.length === 0) return;

    const tt = document.getElementById('tooltip'); 
    const content = document.getElementById('tooltip-content'); 
    if(!tt || !content) return;

    content.innerHTML = rel.map(r => {
        const iText = r.inputs.map(ing => `<span class="${TILES[ing].textColor} font-bold">${TILES[ing].name}</span>`).join(' <span class="text-slate-400 font-normal">+</span> ');
        const rText = r.results.map(res => `<span class="${TILES[res].textColor} font-bold bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm">${TILES[res].name}</span>`).join(', ');
        return `<div class="flex flex-col gap-1 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200 mb-1 shadow-sm"><div class="flex items-center gap-1">${iText}</div><div class="flex items-center gap-2 mt-1"><i class="ph-bold ph-arrow-elbow-down-right text-sky-400"></i><span class="bg-sky-100 text-sky-600 font-black px-1.5 rounded">${r.turns}턴</span>${rText}</div></div>`;
    }).join('');
    
    tt.classList.remove('hidden'); 
    window.moveTooltip(e);
};

window.hideTooltip = function() { 
    const tt = document.getElementById('tooltip'); 
    if(tt) tt.classList.add('hidden'); 
};

window.moveTooltip = function(e) { 
    const tt = document.getElementById('tooltip'); 
    if(tt && !tt.classList.contains('hidden')){ 
        tt.style.left = (e.clientX + 15) + 'px'; 
        tt.style.top = (e.clientY + 15) + 'px'; 
    } 
};

// 💡 새로 추가된 마우스 휠 스크롤 제어 함수
window.scrollTooltip = function(e) {
    const tc = document.getElementById('tooltip-content');
    const tt = document.getElementById('tooltip');
    // 툴팁이 열려있을 때만 작동
    if (tc && tt && !tt.classList.contains('hidden')) {
        tc.scrollTop += e.deltaY; // 툴팁 내용만 스크롤
        e.stopPropagation();      // 보드 줌/스크롤 이벤트 전파 차단
        e.preventDefault();       // 브라우저 기본 스크롤 차단
    }
};