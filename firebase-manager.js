import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { registerLobbyHandlers } from './lobby.js';
import { registerLeaderboardHandlers } from './leaderboard.js';

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

let myPlayerId = null;
signInAnonymously(auth)
    .then(() => {
        myPlayerId = auth.currentUser.uid;
        console.log('서버 연결 성공! PlayerID:', myPlayerId);
    })
    .catch((e) => console.error('서버 연결 실패:', e));

registerLobbyHandlers(db, () => myPlayerId);
registerLeaderboardHandlers(db);