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
export const getCachedInsights = async () => getCacheDoc('insights');
export const setCachedInsights = async (data) => setCacheDoc('insights', data);
export const getCachedForeignMasters = async () => getCacheDoc('foreignMasters');
export const setCachedForeignMasters = async (data) => setCacheDoc('foreignMasters', data);
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
  } catch (e) {
    if (!/permission|PERMISSION/i.test(e?.message || '')) warn('getApiUsage', e);
    return [];
  }
};

export const recordClientEvent = async (name, data = {}) => {
  try {
    const id = `${new Date().toISOString().slice(0,10)}_${name}`;
    await setDoc(doc(getDB(), 'clientEventsDaily', id), {
      event: name, count: increment(1), sample: data, updatedAt: serverTimestamp(),
    }, { merge: true });
    return true;
  } catch (e) { warn('recordClientEvent', e); return false; }
};

// ─── 邀請系統 ────────────────────────────────────────────────────────────────

// 用 uid 產生穩定邀請碼
export const generateInviteCode = (uid = '') => {
  let n = 0;
  for (const ch of uid) n = (n * 31 + ch.charCodeAt(0)) % 999999;
  return `SE-${String(n).padStart(6, '0')}`;
};

// 記錄邀請關係（被邀請者登入時呼叫）
export const recordInvite = async ({ inviteCode, inviteeUid, inviteeEmail, rules = {} }) => {
  try {
    const db = getDB();
    // 找邀請人
    const q = query(collection(db, 'users'), where('inviteCode', '==', inviteCode), fsLimit(1));
    const snap = await getDocs(q);
    if (snap.empty) return { success: false, error: '邀請碼不存在' };

    const inviterDoc = snap.docs[0];
    const inviterUid = inviterDoc.id;
    if (inviterUid === inviteeUid) return { success: false, error: '不能邀請自己' };

    // 檢查是否已被邀請過
    const inviteeSnap = await getDoc(doc(db, 'users', inviteeUid));
    if (inviteeSnap.exists() && inviteeSnap.data().invitedBy) {
      return { success: false, error: '已使用過邀請碼' };
    }

    const now = serverTimestamp();
    const inviterUnlocks = rules.inviterUnlocks || 2;
    const inviteeUnlocks = rules.inviteeUnlocks || 1;

    // 寫入邀請紀錄
    await addDoc(collection(db, 'invites'), {
      inviteCode, inviterUid, inviteeUid, inviteeEmail: inviteeEmail || '',
      inviterUnlocks, inviteeUnlocks,
      createdAt: now, status: 'active',
    });

    // 更新邀請人：累計邀請數 + 解鎖額度
    await updateDoc(doc(db, 'users', inviterUid), {
      inviteCount: increment(1),
      bonusUnlocks: increment(inviterUnlocks),
      updatedAt: now,
    });

    // 更新被邀請人：記錄邀請人 + 解鎖額度
    await updateDoc(doc(db, 'users', inviteeUid), {
      invitedBy: inviterUid,
      invitedByCode: inviteCode,
      bonusUnlocks: increment(inviteeUnlocks),
      updatedAt: now,
    });

    return {
      success: true,
      inviterUid,
      inviterUnlocks,
      inviteeUnlocks,
      inviterEmail: inviterDoc.data().email || '',
    };
  } catch (e) { warn('recordInvite', e); return { success: false, error: e.message }; }
};

// 取得某用戶的邀請列表（誰被他邀請）
export const getMyInvites = async (inviterUid, { limitN = 50 } = {}) => {
  try {
    const q = query(
      collection(getDB(), 'invites'),
      where('inviterUid', '==', inviterUid),
      orderBy('createdAt', 'desc'),
      fsLimit(limitN)
    );
    const s = await getDocs(q);
    return s.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { warn('getMyInvites', e); return []; }
};

// 取得所有邀請紀錄（Admin 用）
export const getAllInvites = async ({ limitN = 200 } = {}) => {
  try {
    const q = query(collection(getDB(), 'invites'), orderBy('createdAt', 'desc'), fsLimit(limitN));
    const s = await getDocs(q);
    return s.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { warn('getAllInvites', e); return []; }
};

// 確保用戶有 inviteCode 欄位
export const ensureInviteCode = async (uid) => {
  try {
    const code = generateInviteCode(uid);
    await setDoc(doc(getDB(), 'users', uid), { inviteCode: code }, { merge: true });
    return code;
  } catch (e) { warn('ensureInviteCode', e); return generateInviteCode(uid); }
};
