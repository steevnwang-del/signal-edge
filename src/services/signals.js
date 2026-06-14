// ── Signals CRUD ───────────────────────────────────────────────────────────────
// 串接 Firebase 後，這裡的函數會取代 mockData.js 中的靜態數據
// 目前是佔位符，MVP 階段用 mockData.js

import { db } from './firebase';
import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';

export const getSignals = async () => {
  // TODO: const snapshot = await getDocs(collection(db, 'signals'));
  // return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  console.log('Firebase signals: not yet connected, using mock data');
  return [];
};

export const createSignal = async (signal) => {
  // TODO: return await addDoc(collection(db, 'signals'), signal);
};

export const settleSignal = async (id, result) => {
  // TODO: await updateDoc(doc(db, 'signals', id), { status: result.status, result: result.result });
};
