// Centralized Firebase client init.
// This file never throws at import time; if env is missing, db/auth become null and callers can fallback gracefully.

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

let app = null;
let db = null;
let auth = null;
let initError = null;

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

try {
  if (!cfg.apiKey || !cfg.projectId || String(cfg.apiKey).includes('undefined')) {
    initError = 'Firebase Web config 未設定完整，請確認 Vercel VITE_FIREBASE_* 並重新部署。';
  } else {
    app = getApps().length ? getApps()[0] : initializeApp(cfg);
    db = getFirestore(app);
    auth = getAuth(app);
  }
} catch (e) {
  initError = e.message;
  console.warn('[Firebase] init failed:', e.message);
}

export { app, db, auth };
export const getFirebaseInitError = () => initError;
export const isFirebaseReady = () => !!app && !!db;
export const requireDB = () => {
  if (!db) throw new Error(initError || 'Firebase Firestore 未初始化');
  return db;
};
