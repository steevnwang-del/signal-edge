import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const cfg = { apiKey:import.meta.env.VITE_FIREBASE_API_KEY, authDomain:import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, projectId:import.meta.env.VITE_FIREBASE_PROJECT_ID, storageBucket:import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, messagingSenderId:import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, appId:import.meta.env.VITE_FIREBASE_APP_ID };
const app = getApps().length===0 ? initializeApp(cfg) : getApps()[0];
export const auth = getAuth(app);
const db = getFirestore(app);

const upsert = async (user, extra={}) => {
  const ref = doc(db,'users',user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref,{ uid:user.uid, email:user.email, displayName:user.displayName||extra.displayName||'', role:'free', consent:false, source:extra.source||'email', createdAt:serverTimestamp(), lastLoginAt:serverTimestamp() });
  } else {
    await setDoc(ref,{ lastLoginAt:serverTimestamp() },{merge:true});
  }
};

export const registerEmail = async (email, password, displayName) => {
  const c = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(c.user,{displayName});
  await upsert(c.user,{displayName,source:'email'});
  return c.user;
};
export const loginEmail = async (email, password) => {
  const c = await signInWithEmailAndPassword(auth, email, password);
  await upsert(c.user);
  return c.user;
};
export const loginGoogle = async () => {
  const c = await signInWithPopup(auth, new GoogleAuthProvider());
  await upsert(c.user,{source:'google'});
  return c.user;
};
export const resetPassword = email => sendPasswordResetEmail(auth, email);
export const logout = () => signOut(auth);
export const getUserRole = async uid => {
  try { const s=await getDoc(doc(db,'users',uid)); return s.exists()?(s.data().role||'free'):'free'; } catch { return 'free'; }
};
export const onAuth = cb => onAuthStateChanged(auth, cb);
