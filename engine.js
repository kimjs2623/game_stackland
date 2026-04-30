import * as Config from './config.js';

// 게임 전체 상태 관리
export let state = {
    mode: 'single',
    turnCount: 1,
    maxTurns: 50,
    money: 0,
    stacks: [],
    sharedPool: [],
    displayPool: [],
    market: {},
    newsHistory: [],
    unlockedSpecialty: null,
    prof: { 
        farming: { lv: 1, exp: 0 }, 
        mining: { lv: 1, exp: 0 }, 
        woodcraft: { lv: 1, exp: 0 }, 
        cooking: { lv: 1, exp: 0 }, 
        smithing: { lv: 1, exp: 0 } 
    },
    tech: { tier_2: false, steel_upgrade: false, warehouse: false },
    warehouseItems: {},
    activeQuest: null,
    questTimer: 0,
    skyChanceLastCard: null,
    nextProductionBoost: 0,
    craftSpeedBoostTurns: 0,
    freeUpgradeCharges: 0,
    zoom: 1.0,
    isGameOver: false,
    nextStackId: 0
};

// 유틸리티 함수
export const normalizeCard = (c) => c ? c.replace('_upgraded', '') : '';
const generateStackId = () => `stack_${state.nextStackId++}`;

// 게임 초기화
export function initGame(mode = 'single', maxTurns = 50, specialty = null) {
    state.mode = mode;
    state.maxTurns = parseInt(maxTurns);
    state.unlockedSpecialty = specialty;
    state.turnCount = 1;
    state.money = 0;
    state.stacks = [];
    state.newsHistory = [];
    state.warehouseItems = {};
    state.activeQuest = null;
    state.questTimer = 0;
    state.skyChanceLastCard = null;
    state.nextProductionBoost = 0;
    state.craftSpeedBoostTurns = 0;
    state.freeUpgradeCharges = 0;
    state.isGameOver = false;
    state.prof = { farming: {lv:1, exp:0}, mining: {lv:1, exp:0}, woodcraft: {lv:1, exp:0}, cooking: {lv:1, exp:0}, smithing: {lv:1, exp:0} };
    state.tech = { tier_2: false, steel_upgrade: false, warehouse: false };

    initMarket();
    fillSharedPool(true);

    const cx = 1200; const cy = 800;
    const starts = ['villager', 'wood', 'stone', 'seed', 'water', 'fire'];
    
    starts.forEach((id, idx) => {
        const angle = (idx / starts.length) * Math.PI * 2;
        const r = 150;
        state.stacks.push({
            id: generateStackId(),
            x: cx + Math.cos(angle) * r - 36,
            y: cy + Math.sin(angle) * r - 52,
            cards: [id],
            crafting: null
        });
    });

}

export function initMarket() {
    state.market = {};
    Config.SELLABLE_ITEMS.forEach(id => {
        state.market[id] = { 
            currentPrice: Config.TILES[id].basePrice, 
            previousPrice: Config.TILES[id].basePrice, 
            trend: 0, supply: 0, pendingSupply: 0 
        };
    });
}

function fillSharedPool(isInit = false) {
    const poolItems = ['wood', 'stone', 'seed', 'water', 'fire'];
    if (isInit || state.sharedPool.length < 10) {
        state.sharedPool = Array.from({length: 100}, () => poolItems[Math.floor(Math.random() * poolItems.length)]);
    }
    state.displayPool = state.sharedPool.splice(0, 4);
}

// 보드 위 자원 개수 카운트
export function countItemOnBoard(itemId) {
    let count = 0;
    state.stacks.forEach(s => {
        s.cards.forEach(c => { if(normalizeCard(c) === itemId) count++; });
    });
    return count;
}

// 스택의 충돌 판정 알고리즘 (AABB Collision)
export function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

