import { collection, doc, getDoc, getDocs, setDoc, updateDoc, addDoc, query, where, orderBy, limit as fsLimit, serverTimestamp, increment } from 'firebase/firestore';
import { requireDB, isFirebaseReady, getFirebaseInitError } from './firebase.js';

const getDB = () => requireDB();
const warn = (fn, e) => console.warn(`[FS] ${fn}:`, e?.message || e);

export const firebaseStatus = () => ({ ready: isFirebaseReady(), error: getFirebaseInitError() });

export const upsertUser = async (uid, data) => {
  try { await setDoc(doc(getDB(), 'users', uid), { ...data, updatedAt: serverTimestamp() }, { merge: true }); return true; }
  catch (e) { warn('upsertUser', e); return false; }
};

export const getUser = async (uid) => {
  try { const s = await getDoc(doc(getDB(), 'users', uid)); return s.exists() ? { id: s.id, ...s.data() } : null; }
  catch (e) { warn('getUser', e); return null; }
};

export const getUsers = async ({ limitN = 100 } = {}) => {
  try { const q = query(collection(getDB(), 'users'), orderBy('createdAt', 'desc'), fsLimit(limitN)); const s = await getDocs(q); return s.docs.map(d => ({ id: d.id, ...d.data() })); }
  catch (e) { warn('getUsers', e); return []; }
};

export const updateUser = async (uid, data) => {
  try { await updateDoc(doc(getDB(), 'users', uid), { ...data, updatedAt: serverTimestamp() }); return true; }
  catch (e) { warn('updateUser', e); return false; }
};

export const getAnalyses = async ({ limitN = 20, accessLevel, sport } = {}) => {
  try {
    const clauses = [];
    if (accessLevel) clauses.push(where('accessLevel', '==', accessLevel));
    if (sport) clauses.push(where('sport', '==', sport));
    clauses.push(orderBy('createdAt', 'desc'), fsLimit(limitN));
    const s = await getDocs(query(collection(getDB(), 'analyses'), ...clauses));
    return s.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { warn('getAnalyses', e); return []; }
};

export const saveAnalysis = async (data) => {
  try {
    const { id, ...rest } = data;
    if (id && !String(id).startsWith('live-') && !String(id).startsWith('demo-')) {
      await setDoc(doc(getDB(), 'analyses', id), { ...rest, updatedAt: serverTimestamp() }, { merge: true });
      return id;
    }
    const r = await addDoc(collection(getDB(), 'analyses'), { ...rest, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return r.id;
  } catch (e) { warn('saveAnalysis', e); return null; }
};

export const updateAnalysis = async (id, data) => {
  try { await updateDoc(doc(getDB(), 'analyses', id), { ...data, updatedAt: serverTimestamp() }); return true; }
  catch (e) { warn('updateAnalysis', e); return false; }
};

export const getCachedOdds = async () => getCacheDoc('odds');
export const setCachedOdds = async (data) => setCacheDoc('odds', data);
export const getCachedNews = async () => getCacheDoc('news');
export const setCachedNews = async (data) => setCacheDoc('news', data);
export const getTodayDashboard = async () => getCacheDoc('todayDashboard');
export const setTodayDashboard = async (data) => setCacheDoc('todayDashboard', data);


export const getCacheDoc = async (id) => {
  try { const s = await getDoc(doc(getDB(), 'cache', id)); return s.exists() ? s.data() : null; }
  catch (e) { warn(`getCacheDoc:${id}`, e); return null; }
};
export const setCacheDoc = async (id, data) => {
  try { await setDoc(doc(getDB(), 'cache', id), { ...data, updatedAt: serverTimestamp() }, { merge: true }); return true; }
  catch (e) { warn(`setCacheDoc:${id}`, e); return false; }
};

export const getSettings = async () => {
  try { const s = await getDoc(doc(getDB(), 'settings', 'site')); return s.exists() ? s.data() : {}; }
  catch (e) { warn('getSettings', e); return {}; }
};
export const saveSettings = async (data) => {
  try { await setDoc(doc(getDB(), 'settings', 'site'), { ...data, updatedAt: serverTimestamp() }, { merge: true }); return true; }
  catch (e) { warn('saveSettings', e); return false; }
};

export const saveAdPlacements = async (ads = []) => saveSettings({ ads });
export const getAdPlacements = async () => (await getSettings())?.ads || [];

export const getApiUsage = async ({ period = 'day', limitN = 60 } = {}) => {
  try {
    const col = period === 'month' ? 'apiUsageMonthly' : 'apiUsageDaily';
    const q = query(collection(getDB(), col), orderBy('updatedAt', 'desc'), fsLimit(limitN));
    const s = await getDocs(q);
    return s.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { warn('getApiUsage', e); return []; }
};

export const recordClientEvent = async (name, data = {}) => {
  try {
    const id = `${new Date().toISOString().slice(0,10)}_${name}`;
    await setDoc(doc(getDB(), 'clientEventsDaily', id), {
      event: name,
      count: increment(1),
      sample: data,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return true;
  } catch (e) { warn('recordClientEvent', e); return false; }
};
