// V6A: scheduled/admin news cache refresh.
// Fetches RSS via server, translates headlines when AI is available, then stores cache/news.

import news from '../../lib/sources/news.js';
import { getAdminDB, getAdminInitStatus, adminTimestamp } from '../../lib/server/firebaseAdmin.js';

const isAuthorized = (req) => {
  const auth = req.headers.authorization || req.headers.Authorization;
  const ua = String(req.headers['user-agent'] || req.headers['User-Agent'] || '');
  const isVercelCron = req.method === 'GET' && ua.includes('vercel-cron');
  if (process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`) return true;
  if (!process.env.CRON_SECRET && isVercelCron) return true;
  if (req.method === 'POST' && req.headers['x-admin-trigger']) return true;
  if (process.env.NODE_ENV !== 'production') return true;
  return false;
};

export default async function handler(req, res) {
  if (!isAuthorized(req)) return res.status(401).json({ success: false, error: 'Unauthorized' });
  try {
    const result = await news.getLatest({ limit: 40, translate: true }, process.env);
    const articles = result.articles || [];
    const db = getAdminDB(process.env);
    if (!db) {
      return res.status(500).json({
        success: false,
        stored: false,
        total: articles.length,
        error: `Firebase Admin 未啟用，新聞快取無法寫入。${getAdminInitStatus(process.env).lastError || '請設定 FIREBASE_SERVICE_ACCOUNT_JSON 並重新 Deploy。'}`,
        adminStatus: getAdminInitStatus(process.env),
      });
    }
    await db.collection('cache').doc('news').set({
      articles,
      sources: result.sources || [],
      total: articles.length,
      refreshedAt: adminTimestamp(),
      updatedAt: adminTimestamp(),
    }, { merge: true });
    await db.collection('jobs').doc(`refresh-news-${new Date().toISOString().slice(0,10)}`).set({
      job: 'refresh-news',
      count: articles.length,
      lastRunAt: adminTimestamp(),
      status: 'ok',
    }, { merge: true });
    res.json({ success: true, stored: true, total: articles.length, sources: result.sources || [] });
  } catch (e) {
    console.error('[refresh-news]', e.message);
    res.status(500).json({ success: false, error: e.message, adminStatus: getAdminInitStatus(process.env) });
  }
}
