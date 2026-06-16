// Firebase 初始化（前端）
// VITE_FIREBASE_* 是 Firebase Web App config，允許在前端使用。
// 不要把 Gemini / Groq / Odds / Stripe secret key 放到 VITE_ 變數。

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app = null;
let auth = null;
let db = null;
let firebaseInitError = null;

try {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error('Firebase Web config missing. 請設定所有 VITE_FIREBASE_* 後重新部署。');
  }
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  firebaseInitError = e.message;
  console.warn('[Firebase] init skipped:', e.message);
}

export const getFirebaseInitError = () => firebaseInitError;
export { auth, db };
export default app;
