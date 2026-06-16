// V6A: scheduled/admin news cache refresh.
// Fetches RSS via server, translates headlines when AI is available, then stores cache/news.

import news from '../../lib/sources/news.js';
import { getAdminDB, adminTimestamp } from '../../lib/server/firebaseAdmin.js';

const isAuthorized = (req) => {
  if (process.env.CRON_SECRET && req.headers.authorization === `Bearer ${process.env.CRON_SECRET}`) return true;
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
      return res.status(200).json({ success: true, stored: false, total: articles.length, warning: 'FIREBASE_SERVICE_ACCOUNT_JSON not configured' });
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
    res.status(500).json({ success: false, error: e.message });
  }
}
