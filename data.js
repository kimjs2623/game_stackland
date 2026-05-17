// data.js
export const TILES = {
    wood: { name: '나무', category: 'woodcraft', cardClass: 'bg-emerald-100 text-emerald-800 border-emerald-400', textColor: 'text-emerald-700', icon: '<i class="ph-fill ph-tree-evergreen text-3xl"></i>', basePrice: 40, volatility: 1.0 },
    stone: { name: '바위', category: 'mining', cardClass: 'bg-stone-200 text-stone-800 border-stone-400', textColor: 'text-stone-700', icon: '<i class="ph-fill ph-mountains text-3xl"></i>', basePrice: 40, volatility: 0.8 },
    seed: { name: '씨앗', category: 'farming', cardClass: 'bg-lime-100 text-lime-800 border-lime-400', textColor: 'text-lime-700', icon: '<i class="ph-fill ph-plant text-3xl"></i>', basePrice: 60, volatility: 1.2 },
    water: { name: '물', category: 'farming', cardClass: 'bg-cyan-100 text-cyan-800 border-cyan-400', textColor: 'text-cyan-700', icon: '<i class="ph-fill ph-drop text-3xl"></i>', basePrice: 40, volatility: 0.5 },
    fire: { name: '불', category: 'cooking', cardClass: 'bg-orange-100 text-orange-800 border-orange-400', textColor: 'text-orange-700', icon: '<i class="ph-fill ph-fire text-3xl"></i>', basePrice: 40, volatility: 0.5 },
    
    charcoal: { name: '목탄', ingredients: ['wood', 'fire'], category: 'woodcraft', cardClass: 'bg-zinc-800 text-zinc-100 border-zinc-600', textColor: 'text-zinc-600', icon: '<i class="ph-fill ph-fire text-3xl text-orange-500"></i>', basePrice: 150, volatility: 1.0 },
    iron: { name: '철', ingredients: ['fire', 'stone'], category: 'smithing', cardClass: 'bg-slate-300 text-slate-800 border-slate-500', textColor: 'text-slate-700', icon: '<i class="ph-fill ph-wall text-3xl"></i>', basePrice: 150, volatility: 1.5 },
    wheat: { name: '밀', category: 'farming', cardClass: 'bg-yellow-100 text-yellow-800 border-yellow-500', textColor: 'text-yellow-700', icon: '<i class="ph-fill ph-grains text-3xl"></i>', basePrice: 120, volatility: 1.0 },
    paper: { name: '종이', ingredients: ['wood', 'water'], category: 'woodcraft', cardClass: 'bg-slate-100 text-slate-800 border-slate-300', textColor: 'text-slate-700', icon: '<i class="ph-fill ph-scroll text-3xl"></i>', basePrice: 150, volatility: 0.5 },
    steel: { name: '강철', ingredients: ['charcoal', 'iron'], category: 'smithing', cardClass: 'bg-slate-700 text-slate-100 border-slate-900', textColor: 'text-slate-800', icon: '<i class="ph-fill ph-cube text-3xl"></i>', basePrice: 500, volatility: 1.2 },
    brick: { name: '벽돌', ingredients: ['charcoal', 'stone', 'stone'], category: 'mining', cardClass: 'bg-red-800 text-red-100 border-red-900', textColor: 'text-red-700', icon: '<i class="ph-fill ph-bricks text-3xl"></i>', basePrice: 400, volatility: 0.8 },
    bread: { name: '빵', ingredients: ['fire', 'wheat'], category: 'cooking', cardClass: 'bg-amber-200 text-amber-900 border-amber-500', textColor: 'text-amber-700', icon: '<i class="ph-fill ph-bread text-3xl"></i>', basePrice: 300, volatility: 0.8 },
    
    research: { name: '연구 데이터', category: 'general', cardClass: 'bg-purple-100 text-purple-800 border-purple-400', textColor: 'text-purple-700', icon: '<i class="ph-fill ph-flask text-3xl"></i>', basePrice: 300, volatility: 0.2 },
    
    laboratory: { name: '연구소', category: 'general', cardClass: 'bg-purple-700 text-white border-purple-900', textColor: 'text-purple-700', icon: '<i class="ph-fill ph-flask text-3xl"></i>', basePrice: 0 },
    villager: { name: '주민', category: 'general', cardClass: 'bg-orange-50 text-orange-700 border-orange-400', textColor: 'text-orange-600', icon: '<i class="ph-fill ph-users text-3xl"></i>', basePrice: 0 },
    lumber_mill: { name: '벌목장', category: 'woodcraft', cardClass: 'bg-emerald-700 text-white border-emerald-900', textColor: 'text-emerald-700', icon: '<i class="ph-fill ph-tent text-3xl"></i>', basePrice: 0 },
    quarry: { name: '채석장', category: 'mining', cardClass: 'bg-stone-700 text-white border-stone-900', textColor: 'text-stone-700', icon: '<i class="ph-fill ph-hammer text-3xl"></i>', basePrice: 0 },
    farm: { name: '농장', category: 'farming', cardClass: 'bg-yellow-600 text-white border-yellow-800', textColor: 'text-yellow-700', icon: '<i class="ph-fill ph-barn text-3xl"></i>', basePrice: 0 },
    house: { name: '오두막', category: 'woodcraft', cardClass: 'bg-pink-400 text-white border-pink-600', textColor: 'text-pink-600', icon: '<i class="ph-fill ph-house text-3xl"></i>', basePrice: 0, type: '일회용 건축 자산' },
    furnace: { name: '화로', category: 'cooking', cardClass: 'bg-orange-600 text-white border-orange-800', textColor: 'text-orange-700', icon: '<i class="ph-fill ph-campfire text-3xl"></i>', basePrice: 0 },
    well: { name: '우물', category: 'farming', cardClass: 'bg-blue-300 text-blue-900 border-blue-500', textColor: 'text-blue-800', icon: '<i class="ph-fill ph-drop text-3xl text-blue-600"></i>', basePrice: 0 },
    warehouse_building: { name: '대형 창고', category: 'general', cardClass: 'bg-stone-700 text-stone-100 border-stone-900', textColor: 'text-stone-300', icon: '<i class="ph-fill ph-package text-3xl"></i>', basePrice: 0 },
  
    mana_crystal: { name: '마나석', tier: 1, ingredients: ['water', 'stone', 'fire'], category: 'mining', cardClass: 'bg-indigo-200 text-indigo-900 border-indigo-500', textColor: 'text-indigo-800', icon: '<i class="ph-fill ph-sketch-logo text-3xl text-indigo-600"></i>', basePrice: 450, volatility: 2.0 },
    golden_apple: { name: '황금사과', tier: 1, ingredients: ['seed', 'wood', 'water'], category: 'farming', cardClass: 'bg-yellow-300 text-yellow-900 border-yellow-500', textColor: 'text-yellow-800', icon: '<i class="ph-fill ph-apple-logo text-3xl text-red-500"></i>', basePrice: 500, volatility: 1.5 },
    sky_cloth: { name: '천공의 천', tier: 1, ingredients: ['wheat', 'fire', 'water'], category: 'woodcraft', cardClass: 'bg-sky-100 text-sky-800 border-sky-400', textColor: 'text-sky-700', icon: '<i class="ph-fill ph-scroll text-3xl text-sky-500"></i>', basePrice: 600, volatility: 1.2 },
    golem_core: { name: '골렘 코어', tier: 1, ingredients: ['iron', 'stone', 'fire'], category: 'mining', cardClass: 'bg-zinc-300 text-zinc-900 border-zinc-500', textColor: 'text-zinc-800', icon: '<i class="ph-fill ph-cpu text-3xl text-zinc-600"></i>', basePrice: 650, volatility: 1.8 },
    fairy_bread: { name: '요정의 빵', tier: 1, ingredients: ['bread', 'water', 'seed'], category: 'cooking', cardClass: 'bg-pink-200 text-pink-900 border-pink-400', textColor: 'text-pink-800', icon: '<i class="ph-fill ph-bread text-3xl text-pink-500"></i>', basePrice: 800, volatility: 1.5 },
    magic_book: { name: '마법 마도서', tier: 1, ingredients: ['paper', 'water', 'fire'], category: 'woodcraft', cardClass: 'bg-purple-200 text-purple-900 border-purple-400', textColor: 'text-purple-800', icon: '<i class="ph-fill ph-book-bookmark text-3xl text-purple-600"></i>', basePrice: 650, volatility: 1.4 },
  
    elixir: { name: '엘릭서', tier: 2, ingredients: ['mana_crystal', 'water'], category: 'cooking', cardClass: 'bg-fuchsia-300 text-fuchsia-900 border-fuchsia-500', textColor: 'text-fuchsia-800', icon: '<i class="ph-fill ph-potion text-3xl text-fuchsia-600"></i>', basePrice: 1800, volatility: 2.5 },
    star_fruit: { name: '별빛열매', tier: 2, ingredients: ['golden_apple', 'seed'], category: 'farming', cardClass: 'bg-amber-300 text-amber-900 border-amber-600', textColor: 'text-amber-800', icon: '<i class="ph-fill ph-star text-3xl text-white"></i>', basePrice: 1900, volatility: 1.8 },
    magic_carpet: { name: '마법 양탄자', tier: 2, ingredients: ['sky_cloth', 'fire'], category: 'woodcraft', cardClass: 'bg-purple-300 text-purple-900 border-purple-500', textColor: 'text-purple-800', icon: '<i class="ph-fill ph-rug text-3xl text-purple-600"></i>', basePrice: 2000, volatility: 1.5 },
    mecha_golem: { name: '메카 골렘', tier: 2, ingredients: ['golem_core', 'iron'], category: 'mining', cardClass: 'bg-slate-800 text-slate-100 border-slate-900', textColor: 'text-slate-600', icon: '<i class="ph-fill ph-robot text-3xl text-slate-400"></i>', basePrice: 2300, volatility: 2.2 },
    ambrosia: { name: '암브로시아', tier: 2, ingredients: ['fairy_bread', 'water'], category: 'cooking', cardClass: 'bg-rose-300 text-rose-900 border-rose-600', textColor: 'text-rose-800', icon: '<i class="ph-fill ph-wine text-3xl text-rose-600"></i>', basePrice: 2400, volatility: 2.0 },
    ancient_scroll: { name: '고대 마도서', tier: 2, ingredients: ['magic_book', 'paper'], category: 'woodcraft', cardClass: 'bg-yellow-600 text-yellow-100 border-yellow-800', textColor: 'text-yellow-900', icon: '<i class="ph-fill ph-scroll text-3xl text-yellow-300"></i>', basePrice: 2300, volatility: 1.7 }
  };
  
  export const SELLABLE_ITEMS = ['wood', 'stone', 'water', 'fire', 'seed', 'wheat', 'charcoal', 'iron', 'brick', 'steel', 'bread', 'paper', 'research', 'mana_crystal', 'golden_apple', 'sky_cloth', 'golem_core', 'fairy_bread', 'magic_book', 'elixir', 'star_fruit', 'magic_carpet', 'mecha_golem', 'ambrosia', 'ancient_scroll'];
  
  export const CAT_INFO = { 
    farming: { icon: '<i class="ph-fill ph-plant text-lime-500"></i>', name: '농업' }, 
    mining: { icon: '<i class="ph-fill ph-diamond text-stone-500"></i>', name: '채광' }, 
    woodcraft: { icon: '<i class="ph-fill ph-axe text-emerald-500"></i>', name: '목공' }, 
    cooking: { icon: '<i class="ph-fill ph-campfire text-orange-500"></i>', name: '요리' }, 
    smithing: { icon: '<i class="ph-fill ph-hammer text-slate-500"></i>', name: '제련' } 
  };
  
  export const PROCESSING_ITEMS = ['charcoal', 'iron', 'paper', 'bread', 'brick', 'steel'];
  export const TIER1_ITEMS = ['mana_crystal', 'golden_apple', 'sky_cloth', 'golem_core', 'fairy_bread', 'magic_book'];
  export const TIER2_ITEMS = ['elixir', 'star_fruit', 'magic_carpet', 'mecha_golem', 'ambrosia', 'ancient_scroll'];
  export const UPGRADABLE_BUILDINGS = ['lumber_mill', 'quarry', 'well', 'furnace', 'farm'];
  
  export const RECIPES = [
    { id: 'c1', category: 'woodcraft', inputs: ['wood', 'fire'], results: ['charcoal'], turns: 1, desc: '목탄 굽기' },
    { id: 'r1', category: 'smithing', inputs: ['fire', 'stone'], results: ['iron'], turns: 1, desc: '철 제련' },
    { id: 'r2', category: 'cooking', inputs: ['fire', 'wheat'], results: ['bread'], turns: 1, desc: '제빵' },
    { id: 'r8', category: 'farming', inputs: ['farm', 'villager', 'wheat'], results: ['farm', 'villager', 'seed', 'seed', 'seed'], turns: 1, desc: '탈곡 (대량 추출)' }, 
    { id: 'p_p1', category: 'woodcraft', inputs: ['wood', 'water'], results: ['paper'], turns: 1, desc: '종이 만들기' },
    { id: 'c2', category: 'smithing', inputs: ['charcoal', 'iron'], results: ['steel'], turns: 2, desc: '강철 제련' },
    { id: 'c3', category: 'mining', inputs: ['charcoal', 'stone', 'stone'], results: ['brick'], turns: 2, desc: '벽돌 굽기' },
    { id: 'r3', category: 'woodcraft', inputs: ['stone', 'wood'], results: ['lumber_mill'], turns: 2, desc: '벌목장 건설' },
    { id: 'r4', category: 'mining', inputs: ['iron', 'stone'], results: ['quarry'], turns: 2, desc: '채석장 건설' },
    { id: 'r5', category: 'farming', inputs: ['seed', 'water'], results: ['farm'], turns: 2, desc: '농장 건설' },
    { id: 'r6', category: 'woodcraft', inputs: ['iron', 'wood'], results: ['house'], turns: 2, desc: '오두막 건설' },
    { id: 'r_f1', category: 'cooking', inputs: ['wood', 'stone', 'fire'], results: ['furnace'], turns: 2, desc: '화로 건설' },
    { id: 'p_f1', category: 'cooking', inputs: ['furnace', 'villager', 'wood'], results: ['furnace', 'villager', 'fire', 'fire'], turns: 1, desc: '불 피우기' },
    { id: 'r_w1', category: 'farming', inputs: ['stone', 'wood', 'water'], results: ['well'], turns: 2, desc: '우물 건설' },
    { id: 'p_w1', category: 'farming', inputs: ['well', 'villager'], results: ['well', 'villager', 'water', 'water'], turns: 1, desc: '물 긷기' },
    { id: 'l1', category: 'general', inputs: ['stone', 'iron', 'wood'], results: ['laboratory'], turns: 3, desc: '연구소 건설' },
    { id: 'r7', category: 'general', inputs: ['house', 'bread'], results: ['villager'], turns: 2, desc: '주민 영입 (오두막 소모)' },
    { id: 'b_w1', category: 'general', inputs: ['brick', 'brick', 'brick', 'steel'], results: ['warehouse_building'], turns: 3, desc: '대형 창고 건설' },
    { id: 'p1', category: 'woodcraft', inputs: ['lumber_mill', 'villager'], results: ['lumber_mill', 'villager', 'wood'], turns: 1, desc: '벌목 작업' },
    { id: 'p2', category: 'mining', inputs: ['quarry', 'villager'], results: ['quarry', 'villager', 'stone'], turns: 1, desc: '채석 작업' },
    { id: 'p3', category: 'farming', inputs: ['farm', 'seed', 'villager'], results: ['farm', 'villager', 'wheat'], turns: 2, desc: '밀 경작' },
    { id: 'l2', category: 'general', inputs: ['laboratory', 'paper', 'villager'], results: ['laboratory', 'villager', 'research'], turns: 2, desc: '연구 진행' },
    { id: 's1', category: 'mining', tier: 1, inputs: ['water', 'stone', 'fire'], results: ['mana_crystal'], turns: 3, desc: '마나석 가공 (1티어)', isSpecialty: true, unlockId: 'mana_crystal' },
    { id: 's2', category: 'farming', tier: 1, inputs: ['seed', 'wood', 'water'], results: ['golden_apple'], turns: 3, desc: '황금사과 재배 (1티어)', isSpecialty: true, unlockId: 'golden_apple' },
    { id: 's3', category: 'woodcraft', tier: 1, inputs: ['wheat', 'fire', 'water'], results: ['sky_cloth'], turns: 3, desc: '천공의 천 직조 (1티어)', isSpecialty: true, unlockId: 'sky_cloth' },
    { id: 's7', category: 'mining', tier: 1, inputs: ['iron', 'stone', 'fire'], results: ['golem_core'], turns: 3, desc: '골렘 코어 조립 (1티어)', isSpecialty: true, unlockId: 'golem_core' },
    { id: 's8', category: 'cooking', tier: 1, inputs: ['bread', 'water', 'seed'], results: ['fairy_bread'], turns: 3, desc: '요정의 빵 굽기 (1티어)', isSpecialty: true, unlockId: 'fairy_bread' },
    { id: 's9', category: 'woodcraft', tier: 1, inputs: ['paper', 'water', 'fire'], results: ['magic_book'], turns: 3, desc: '마법 마도서 제작 (1티어)', isSpecialty: true, unlockId: 'magic_book' },
    { id: 's4', category: 'cooking', tier: 2, inputs: ['mana_crystal', 'research', 'water'], results: ['elixir'], turns: 4, desc: '엘릭서 연성 (2티어)', isSpecialty: true, unlockId: 'mana_crystal' },
    { id: 's5', category: 'farming', tier: 2, inputs: ['golden_apple', 'research', 'seed'], results: ['star_fruit'], turns: 4, desc: '별빛열매 개량 (2티어)', isSpecialty: true, unlockId: 'golden_apple' },
    { id: 's6', category: 'woodcraft', tier: 2, inputs: ['sky_cloth', 'research', 'fire'], results: ['magic_carpet'], turns: 4, desc: '마법 양탄자 제작 (2티어)', isSpecialty: true, unlockId: 'sky_cloth' },
    { id: 's10', category: 'mining', tier: 2, inputs: ['golem_core', 'research', 'iron'], results: ['mecha_golem'], turns: 4, desc: '메카 골렘 가동 (2티어)', isSpecialty: true, unlockId: 'golem_core' },
    { id: 's11', category: 'cooking', tier: 2, inputs: ['fairy_bread', 'research', 'water'], results: ['ambrosia'], turns: 4, desc: '암브로시아 양조 (2티어)', isSpecialty: true, unlockId: 'fairy_bread' },
    { id: 's12', category: 'woodcraft', tier: 2, inputs: ['magic_book', 'research', 'paper'], results: ['ancient_scroll'], turns: 4, desc: '고대 마도서 복원 (2티어)', isSpecialty: true, unlockId: 'magic_book' }
  ];
  
  export const SPECIALTY_OPTIONS_ALL = [
    { id: 'mana_crystal', name: '마나석 (채광)', desc: '물, 바위, 불을 결합해 만드는 1티어 보석. <br><span class="text-xs text-sky-200">연구소 개방 시 2티어 [엘릭서] 제작 가능</span>', icon: '<i class="ph-fill ph-sketch-logo text-5xl text-indigo-500 mb-2"></i>' },
    { id: 'golden_apple', name: '황금사과 (농업)', desc: '씨앗, 나무, 물로 재배하는 1티어 열매. <br><span class="text-xs text-sky-200">연구소 개방 시 2티어 [별빛열매] 제작 가능</span>', icon: '<i class="ph-fill ph-apple-logo text-5xl text-red-500 mb-2"></i>' },
    { id: 'sky_cloth', name: '천공의 천 (목공)', desc: '밀, 불, 물을 가공해 만드는 1티어 마법 천. <br><span class="text-xs text-sky-200">연구소 개방 시 2티어 [마법 양탄자] 제작 가능</span>', icon: '<i class="ph-fill ph-scroll text-5xl text-sky-500 mb-2"></i>' },
    { id: 'golem_core', name: '골렘 코어 (채광)', desc: '철, 바위, 불을 결합해 만드는 기계 심장. <br><span class="text-xs text-sky-200">연구소 개방 시 2티어 [메카 골렘] 제작 가능</span>', icon: '<i class="ph-fill ph-cpu text-5xl text-zinc-500 mb-2"></i>' },
    { id: 'fairy_bread', name: '요정의 빵 (요리)', desc: '빵, 물, 씨앗으로 굽는 달콤한 마법 빵. <br><span class="text-xs text-sky-200">연구소 개방 시 2티어 [암브로시아] 제작 가능</span>', icon: '<i class="ph-fill ph-bread text-5xl text-pink-400 mb-2"></i>' },
    { id: 'magic_book', name: '마법 마도서 (목공)', desc: '종이, 물, 불로 제작하는 마법 부여 책. <br><span class="text-xs text-sky-200">연구소 개방 시 2티어 [고대 마도서] 제작 가능</span>', icon: '<i class="ph-fill ph-book-bookmark text-5xl text-purple-500 mb-2"></i>' }
  ];
  
  export const MARKET_EVENTS = [
    { msg: "[속보] 거대한 철광맥 발견! 철강 공급 과잉으로 철 가격 폭락 예상.", target: "iron", effect: 0.5, type: "down", title: "철강 파동" },
    { msg: "[속보] 혹독한 가뭄 발생! 물과 밀의 품귀현상 발생.", targets: ["water", "wheat"], effect: 1.8, type: "up", title: "심각한 가뭄" },
    { msg: "[이슈] 왕실에서 대규모 축제 선포! 빵과 엘릭서의 수요가 폭발합니다.", targets: ["bread", "elixir"], effect: 2.0, type: "up", title: "왕실 축제" },
    { msg: "[재난] 원인 모를 산불 발생! 나무와 종이의 가치가 상승합니다.", targets: ["wood", "paper"], effect: 1.5, type: "up", title: "대형 산불" },
    { msg: "[동향] 건축 붐 발생! 벽돌과 강철 가격 급등 중.", targets: ["brick", "steel"], effect: 1.4, type: "up", title: "건축 붐" },
    { msg: "[연구] 아카데미에서 논문 공모전 개최. 연구 데이터 가격 상승!", target: "research", effect: 1.8, type: "up", title: "연구 지원금" }
  ];
  // 스카이 찬스 풀 (퀘스트 완료 시 랜덤 발동)
