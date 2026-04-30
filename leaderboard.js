import { collection, doc, getDocs, limit, orderBy, query, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import * as Engine from './engine.js';

export function registerLeaderboardHandlers(db) {
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
            const q = query(collection(db, `leaderboard_${turns}`), orderBy('score', 'desc'), limit(20));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                listEl.innerHTML = '<div class="text-center text-slate-400 py-10 font-bold">아직 등록된 기록이 없습니다.</div>';
                return;
            }
            let html = '';
            let rank = 1;
            querySnapshot.forEach((entry) => {
                const data = entry.data();
                const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}위`;
                html += `<div class="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-slate-100"><div class="flex items-center gap-3"><span class="text-lg font-black w-8 text-center">${medal}</span><span class="font-bold text-slate-700">${data.name}</span></div><div class="font-black text-amber-600">${data.score.toLocaleString()} G</div></div>`;
                rank++;
            });
            listEl.innerHTML = html;
        } catch (e) {
            console.error('리더보드 불러오기 실패:', e);
            listEl.innerHTML = '<div class="text-center text-red-400 py-10 font-bold">데이터를 불러오는데 실패했습니다.</div>';
        }
    };

    window.registerScore = async () => {
        const nameInput = document.getElementById('leaderboard-name-input').value.trim();
        if (!nameInput) return alert('닉네임을 입력해주세요!');
        if (nameInput.length > 10) return alert('닉네임은 10자 이내로 입력해주세요.');
        try {
            await setDoc(doc(collection(db, `leaderboard_${Engine.state.maxTurns}`)), {
                name: nameInput,
                score: Engine.state.money,
                timestamp: new Date().toISOString()
            });
            document.getElementById('register-score-section').classList.add('hidden');
            document.getElementById('register-success-section').classList.remove('hidden');
        } catch (e) {
            console.error('점수 등록 실패:', e);
            alert('점수 등록에 실패했습니다. 네트워크 상태를 확인해주세요.');
        }
    };
}
