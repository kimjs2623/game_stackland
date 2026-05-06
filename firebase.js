// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

let firebaseConfig;
window.isExternalMode = false;

// 파이어베이스 환경 설정 로직
try { 
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    firebaseConfig = JSON.parse(__firebase_config); 
  } else {
    window.isExternalMode = true;
    firebaseConfig = {
      apiKey: "AIzaSyDfItNnUuQ4wf6g8QPLiyXcjhXYEavRsKA",
      authDomain: "game-stackland.firebaseapp.com",
      projectId: "game-stackland",
      storageBucket: "game-stackland.firebasestorage.app",
      messagingSenderId: "684632891695",
      appId: "1:684632891695:web:5b186f9f5b0a108888c1da",
      measurementId: "G-4GPBGX5K4R"
    };
  }
} catch(e) { 
  window.isExternalMode = true;
  firebaseConfig = {
    apiKey: "AIzaSyDfItNnUuQ4wf6g8QPLiyXcjhXYEavRsKA",
    authDomain: "game-stackland.firebaseapp.com",
    projectId: "game-stackland",
    storageBucket: "game-stackland.firebasestorage.app",
    messagingSenderId: "684632891695",
    appId: "1:684632891695:web:5b186f9f5b0a108888c1da",
    measurementId: "G-4GPBGX5K4R"
  }; 
}

window.appId = typeof __app_id !== 'undefined' ? __app_id : 'sky-tycoon-external';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
window.db = getFirestore(app);

window.user = null;
window.isFirebaseReady = false;
window.authErrorMsg = ""; 

// 익명 로그인 및 인증 초기화
const initAuth = async () => {
    try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
        } else {
            await signInAnonymously(auth);
        }
    } catch(e) { 
        console.error("Firebase Auth Error:", e); 
        window.authErrorMsg = e.code; 
        window.isFirebaseReady = true; 
    }
};

onAuthStateChanged(auth, (u) => { 
    window.user = u; 
    window.isFirebaseReady = true; 
});

initAuth();