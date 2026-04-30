import * as Config from './config.js';
import * as Engine from './engine.js';
import { renderAll, renderNewsList, renderRecipeList, renderTechOptions, showNotif } from './ui-render.js';

const state = Engine.state;

export function registerUiModals() {
    window.startGame = (mode) => {
        const maxTurns = document.getElementById('single-max-turns-input').value;
        Engine.initGame(mode, maxTurns, null);
        document.getElementById('screen-menu').classList.add('hidden');
        showSpecialtyModal();
    };
    window.showSpecialtyModal = showSpecialtyModal;

    window.selectSpecialty = (specialtyId) => {
        state.unlockedSpecialty = specialtyId;
        const modal = document.getElementById('modal-specialty');
        modal.classList.add('opacity-0');
        setTimeout(() => {
            modal.classList.remove('flex');
            modal.classList.add('hidden');
            const gameScreen = document.getElementById('screen-game');
            gameScreen.classList.remove('hidden');
            gameScreen.classList.add('flex');
            setTimeout(() => {
                gameScreen.classList.remove('opacity-0');
                gameScreen.classList.remove('pointer-events-none');
                const wrapper = document.getElementById('board-wrapper');
                if (wrapper) {
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
        const result = Engine.completeQuest();
        if (result.success) {
            const bonusMsg = result.skyChance ? ` + 스카이 찬스: ${result.skyChance.name}` : '';
            showNotif(`의뢰 납품 완료! ${result.reward}G 획득${bonusMsg}`, 'success');
            renderAll();
        } else {
            showNotif('의뢰에 필요한 자원이 부족합니다.', 'error');
        }
    };

    window.toggleWarehouse = () => {
        const panel = document.getElementById('warehouse-panel');
        if (panel.classList.contains('hidden')) {
            panel.classList.remove('hidden');
            panel.classList.add('flex');
            return;
        }
        window.closeWarehousePanel();
    };

    window.closeWarehousePanel = () => {
        const panel = document.getElementById('warehouse-panel');
        panel.classList.add('hidden');
        panel.classList.remove('flex');
    };

    window.toggleTechModal = () => toggleModal('modal-tech', renderTechOptions);
    window.toggleRecipeModal = () => toggleModal('modal-recipe', renderRecipeList);
    window.toggleNewsModal = () => toggleModal('modal-news', renderNewsList);

    window.buyTech = (techId, cost) => {
        if (state.tech[techId]) return;
        const rd = Engine.countItemOnBoard('research');
        if (rd < cost) return showNotif('연구 데이터가 부족합니다.', 'error');
        if (!consumeBoardItem('research', cost)) return showNotif('연구 데이터 소모 중 오류가 발생했습니다.', 'error');
        state.tech[techId] = true;
        if (techId === 'warehouse') {
            const btn = document.getElementById('btn-toggle-warehouse');
            if (btn) {
                btn.classList.remove('hidden');
                btn.classList.add('flex');
            }
        }
        showNotif('기술 연구가 완료되었습니다!', 'success');
        renderTechOptions();
        renderAll();
    };

    window.toggleTradeModal = () => {
        const target = document.getElementById('trade-dynamic-content');
        if (target) {
            target.innerHTML = '<div class="w-full p-6 text-center"><div class="text-lg font-black text-purple-700 mb-2">거래 기능 준비 중</div><div class="text-sm font-bold text-slate-500">현재 빌드에서는 싱글/멀티 기본 플레이에 집중되어 있어, 거래 UI는 다음 업데이트에서 활성화됩니다.</div></div>';
        }
        toggleModal('modal-trade');
    };

    window.changeViewPlayer = (target = 'me') => {
        const overlay = document.getElementById('opponent-overlay');
        if (!overlay) return;
        if (target === 'me') {
            overlay.classList.add('hidden');
            overlay.classList.remove('flex');
        } else {
            overlay.classList.remove('hidden');
            overlay.classList.add('flex');
        }
    };
}

export function showSpecialtyModal() {
    const modal = document.getElementById('modal-specialty');
    const container = document.getElementById('specialty-options');
    container.innerHTML = Config.SPECIALTY_OPTIONS_ALL.map(opt => `
        <div class="bg-white/10 border-2 border-white/20 p-6 rounded-3xl cursor-pointer hover:bg-white/20 hover:scale-105 transition-all flex flex-col items-center text-center shadow-lg" onclick="window.selectSpecialty('${opt.id}')">
            ${opt.icon}
            <h3 class="text-xl font-black text-amber-300 mb-2">${opt.name}</h3>
            <p class="text-sm font-bold text-slate-200">${opt.desc}</p>
        </div>`).join('');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => modal.classList.remove('opacity-0'), 50);
}

function toggleModal(modalId, renderFunc) {
    const modal = document.getElementById(modalId);
    if (modal.classList.contains('hidden')) {
        if (renderFunc) renderFunc();
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => modal.classList.remove('opacity-0'), 10);
        return;
    }
    modal.classList.add('opacity-0');
    setTimeout(() => {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }, 300);
}

function consumeBoardItem(itemId, count) {
    let removed = 0;
    for (let i = state.stacks.length - 1; i >= 0; i--) {
        const stack = state.stacks[i];
        if (stack.crafting) continue;
        for (let j = stack.cards.length - 1; j >= 0; j--) {
            if (Engine.normalizeCard(stack.cards[j]) === itemId && removed < count) {
                stack.cards.splice(j, 1);
                removed++;
            }
        }
        if (stack.cards.length === 0) state.stacks.splice(i, 1);
        else Engine.checkAndSetRecipe(stack);
        if (removed >= count) break;
    }
    return removed >= count;
}
