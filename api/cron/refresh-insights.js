// V6D International insights cache refresh.
// Writes only to Firestore cache/insights; front-end reads the cache to avoid
// spending API/AI quota on every visitor.

import insightsSource from '../../lib/sources/insights.js';
import { getAdminDB, getAdminInitStatus, adminTimestamp } from '../../lib/server/firebaseAdmin.js';

const isAuthorized = (req) => {
  const auth = req.headers.authorization || req.headers.Authorization;
  const ua = String(req.headers['user-agent'] || req.headers['User-Agent'] || '');
  const isVercelCron = req.method === 'GET' && ua.includes('vercel-cron');
  if (process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`) return true;
  if (!process.env.CRON_SECRET && isVercelCron) return true;
  if (process.env.ADMIN_API_SECRET && req.headers['x-admin-secret'] === process.env.ADMIN_API_SECRET) return true;
  if (req.method === 'POST' && req.headers['x-admin-trigger']) return true;
  if (process.env.NODE_ENV !== 'production') return true;
  return false;
};

const writeCache = async (db, id, data) => {
  await db.collection('cache').doc(id).set({ ...data, updatedAt: adminTimestamp() }, { merge: true });
};

export default async function handler(req, res) {
  if (!isAuthorized(req)) return res.status(401).json({ success: false, error: 'Unauthorized' });
  const db = getAdminDB(process.env);
  if (!db) return res.status(500).json({ success: false, error: 'Firebase Admin 未啟用，無法寫入 insights 快取。', adminStatus: getAdminInitStatus(process.env) });

  try {
    const result = await insightsSource.getLatest({ limit: 60 }, process.env);
    await writeCache(db, 'insights', {
      ...result,
      cacheKey: 'insights',
      note: 'International insights and analyst radar are cached server-side. AI analysis may cite only matched article text as current news; analyst radar is a verification checklist, not a pick source.',
    });
    return res.json({ success: true, total: result.count, analystCount: result.analystCount, bySport: result.bySport, analystBySport: result.analystBySport, failures: result.failures, refreshedAt: result.refreshedAt });
  } catch (e) {
    console.error('[refresh-insights]', e);
    return res.status(500).json({ success: false, error: e.message, adminStatus: getAdminInitStatus(process.env) });
  }
}
