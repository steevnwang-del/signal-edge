import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, addDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);

// ── 分析報告 (analyses) ────────────────────────────────────────────────────
export const getAnalyses = async ({ status, sport, limitN = 20 } = {}) => {
  let q = collection(db, 'analyses');
  const constraints = [orderBy('createdAt', 'desc'), limit(limitN)];
  if (status) constraints.unshift(where('status', '==', status));
  if (sport)  constraints.unshift(where('sport',  '==', sport));
  const snap = await getDocs(query(q, ...constraints));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const createAnalysis = async (data) => {
  const ref = await addDoc(collection(db, 'analyses'), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
};

export const updateAnalysis = async (id, data) => {
  await updateDoc(doc(db, 'analyses', id), { ...data, updatedAt: serverTimestamp() });
};

export const settleAnalysis = async (id, { result, status }) => {
  await updateDoc(doc(db, 'analyses', id), { result, status, settledAt: serverTimestamp(), updatedAt: serverTimestamp() });
};

// ── 用戶 (users) ───────────────────────────────────────────────────────────
export const getUsers = async ({ role, limitN = 100 } = {}) => {
  let q = collection(db, 'users');
  const constraints = [orderBy('createdAt', 'desc'), limit(limitN)];
  if (role) constraints.unshift(where('role', '==', role));
  const snap = await getDocs(query(q, ...constraints));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const updateUserRole = async (uid, role) => {
  await updateDoc(doc(db, 'users', uid), { role, updatedAt: serverTimestamp() });
};

// ── 代理 (agents) ──────────────────────────────────────────────────────────
export const getAgents = async () => {
  const snap = await getDocs(collection(db, 'agents'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getAgentCommissions = async (agentId) => {
  const snap = await getDocs(query(collection(db, 'commissions'), where('agentId','==',agentId), orderBy('createdAt','desc'), limit(50)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ── 設定 (settings) ────────────────────────────────────────────────────────
export const getSettings = async (docId = 'site') => {
  const snap = await getDoc(doc(db, 'settings', docId));
  return snap.exists() ? snap.data() : null;
};

export const saveSettings = async (docId, data) => {
  await setDoc(doc(db, 'settings', docId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
};

// ── 即時監聽 ────────────────────────────────────────────────────────────────
export const subscribeToAnalyses = (callback) => {
  const q = query(collection(db, 'analyses'), orderBy('createdAt', 'desc'), limit(20));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};
