/**
 * Firebase Admin helper for Vercel serverless functions.
 *
 * Accepted env formats:
 * 1) FIREBASE_SERVICE_ACCOUNT_JSON = one-line JSON
 * 2) FIREBASE_SERVICE_ACCOUNT_JSON = base64 encoded JSON
 * 3) FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY + FIREBASE_PROJECT_ID
 *
 * Do not commit service account JSON to GitHub. Put it only in Vercel env.
 */
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

let lastAdminError = null;

const normalizePrivateKey = (key = '') => String(key)
  .replace(/^['"]|['"]$/g, '')
  .replace(/\\n/g, '\n')
  .replace(/\r\n/g, '\n');

const cleanEnvValue = (value = '') => String(value).trim().replace(/^['"]|['"]$/g, '').trim();

const parseJsonOrBase64 = (rawValue) => {
  const raw = cleanEnvValue(rawValue);
  if (!raw) return null;

  const candidates = [raw];
  try { candidates.push(Buffer.from(raw, 'base64').toString('utf8')); } catch {}

  for (const candidate of candidates) {
    const text = String(candidate || '').trim();
    if (!text) continue;
    try {
      return JSON.parse(text);
    } catch {}
  }

  throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON 不是有效 JSON 或 base64 JSON');
};

const parseServiceAccount = (env = process.env) => {
  if (env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const sa = parseJsonOrBase64(env.FIREBASE_SERVICE_ACCOUNT_JSON);
    if (sa?.private_key) sa.private_key = normalizePrivateKey(sa.private_key);
    return sa;
  }

  if (env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    return {
      project_id: env.FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID,
      client_email: cleanEnvValue(env.FIREBASE_CLIENT_EMAIL),
      private_key: normalizePrivateKey(env.FIREBASE_PRIVATE_KEY),
    };
  }

  return null;
};

const validateServiceAccount = (sa, env = process.env) => {
  if (!sa) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON 未設定');
  if (!sa.project_id && !(env.FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID)) throw new Error('Firebase Admin 缺少 project_id');
  if (!sa.client_email) throw new Error('Firebase Admin 缺少 client_email');
  if (!sa.private_key) throw new Error('Firebase Admin 缺少 private_key');
  if (!String(sa.private_key).includes('BEGIN PRIVATE KEY')) throw new Error('Firebase Admin private_key 格式不正確');
};

export const getAdminInitStatus = (env = process.env) => {
  const hasJson = !!env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const hasSplit = !!(env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY);
  return {
    configured: hasJson || hasSplit,
    hasJson,
    hasSplit,
    projectId: env.FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID || null,
    lastError: lastAdminError ? String(lastAdminError.message || lastAdminError) : null,
  };
};

export const getAdminApp = (env = process.env) => {
  try {
    const existing = getApps()[0];
    if (existing) return existing;
    const sa = parseServiceAccount(env);
    validateServiceAccount(sa, env);
    const projectId = sa.project_id || env.FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID;
    const app = initializeApp({ credential: cert(sa), projectId });
    lastAdminError = null;
    return app;
  } catch (e) {
    lastAdminError = e;
    console.error('[FirebaseAdmin] init failed:', e.message);
    return null;
  }
};

export const getAdminDB = (env = process.env) => {
  const app = getAdminApp(env);
  return app ? getFirestore(app) : null;
};

export const requireAdminDB = (env = process.env) => {
  const db = getAdminDB(env);
  if (!db) {
    const status = getAdminInitStatus(env);
    throw new Error(`Firebase Admin 未啟用：${status.lastError || '請在 Vercel Production 設定 FIREBASE_SERVICE_ACCOUNT_JSON 並重新部署'}`);
  }
  return db;
};

export const adminTimestamp = () => FieldValue.serverTimestamp();
export { FieldValue };

// Firebase Admin Auth - used by LINE callback to create custom tokens
export const getAdminAuth = (env = process.env) => {
  try {
    const app = getAdminApp(env);
    if (!app) return null;
    const { getAuth } = require('firebase-admin/auth');
    return getAuth(app);
  } catch (e) {
    console.warn('[FirebaseAdmin] getAdminAuth failed:', e.message);
    return null;
  }
};

