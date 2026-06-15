import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut, onAuthStateChanged, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { OWNER_EMAIL, ROLES, isOwner } from '../config/owner';

let _auth=null, _db=null, _initError=null;

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
if (!apiKey || apiKey==='undefined' || !apiKey.trim()) {
  _initError='VITE_FIREBASE_API_KEY 未設定。請在 Vercel → Settings → Environment Variables 加入所有 VITE_FIREBASE_* 後 Redeploy。';
  console.error('[Auth]', _initError);
} else {
  try {
    const cfg={ apiKey, authDomain:import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, projectId:import.meta.env.VITE_FIREBASE_PROJECT_ID, storageBucket:import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, messagingSenderId:import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, appId:import.meta.env.VITE_FIREBASE_APP_ID };
    const app=getApps().length===0?initializeApp(cfg):getApps()[0];
    _auth=getAuth(app); _db=getFirestore(app);
    console.log('[Auth] Firebase ✅');
  } catch(e) { _initError=e.message; console.error('[Auth] init failed:',e.message); }
}

export const auth=_auth;
export const getInitError=()=>_initError;
export const isFirebaseReady=()=>!!_auth;

export const isWebView=()=>typeof navigator!=='undefined'&&/Line\/|FBAN|FBAV|MicroMessenger|Instagram|Snapchat/i.test(navigator.userAgent||'');
export const isLineBrowser=()=>typeof navigator!=='undefined'&&/Line\//i.test(navigator.userAgent||'');

const upsertUser=async(user,extra={})=>{
  if(!_db||!user)return;
  try{
    const ref=doc(_db,'users',user.uid), snap=await getDoc(ref);
    const email=user.email||'';
    const role=isOwner(email)?ROLES.SUPER_ADMIN:(extra.role||ROLES.FREE);
    if(!snap.exists()){
      await setDoc(ref,{uid:user.uid,email,displayName:user.displayName||extra.displayName||'',role,isOwner:isOwner(email),consent:false,source:extra.source||'email',createdAt:serverTimestamp(),lastLoginAt:serverTimestamp()});
    }else{
      const upd={lastLoginAt:serverTimestamp()};
      if(isOwner(email)){upd.role=ROLES.SUPER_ADMIN;upd.isOwner=true;}
      await setDoc(ref,upd,{merge:true});
    }
  }catch(e){console.warn('[Auth] upsert:',e.message);}
};

export const getUserRole=async(uid)=>{
  if(!_db)return ROLES.FREE;
  try{
    const s=await getDoc(doc(_db,'users',uid));
    if(!s.exists())return ROLES.FREE;
    const d=s.data();
    if(d.email===OWNER_EMAIL)return ROLES.SUPER_ADMIN;
    return d.role||ROLES.FREE;
  }catch{return ROLES.FREE;}
};

const req=()=>{ if(!_auth)throw new Error(_initError||'Firebase Auth 未初始化。請確認 Vercel 中已設定所有 VITE_FIREBASE_* 環境變數，並重新部署。'); };

export const registerEmail=async(email,pw,displayName)=>{ req(); const c=await createUserWithEmailAndPassword(_auth,email,pw); await updateProfile(c.user,{displayName}); await upsertUser(c.user,{displayName,source:'email'}); return c.user; };
export const loginEmail=async(email,pw)=>{ req(); const c=await signInWithEmailAndPassword(_auth,email,pw); await upsertUser(c.user); return c.user; };
export const loginGoogle=async()=>{
  req();
  const p=new GoogleAuthProvider(); p.addScope('email'); p.addScope('profile');
  if(isWebView()){await signInWithRedirect(_auth,p);return null;}
  const c=await signInWithPopup(_auth,p); await upsertUser(c.user,{source:'google'}); return c.user;
};
export const handleRedirectResult=async()=>{
  if(!_auth)return null;
  try{ const r=await getRedirectResult(_auth); if(r?.user){await upsertUser(r.user,{source:'google'});return r.user;} }catch(e){console.warn('[Auth] redirect:',e.message);}
  return null;
};
export const resetPassword=(email)=>{req();return sendPasswordResetEmail(_auth,email);};
export const logout=()=>_auth?signOut(_auth):Promise.resolve();
export const onAuth=(cb)=>{ if(!_auth){setTimeout(()=>cb(null),0);return()=>{};} return onAuthStateChanged(_auth,cb); };
