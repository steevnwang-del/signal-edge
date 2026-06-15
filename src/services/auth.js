import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut, onAuthStateChanged, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

let _auth = null, _db = null;
try {
  const cfg = { apiKey:import.meta.env.VITE_FIREBASE_API_KEY, authDomain:import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, projectId:import.meta.env.VITE_FIREBASE_PROJECT_ID, storageBucket:import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, messagingSenderId:import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, appId:import.meta.env.VITE_FIREBASE_APP_ID };
  const app = getApps().length===0 ? initializeApp(cfg) : getApps()[0];
  _auth = getAuth(app);
  _db = getFirestore(app);
} catch(e) { console.error('[Auth] Firebase init failed:', e.message); }

export const auth = _auth;

// LINE/WeChat/Facebook WebView 偵測
export const isWebView = () => {
  if (typeof navigator === 'undefined') return false;
  return /Line\/|FBAN|FBAV|MicroMessenger|Instagram|Snapchat/i.test(navigator.userAgent||'');
};
export const isLineBrowser = () => /Line\//i.test(typeof navigator!=='undefined'?navigator.userAgent||'':'');

const upsert = async (user, extra={}) => {
  if (!_db||!user) return;
  try {
    const ref=doc(_db,'users',user.uid), snap=await getDoc(ref);
    if (!snap.exists()) await setDoc(ref,{uid:user.uid,email:user.email,displayName:user.displayName||extra.displayName||'',role:'free',consent:false,source:extra.source||'email',createdAt:serverTimestamp(),lastLoginAt:serverTimestamp()});
    else await setDoc(ref,{lastLoginAt:serverTimestamp()},{merge:true});
  } catch(e){console.warn('[Auth] upsert:',e.message);}
};

export const registerEmail = async (email, pw, displayName) => {
  if (!_auth) throw new Error('Firebase Auth 未初始化，請確認 VITE_FIREBASE_* 環境變數已設定');
  const c=await createUserWithEmailAndPassword(_auth,email,pw);
  await updateProfile(c.user,{displayName});
  await upsert(c.user,{displayName,source:'email'});
  return c.user;
};

export const loginEmail = async (email, pw) => {
  if (!_auth) throw new Error('Firebase Auth 未初始化');
  const c=await signInWithEmailAndPassword(_auth,email,pw);
  await upsert(c.user);
  return c.user;
};

export const loginGoogle = async () => {
  if (!_auth) throw new Error('Firebase Auth 未初始化');
  const p = new GoogleAuthProvider();
  p.addScope('email'); p.addScope('profile');
  if (isWebView()) {
    // LINE/WeChat/Facebook WebView: 使用 redirect，不用 popup
    await signInWithRedirect(_auth, p);
    return null; // 頁面會被 redirect，App 重新載入後由 handleRedirectResult 處理
  }
  const c = await signInWithPopup(_auth, p);
  await upsert(c.user,{source:'google'});
  return c.user;
};

export const handleRedirectResult = async () => {
  if (!_auth) return null;
  try {
    const result = await getRedirectResult(_auth);
    if (result?.user) { await upsert(result.user,{source:'google'}); return result.user; }
  } catch(e) { console.warn('[Auth] redirect:',e.message); }
  return null;
};

export const resetPassword = email => {
  if (!_auth) throw new Error('Firebase Auth 未初始化');
  return sendPasswordResetEmail(_auth, email);
};
export const logout = () => _auth ? signOut(_auth) : Promise.resolve();
export const getUserRole = async uid => {
  if (!_db) return 'free';
  try { const s=await getDoc(doc(_db,'users',uid)); return s.exists()?(s.data().role||'free'):'free'; } catch { return 'free'; }
};
export const onAuth = cb => {
  if (!_auth) { cb(null); return ()=>{}; }
  return onAuthStateChanged(_auth, cb);
};
