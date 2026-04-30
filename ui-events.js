import * as Config from './config.js';
import * as Engine from './engine.js';
import { renderAll, renderBoard, showNotif } from './ui-render.js';

const state = Engine.state;

export function registerUiEvents() {
    window.handlePoolClick = (idx) => {
        if (Engine.takeResource(idx)) renderAll();
    };

    window.rerollPool = () => {
        if (!state.tech.warehouse) return showNotif('리롤은 창고 기술 연구 후 사용할 수 있습니다.', 'error');
        if (state.displayPool.length > 0) state.sharedPool.push(...state.displayPool);
        const source = ['wood', 'stone', 'seed', 'water', 'fire'];
        while (state.displayPool.length < 4) state.displayPool.push(source[Math.floor(Math.random() * source.length)]);
        Engine.processTurnEnd();
        showNotif('자원 풀을 리롤했습니다.');
        renderAll();
    };

    window.takeFromWarehouseUI = (id) => {
        const wrapper = document.getElementById('board-wrapper');
        const spawnX = wrapper.scrollLeft + wrapper.clientWidth / 2;
        const spawnY = wrapper.scrollTop + wrapper.clientHeight / 2;
        if (Engine.takeFromWarehouse(id, spawnX, spawnY)) renderAll();
    };

    window.cleanupAndLeave = () => { location.reload(); };

    bindBoardDragEvents();
    bindTooltipEvents();
    bindWarehousePanelDrag();
}

function bindBoardDragEvents() {
    let activeDrag = null;
    let startX = 0;
    let startY = 0;
    let initialStackX = 0;
    let initialStackY = 0;

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
        const idx = state.stacks.findIndex(s => s.id === stackId);
        state.draggingStack = state.stacks.splice(idx, 1)[0];
        stackEl.remove();
        renderBoard();
        const dragEl = document.querySelector(`[data-stack-id="${stackId}"]`);
        if (dragEl) dragEl.setPointerCapture(e.pointerId);
    });

    document.addEventListener('pointermove', (e) => {
        if (!activeDrag || !state.draggingStack) return;
        const dx = (e.clientX - startX) / state.zoom;
        const dy = (e.clientY - startY) / state.zoom;
        state.draggingStack.x = initialStackX + dx;
        state.draggingStack.y = initialStackY + dy;
        const dragEl = document.querySelector(`[data-stack-id="${activeDrag}"]`);
        if (dragEl) {
            dragEl.style.left = `${state.draggingStack.x}px`;
            dragEl.style.top = `${state.draggingStack.y}px`;
        }
        const marketZone = document.getElementById('market-zone');
        if (marketZone && dragEl) {
            const dragRect = dragEl.getBoundingClientRect();
            const mzRect = marketZone.getBoundingClientRect();
            if (Engine.checkCollision(dragRect, mzRect)) marketZone.classList.add('market-zone-active');
            else marketZone.classList.remove('market-zone-active');
        }
    });

    document.addEventListener('pointerup', () => {
        if (!activeDrag || !state.draggingStack) return;
        const dragEl = document.querySelector(`[data-stack-id="${activeDrag}"]`);
        if (!dragEl) return;
        const dragRect = dragEl.getBoundingClientRect();
        const dropX = state.draggingStack.x;
        const dropY = state.draggingStack.y;
        state.stacks.push(state.draggingStack);
        const draggedId = state.draggingStack.id;
        state.draggingStack = null;
        activeDrag = null;

        const marketZone = document.getElementById('market-zone');
        if (marketZone && Engine.checkCollision(dragRect, marketZone.getBoundingClientRect())) {
            marketZone.classList.remove('market-zone-active');
            const earned = Engine.sellStack(draggedId);
            if (earned > 0) {
                showNotif(`${earned}G 에 매각 완료!`, 'success');
                renderAll();
                return;
            }
            showNotif('매각할 수 없는 아이템이거나 제작 중입니다.', 'error');
        }

        const otherStacksRects = state.stacks
            .filter(s => s.id !== draggedId)
            .map(s => {
                const el = document.querySelector(`[data-stack-id="${s.id}"]`);
                return el ? { id: s.id, rect: el.getBoundingClientRect() } : null;
            })
            .filter(Boolean);
        Engine.handleDrop(draggedId, dropX, dropY, dragRect, otherStacksRects);
        renderAll();
    });
}

