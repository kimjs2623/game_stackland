import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, onSnapshot, collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import * as Engine from './engine.js';
import * as UI from './ui.js';

// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyDfItNnUuQ4wf6g8QPLiyXcjhXYEavRsKA",
    authDomain: "game-stackland.firebaseapp.com",
    projectId: "game-stackland",
    storageBucket: "game-stackland.firebasestorage.app",
    messagingSenderId: "684632891695",
    appId: "1:684632891695:web:5b186f9f5b0a108888c1da",
    measurementId: "G-4GPBGX5K4R"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

let currentRoomId = null;
let myPlayerId = null;
let isHost = false;
let unsubscribeRoom = null;

// 서버 자동 로그인
signInAnonymously(auth).then(() => {
    myPlayerId = auth.currentUser.uid;
    console.log("서버 연결 성공! PlayerID:", myPlayerId);
}).catch(e => console.error("서버 연결 실패:", e));


// ==========================================
// 1. 멀티플레이 로비 및 방 관리 로직
// ==========================================

window.showLobby = () => {
    const modal = document.getElementById('modal-lobby');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => modal.classList.remove('opacity-0'), 10);
};

window.hideLobby = () => {
    const modal = document.getElementById('modal-lobby');
    modal.classList.add('opacity-0');
    setTimeout(() => {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }, 300);
};

window.createRoom = async () => {
    if (!myPlayerId) return alert("서버에 연결 중입니다. 잠시 후 다시 시도해주세요.");
    
    const maxTurns = document.getElementById('room-max-turns-input').value;
    const roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    currentRoomId = roomCode;
    isHost = true;

    const roomRef = doc(db, 'rooms', currentRoomId);
    await setDoc(roomRef, {
        host: myPlayerId,
        status: 'waiting',
        maxTurns: parseInt(maxTurns),
        players: {
            [myPlayerId]: { name: `Player_${roomCode}`, isReady: true }
        }
    });

    window.hideLobby();
    showWaitingRoom();
    listenToRoom();
};

window.joinRoom = async () => {
    if (!myPlayerId) return;
    const codeInput = document.getElementById('room-code-input').value.toUpperCase();
    if (codeInput.length !== 4) return alert("4자리 방 코드를 입력하세요.");

    const roomRef = doc(db, 'rooms', codeInput);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) return alert("존재하지 않는 방입니다.");
    if (roomSnap.data().status !== 'waiting') return alert("이미 게임이 시작되었거나 종료된 방입니다.");

    currentRoomId = codeInput;
    isHost = false;

    await updateDoc(roomRef, {
        [`players.${myPlayerId}`]: { name: `Guest_${Math.floor(Math.random()*1000)}`, isReady: true }
    });

    window.hideLobby();
    showWaitingRoom();
    listenToRoom();
};

function showWaitingRoom() {
    const screen = document.getElementById('screen-waiting');
    document.getElementById('screen-menu').classList.add('hidden');
    screen.classList.remove('hidden');
    screen.classList.add('flex');
    setTimeout(() => screen.classList.remove('opacity-0'), 50);

    document.getElementById('waiting-room-code').innerText = currentRoomId;
    if (isHost) {
        document.getElementById('waiting-host-controls').classList.remove('hidden');
        document.getElementById('waiting-guest-controls').classList.add('hidden');
    } else {
        document.getElementById('waiting-host-controls').classList.add('hidden');
        document.getElementById('waiting-guest-controls').classList.remove('hidden');
    }
}

window.startMultiGame = async () => {
    if (!isHost || !currentRoomId) return;
    const roomRef = doc(db, 'rooms', currentRoomId);
    await updateDoc(roomRef, { status: 'playing' });
};

function listenToRoom() {
    if (!currentRoomId) return;
    const roomRef = doc(db, 'rooms', currentRoomId);
    
    unsubscribeRoom = onSnapshot(roomRef, (docSnap) => {
        if (!docSnap.exists()) return;
        const data = docSnap.data();

        // 대기실 UI 업데이트
        if (data.status === 'waiting') {
            const listEl = document.getElementById('waiting-players-list');
            if(listEl) {
                listEl.innerHTML = Object.values(data.players).map(p => `<li><i class="ph-fill ph-user text-indigo-500"></i> ${p.name}</li>`).join('');
            }
        }

        // 게임 시작 감지
        if (data.status === 'playing' && Engine.state.mode !== 'multi') {
            document.getElementById('screen-waiting').classList.add('hidden');
            document.getElementById('screen-waiting').classList.remove('flex');
            
            // 엔진 초기화 및 화면 전환
            Engine.initGame('multi', data.maxTurns, null);
            document.getElementById('screen-game').classList.remove('hidden');
            document.getElementById('screen-game').classList.add('flex');
            setTimeout(() => {
                document.getElementById('screen-game').classList.remove('opacity-0');
                document.getElementById('screen-game').classList.remove('pointer-events-none');
            }, 50);
            
            // 특산물 픽 모달 호출 (ui.js 로직)
            if(typeof window.showSpecialtyModal === 'function') {
                window.showSpecialtyModal();
            }
        }
    });
}


// ==========================================
// 2. 명예의 전당 (리더보드) 로직
// ==========================================

window.showLeaderboardModal = (turns = 50) => {
    const modal = document.getElementById('modal-leaderboard');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => modal.classList.remove('opacity-0'), 10);
    
    document.getElementById('leaderboard-turn-select').value = turns;
    window.fetchLeaderboard(turns);
};

window.closeLeaderboard = () => {
    const modal = document.getElementById('modal-leaderboard');
    modal.classList.add('opacity-0');
    setTimeout(() => {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }, 300);
};

window.fetchLeaderboard = async (turns) => {
    const listEl = document.getElementById('leaderboard-list');
    listEl.innerHTML = '<div class="text-center text-slate-400 py-10 font-bold animate-pulse">데이터를 불러오는 중...</div>';
    
    try {
        const q = query(collection(db, `leaderboard_${turns}`), orderBy("score", "desc"), limit(20));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            listEl.innerHTML = '<div class="text-center text-slate-400 py-10 font-bold">아직 등록된 기록이 없습니다.</div>';
            return;
        }

        let html = '';
        let rank = 1;
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}위`;
            html += `
                <div class="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                    <div class="flex items-center gap-3">
                        <span class="text-lg font-black w-8 text-center">${medal}</span>
                        <span class="font-bold text-slate-700">${data.name}</span>
                    </div>
                    <div class="font-black text-amber-600">${data.score.toLocaleString()} G</div>
                </div>
            `;
            rank++;
        });
        listEl.innerHTML = html;
    } catch (e) {
        console.error("리더보드 불러오기 실패:", e);
        listEl.innerHTML = '<div class="text-center text-red-400 py-10 font-bold">데이터를 불러오는데 실패했습니다.</div>';
    }
};

window.registerScore = async () => {
    const nameInput = document.getElementById('leaderboard-name-input').value.trim();
    if (!nameInput) return alert("닉네임을 입력해주세요!");
    if (nameInput.length > 10) return alert("닉네임은 10자 이내로 입력해주세요.");

    const score = Engine.state.money;
    const turns = Engine.state.maxTurns;

    try {
        await setDoc(doc(collection(db, `leaderboard_${turns}`)), {
            name: nameInput,
            score: score,
            timestamp: new Date().toISOString()
        });
        
        document.getElementById('register-score-section').classList.add('hidden');
        document.getElementById('register-success-section').classList.remove('hidden');
    } catch (e) {
        console.error("점수 등록 실패:", e);
        alert("점수 등록에 실패했습니다. 네트워크 상태를 확인해주세요.");
    }
};