// 드래그 앤 드롭 결과 처리 (합치기 및 분리)
export function handleDrop(draggedStackId, dropX, dropY, dropRect, otherStacksRects) {
    const draggedStackIndex = state.stacks.findIndex(s => s.id === draggedStackId);
    if (draggedStackIndex === -1) return null;
    
    const draggedStack = state.stacks[draggedStackIndex];
    draggedStack.x = dropX;
    draggedStack.y = dropY;

    // 충돌 확인하여 합치기 시도
    for (let i = 0; i < otherStacksRects.length; i++) {
        const target = otherStacksRects[i];
        if (target.id !== draggedStackId && checkCollision(dropRect, target.rect)) {
            const targetStack = state.stacks.find(s => s.id === target.id);
            if (targetStack) {
                // 스택 합치기 (드래그한 카드를 타겟 카드 위에 얹음)
                targetStack.cards = [...targetStack.cards, ...draggedStack.cards];
                state.stacks.splice(draggedStackIndex, 1);
                checkAndSetRecipe(targetStack);
                return { action: 'merged', targetId: target.id };
            }
        }
    }

    // 충돌이 없으면 그냥 위치만 이동
    checkAndSetRecipe(draggedStack);
    return { action: 'moved' };
}

// 카드 조합 확인
export function checkAndSetRecipe(stack) {
    stack.crafting = null; 
    if (stack.cards.length < 2) return;

    const currentSorted = [...stack.cards].map(normalizeCard).sort().join(',');
    const matched = Config.RECIPES.filter(r => !r.isSpecialty || r.unlockId === state.unlockedSpecialty)
                                 .find(r => [...r.inputs].sort().join(',') === currentSorted);

    if (matched) {
        if (matched.tier === 2 && !state.tech.tier_2) return;
        
        let turns = matched.turns;
        if (matched.tier === 2 && state.prof[matched.category]?.lv >= 4) {
            turns = Math.max(1, turns - 1); // 숙련도 레벨 4 이상이면 턴 감소
        }
        if (state.craftSpeedBoostTurns > 0) {
            turns = Math.max(1, turns - 1);
            state.craftSpeedBoostTurns--;
        }
        stack.crafting = { recipeId: matched.id, left: turns, total: turns };
    }
}

// 경험치 획득 및 레벨업 처리
export function gainExp(category, amount) {
    if (!state.prof[category]) return;
    const p = state.prof[category];
    p.exp += amount;
    const req = p.lv * 100;
    if (p.exp >= req && p.lv < 5) {
        p.exp -= req;
        p.lv++;
        return true; // 레벨업 발생
    }
    return false;
}

// 턴 종료 처리 (핵심 루프)
export function processTurnEnd() {
    if (state.isGameOver) return;

    // 1. 퀘스트 타이머 감소
    if (state.activeQuest) {
        state.questTimer--;
        if (state.questTimer <= 0) state.activeQuest = null;
    } else if (state.turnCount >= 10 && state.turnCount % 10 === 0) { // 10턴부터 10턴마다
        generateQuest();
    }

    // 2. 조합 진행 (크래프팅)
    state.stacks.forEach(stack => {
        if (stack.crafting) {
            stack.crafting.left--;
            if (stack.crafting.left <= 0) {
                const recipe = Config.RECIPES.find(r => r.id === stack.crafting.recipeId);
                let crafted = [...recipe.results];
                if (state.nextProductionBoost > 0) {
                    crafted = [...crafted, ...recipe.results];
                    state.nextProductionBoost--;
                }
                stack.cards = crafted;
                stack.crafting = null;
                gainExp(recipe.category, recipe.tier === 2 ? 50 : 20); // 제작 경험치
                checkAndSetRecipe(stack);
            }
        }
    });

    // 3. 시장 시세 및 공급량 시뮬레이션
    Config.SELLABLE_ITEMS.forEach(id => {
        const m = state.market[id];
        m.previousPrice = m.currentPrice;
        m.supply += m.pendingSupply;
        m.pendingSupply = 0;
        m.supply *= 0.85; // 매 턴 공급량 15% 자연 감소 (수요 발생)

        const volatility = Config.TILES[id].volatility || 1.0;
        const supplyFactor = Math.max(0.2, 1 - (m.supply * 0.08 * volatility));
        const targetPrice = Config.TILES[id].basePrice * supplyFactor;
        
        m.currentPrice = Math.floor(m.previousPrice * 0.6 + targetPrice * 0.4);
        m.trend = m.currentPrice - m.previousPrice;
    });

    // 4. 무작위 시장 이벤트 발생 (5% 확률)
    if (Math.random() < 0.05) {
        const ev = Config.MARKET_EVENTS[Math.floor(Math.random() * Config.MARKET_EVENTS.length)];
        const targets = ev.targets || [ev.target];
        targets.forEach(tId => {
            if(state.market[tId]) {
                state.market[tId].currentPrice = Math.floor(state.market[tId].currentPrice * ev.effect);
            }
        });
        state.newsHistory.unshift(`[턴 ${state.turnCount}] ${ev.msg}`);
        if(state.newsHistory.length > 20) state.newsHistory.pop();
        // UI에서 스플래시 뉴스를 띄우기 위해 이벤트 반환 필요 (UI 로직에서 낚아챔)
        state.latestEvent = ev;
    } else {
        state.latestEvent = null;
    }

    state.turnCount++;
    if (state.turnCount > state.maxTurns) {
        state.isGameOver = true;
    }
}

