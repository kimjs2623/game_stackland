import { doc, getDoc, onSnapshot, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import * as Engine from './engine.js';
import { renderAll } from './ui-render.js';
import { showSpecialtyModal } from './ui-modals.js';

export function registerLobbyHandlers(db, getMyPlayerId) {
    let currentRoomId = null;
    let isHost = false;

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
        const myPlayerId = getMyPlayerId();
        if (!myPlayerId) return alert('서버에 연결 중입니다. 잠시 후 다시 시도해주세요.');
        const maxTurns = document.getElementById('room-max-turns-input').value;
        const roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
        currentRoomId = roomCode;
        isHost = true;
        await setDoc(doc(db, 'rooms', currentRoomId), {
            host: myPlayerId,
            status: 'waiting',
            maxTurns: parseInt(maxTurns),
            players: { [myPlayerId]: { name: `Player_${roomCode}`, isReady: true } }
        });
        window.hideLobby();
        showWaitingRoom();
        listenToRoom();
    };

    window.joinRoom = async () => {
        const myPlayerId = getMyPlayerId();
        if (!myPlayerId) return;
        const codeInput = document.getElementById('room-code-input').value.toUpperCase();
        if (codeInput.length !== 4) return alert('4자리 방 코드를 입력하세요.');
        const roomRef = doc(db, 'rooms', codeInput);
        const roomSnap = await getDoc(roomRef);
        if (!roomSnap.exists()) return alert('존재하지 않는 방입니다.');
        if (roomSnap.data().status !== 'waiting') return alert('이미 게임이 시작되었거나 종료된 방입니다.');
        currentRoomId = codeInput;
        isHost = false;
        await updateDoc(roomRef, {
            [`players.${myPlayerId}`]: { name: `Guest_${Math.floor(Math.random() * 1000)}`, isReady: true }
        });
        window.hideLobby();
        showWaitingRoom();
        listenToRoom();
    };

    window.startMultiGame = async () => {
        if (!isHost || !currentRoomId) return;
        await updateDoc(doc(db, 'rooms', currentRoomId), { status: 'playing' });
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

    function listenToRoom() {
        if (!currentRoomId) return;
        onSnapshot(doc(db, 'rooms', currentRoomId), (docSnap) => {
            if (!docSnap.exists()) return;
            const data = docSnap.data();
            if (data.status === 'waiting') {
                const listEl = document.getElementById('waiting-players-list');
                if (listEl) listEl.innerHTML = Object.values(data.players).map(p => `<li><i class="ph-fill ph-user text-indigo-500"></i> ${p.name}</li>`).join('');
            }
            if (data.status === 'playing' && Engine.state.mode !== 'multi') {
                document.getElementById('screen-waiting').classList.add('hidden');
                document.getElementById('screen-waiting').classList.remove('flex');
                Engine.initGame('multi', data.maxTurns, null);
                document.getElementById('screen-game').classList.remove('hidden');
                document.getElementById('screen-game').classList.add('flex');
                setTimeout(() => {
                    document.getElementById('screen-game').classList.remove('opacity-0');
                    document.getElementById('screen-game').classList.remove('pointer-events-none');
                    showSpecialtyModal();
                    renderAll();
                }, 50);
            }
        });
    }
}
