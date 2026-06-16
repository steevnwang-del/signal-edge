/**
 * Firebase Admin helper for Vercel serverless functions.
 * Preferred env:
 *   FIREBASE_SERVICE_ACCOUNT_JSON={...full service account json...}
 * Alternative:
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY
 *   VITE_FIREBASE_PROJECT_ID / FIREBASE_PROJECT_ID
 */
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const normalizePrivateKey = (key = '') => key.replace(/\\n/g, '\n');

const parseServiceAccount = (env = process.env) => {
  if (env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const raw = env.FIREBASE_SERVICE_ACCOUNT_JSON.trim();
    try {
      const json = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
      const sa = JSON.parse(json);
      if (sa.private_key) sa.private_key = normalizePrivateKey(sa.private_key);
      return sa;
    } catch (e) {
      throw new Error(`FIREBASE_SERVICE_ACCOUNT_JSON 格式錯誤：${e.message}`);
    }
  }

  if (env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    return {
      project_id: env.FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID,
      client_email: env.FIREBASE_CLIENT_EMAIL,
      private_key: normalizePrivateKey(env.FIREBASE_PRIVATE_KEY),
    };
  }

  return null;
};

export const getAdminApp = (env = process.env) => {
  const existing = getApps()[0];
  if (existing) return existing;
  const sa = parseServiceAccount(env);
  if (!sa) return null;
  return initializeApp({ credential: cert(sa), projectId: sa.project_id || env.FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID });
};

export const getAdminDB = (env = process.env) => {
  const app = getAdminApp(env);
  return app ? getFirestore(app) : null;
};

export const adminTimestamp = () => FieldValue.serverTimestamp();