// 퀘스트 생성 로직
export function generateQuest() {
    const isLateGame = state.turnCount >= 20;
    const pool = isLateGame ? Config.PROCESSING_ITEMS.concat(Config.TIER1_ITEMS) : Config.SELLABLE_ITEMS.slice(0, 8);
    
    const reqItem = pool[Math.floor(Math.random() * pool.length)];
    const reqAmount = isLateGame ? Math.floor(Math.random() * 2) + 1 : Math.floor(Math.random() * 3) + 2;
    
    const baseVal = Config.TILES[reqItem].basePrice * reqAmount;
    const reward = Math.floor(baseVal * 2.5); // 보상은 시세의 2.5배
    
    state.activeQuest = { reqItem, reqAmount, reward };
    state.questTimer = 15; // 퀘스트 제한 시간 15턴
}

// 퀘스트 납품 처리
export function completeQuest() {
    if (!state.activeQuest) return { success: false };
    const { reqItem, reqAmount, reward } = state.activeQuest;
    
    const available = countItemOnBoard(reqItem);
    if (available >= reqAmount) {
        let removed = 0;
        // 보드에서 아이템 제거
        for (let i = state.stacks.length - 1; i >= 0; i--) {
            const stack = state.stacks[i];
            if (!stack.crafting) {
                for (let j = stack.cards.length - 1; j >= 0; j--) {
                    if (normalizeCard(stack.cards[j]) === reqItem && removed < reqAmount) {
                        stack.cards.splice(j, 1);
                        removed++;
                    }
                }
                if (stack.cards.length === 0) state.stacks.splice(i, 1);
                else checkAndSetRecipe(stack);
            }
            if (removed >= reqAmount) break;
        }
        
        state.money += reward;
        const skyChance = applyRandomSkyChance();
        state.activeQuest = null;
        state.questTimer = 0;
        return { success: true, reward, skyChance };
    }
    return { success: false };
}

function spawnItem(itemId, x = 1200, y = 800) {
    state.stacks.push({
        id: generateStackId(),
        x: x + Math.random() * 50 - 25,
        y: y + Math.random() * 50 - 25,
        cards: [itemId],
        crafting: null
    });
}