function bindTooltipEvents() {
    const tooltip = document.getElementById('tooltip');
    const tooltipContent = document.getElementById('tooltip-content');
    const boardArea = document.getElementById('board-area');
    const isBoardTooltipTarget = (target) => {
        if (!target) return false;
        const inBoard = boardArea?.contains(target);
        const inPool = !!target.closest('#ui-shared-pool');
        return inBoard || inPool;
    };

    const renderTooltip = (target, itemId) => {
        const related = Config.RECIPES.filter(r => r.inputs.includes(itemId) || r.results.includes(itemId));
        if (related.length === 0) {
            tooltipContent.innerHTML = '<div class="text-xs text-slate-500">관련 조합법이 없습니다.</div>';
        } else {
            tooltipContent.innerHTML = related.map(r => `<div class="bg-slate-50 p-2 rounded-lg text-[10px] border border-slate-200"><span class="font-black text-slate-700">${r.desc}</span> <span class="text-slate-400">(${r.turns}턴)</span><br><span class="text-slate-500">재료: ${r.inputs.map(i => Config.TILES[i].name).join(', ')}</span><br><span class="text-sky-600">결과: ${r.results.map(i => Config.TILES[i].name).join(', ')}</span></div>`).join('');
        }
        const rect = target.getBoundingClientRect();
        tooltip.style.left = `${Math.max(8, rect.left)}px`;
        tooltip.style.top = `${rect.bottom + 8}px`; // 오른쪽 대신 아래
        tooltip.classList.remove('hidden');
    };

    document.addEventListener('mouseover', (e) => {
        const target = e.target.closest('.tooltip-target');
        if (!target || !isBoardTooltipTarget(target)) {
            tooltip.classList.add('hidden');
            return;
        }
        const itemId = target.dataset.id;
        if (!itemId) return;
        renderTooltip(target, itemId);
    });

    // 자원 위 휠 스크롤은 조합법 창 스크롤로 소비 (보드/페이지 스크롤 방지)
    document.addEventListener('wheel', (e) => {
        const target = e.target.closest('.tooltip-target');
        if (!target || !isBoardTooltipTarget(target) || !target.dataset.id) return;
        renderTooltip(target, target.dataset.id);
        tooltipContent.scrollTop += e.deltaY;
        e.preventDefault();
        e.stopPropagation();
    }, { passive: false, capture: true });

    tooltipContent.addEventListener('wheel', (e) => {
        e.preventDefault();
        e.stopPropagation();
        tooltipContent.scrollTop += e.deltaY;
    }, { passive: false });

    // 퀘스트 영역 근처에서 툴팁이 남는 문제 방지
    const questBox = document.getElementById('active-quest-box');
    questBox?.addEventListener('mouseenter', () => {
        tooltip.classList.add('hidden');
    });
}

function bindWarehousePanelDrag() {
    const whHeader = document.getElementById('warehouse-header');
    const whPanel = document.getElementById('warehouse-panel');
    let isDraggingWH = false;
    let whStartX;
    let whStartY;
    let whInitialX;
    let whInitialY;

    whHeader?.addEventListener('mousedown', (e) => {
        isDraggingWH = true;
        whStartX = e.clientX;
        whStartY = e.clientY;
        whInitialX = whPanel.offsetLeft;
        whInitialY = whPanel.offsetTop;
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDraggingWH) return;
        whPanel.style.left = `${whInitialX + (e.clientX - whStartX)}px`;
        whPanel.style.top = `${whInitialY + (e.clientY - whStartY)}px`;
    });

    document.addEventListener('mouseup', () => { isDraggingWH = false; });
}