export const SKY_CHANCES = [
    { id: 1, name: "벼락치기", effect: "진행 중인 공정 1개 즉시 완료" },
    { id: 2, name: "풍요의 축복", effect: "기초 자원(나무, 바위, 밀) 3개씩 즉시 획득" },
    { id: 3, name: "마법 주머니", effect: "가공품(빵, 철) 2개 즉시 획득" },
    { id: 4, name: "떠돌이 일꾼", effect: "집/빵 없이 즉시 주민 1명 영입" },
    { id: 5, "name": "장인의 비급", "effect": "모든 숙련도 경험치 +20 (즉시 레벨업 수준)" },
    { id: 6, "name": "설계 자동화", "effect": "보드의 나무와 바위를 즉시 종이와 벽돌로 변환" },
    { id: 7, "name": "왕실의 하사금", "effect": "즉시 500 골드 획득" },
    { id: 8, "name": "기술자의 도구", "effect": "대형 창고 즉시 건설" },
    { id: 9, "name": "비밀 연구 일지", "effect": "연구 데이터(RD) 1개 즉시 획득" },
    { id: 10, "name": "물자 수송대", "effect": "나무, 바위, 철, 밀, 물 각 1개씩 획득" }
  ];

  // data.js 맨 아래 추가
export const UPDATE_NOTES = [
  {
    version: "v1.5",
    versionColor: "bg-indigo-500",
    titleColor: "text-indigo-700",
    title: "창고, 퀘스트, 그리고 뽑기(가챠) 시스템",
    lines: [
      "<b>UI 스크롤 픽스:</b> 툴팁이나 노트 스크롤 시 화면이 같이 움직이는 현상을 완벽히 차단했습니다.",
      "<b>가챠(뽑기) 시스템:</b> 퀘스트 완료 시 즉시 발동되지 않고, 스카이 찬스를 뽑기권으로 얻어 원할 때 뽑을 수 있습니다.",
      "<b>뽑기권 보관함:</b> 화면 우측에 뽑기권 보관함이 생성되며, 마우스를 올리면 효과를 미리 볼 수 있습니다.",
      "<b>명예의 전당 버그 수정:</b> 랭킹 버튼이 작동하지 않던 문제를 수정했습니다."
    ]
  },
  {
    version: "v1.4",
    versionColor: "bg-slate-400",
    titleColor: "text-slate-600",
    title: "Industrial Revolution",
    lines: [
      "'연구 데이터'를 소모한 기술 연구(2티어 해금, 강철 강화, 창고 물류) 추가",
      "매각 시 대량의 숙련도 XP 획득 가능"
    ]
  }
];