function applyRandomSkyChance() {
    const cards = [
        { id: 1, name: '벼락치기', effect: '공정 1개 즉시 완료' },
        { id: 2, name: '풍요의 축복', effect: '다음 생산량 2배' },
        { id: 3, name: '마법 주머니', effect: '가공품 2개 즉시 획득' },
        { id: 4, name: '떠돌이 일꾼', effect: '주민 1명 즉시 영입' },
        { id: 5, name: '장인의 비급', effect: '전체 숙련도 경험치 +20' },
        { id: 6, name: '설계 자동화', effect: '다음 3회 공정 턴 수 -1' },
        { id: 7, name: '왕실의 하사금', effect: '골드 보너스 획득' },
        { id: 8, name: '기술자의 도구', effect: '건물 1회 무료 강화권' },
        { id: 9, name: '비밀 연구 일지', effect: '연구 데이터 1개 획득' },
        { id: 10, name: '물자 수송대', effect: '기초 자원 세트 획득' }
    ];
    const picked = cards[Math.floor(Math.random() * cards.length)];

    if (picked.id === 1) {
        const target = state.stacks.find(s => s.crafting && s.crafting.left > 0);
        if (target) target.crafting.left = 1;
    } else if (picked.id === 2) {
        state.nextProductionBoost = 1;
    } else if (picked.id === 3) {
        const pool = ['bread', 'iron', 'paper', 'brick', 'charcoal'];
        spawnItem(pool[Math.floor(Math.random() * pool.length)]);
        spawnItem(pool[Math.floor(Math.random() * pool.length)]);
    } else if (picked.id === 4) {
        spawnItem('villager');
    } else if (picked.id === 5) {
        Object.keys(state.prof).forEach((cat) => gainExp(cat, 20));
    } else if (picked.id === 6) {
        state.craftSpeedBoostTurns = 3;
    } else if (picked.id === 7) {
        state.money += 700;
    } else if (picked.id === 8) {
        state.freeUpgradeCharges = (state.freeUpgradeCharges || 0) + 1;
    } else if (picked.id === 9) {
        spawnItem('research');
    } else if (picked.id === 10) {
        ['wood', 'stone', 'iron', 'wheat', 'water'].forEach((itemId) => spawnItem(itemId));
    }

    state.skyChanceLastCard = picked;
    return picked;
}

// 시장 매각 처리
export function sellStack(stackId) {
    const stackIdx = state.stacks.findIndex(s => s.id === stackId);
    if (stackIdx === -1) return 0;
    
    const stack = state.stacks[stackIdx];
    if (stack.crafting) return 0; // 제작 중인 스택은 판매 불가

    let totalEarned = 0;
    stack.cards.forEach(card => {
        const id = normalizeCard(card);
        if (Config.SELLABLE_ITEMS.includes(id)) {
            const price = state.market[id].currentPrice;
            totalEarned += price;
            state.market[id].pendingSupply += 1;
            
            // 판매 시 숙련도 경험치 소량 제공
            const cat = Config.TILES[id].category;
            if(cat && cat !== 'general') gainExp(cat, 5);
        }
    });

    if (totalEarned > 0) {
        state.stacks.splice(stackIdx, 1);
        state.money += totalEarned;
    }
    return totalEarned;
}

// 자원 풀에서 가져오기
export function takeResource(poolIndex) {
    if (poolIndex < 0 || poolIndex >= state.displayPool.length) return false;
    
    const itemId = state.displayPool[poolIndex];
    state.displayPool.splice(poolIndex, 1); // 뺀 자리 비우기
    
    // 보드 중앙에 스폰
    state.stacks.push({
        id: generateStackId(),
        x: 1200 + Math.random() * 40 - 20,
        y: 800 + Math.random() * 40 - 20,
        cards: [itemId],
        crafting: null
    });

    // 디스플레이 풀이 비면 새로 채움
    if (state.displayPool.length === 0) {
        fillSharedPool();
    }
    
    processTurnEnd(); // 자원 가져오면 1턴 소모
    return true;
}

// 창고 넣기
export function putInWarehouse(stackId) {
    if (!state.tech.warehouse) return false;
    const stackIdx = state.stacks.findIndex(s => s.id === stackId);
    if (stackIdx === -1) return false;

    const stack = state.stacks[stackIdx];
    if (stack.crafting) return false;

    stack.cards.forEach(card => {
        const id = normalizeCard(card);
        state.warehouseItems[id] = (state.warehouseItems[id] || 0) + 1;
    });
    state.stacks.splice(stackIdx, 1);
    return true;
}

// 창고 빼기
export function takeFromWarehouse(itemId, spawnX, spawnY) {
    if (state.warehouseItems[itemId] && state.warehouseItems[itemId] > 0) {
        state.warehouseItems[itemId]--;
        if (state.warehouseItems[itemId] === 0) delete state.warehouseItems[itemId];
        
        state.stacks.push({
            id: generateStackId(),
            x: spawnX,
            y: spawnY,
            cards: [itemId],
            crafting: null
        });
        return true;
    }
    return false;
}