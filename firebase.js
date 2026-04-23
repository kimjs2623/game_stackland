// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDfItNnUuQ4wf6g8QPLiyXcjhXYEavRsKA",
    authDomain: "game-stackland.firebaseapp.com",
    projectId: "game-stackland",
    storageBucket: "game-stackland.firebasestorage.app",
    messagingSenderId: "684632891695",
    appId: "1:684632891695:web:5b186f9f5b0a108888c1da",
    measurementId: "G-4GPBGX5K4R"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// 인증 상태
export let currentUser = null;
export let isFirebaseReady = false;

// 초기화
export async function initAuth(onReadyCallback) {
    try {
        onAuthStateChanged(auth, (u) => { 
            currentUser = u; 
            isFirebaseReady = true;
            if(onReadyCallback) onReadyCallback();
        });
        await signInAnonymously(auth);
    } catch(e) { 
        console.warn("Firebase Auth Error:", e); 
    }
}
