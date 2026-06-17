// V6F Foreign Masters auto refresh.
// Server-side cache only: public RSS / metadata, short excerpts, links and SignalEdge summaries.

import foreignMastersSource from '../../lib/sources/foreignMasters.js';
import { getAdminDB, getAdminInitStatus, adminTimestamp } from '../../lib/server/firebaseAdmin.js';

const isAuthorized = (req) => {
  if (process.env.CRON_SECRET && req.headers.authorization === `Bearer ${process.env.CRON_SECRET}`) return true;
  if (process.env.ADMIN_API_SECRET && req.headers['x-admin-secret'] === process.env.ADMIN_API_SECRET) return true;
  if (req.method === 'POST' && req.headers['x-admin-trigger']) return true;
  if (process.env.NODE_ENV !== 'production') return true;
  return false;
};

const writeCache = async (db, id, data) => {
  await db.collection('cache').doc(id).set({ ...data, updatedAt: adminTimestamp() }, { merge: true });
};

const readCache = async (db, id) => {
  const snap = await db.collection('cache').doc(id).get();
  return snap.exists ? snap.data() : null;
};

export default async function handler(req, res) {
  if (!isAuthorized(req)) return res.status(401).json({ success: false, error: 'Unauthorized' });
  const db = getAdminDB(process.env);
  if (!db) return res.status(500).json({ success: false, error: 'Firebase Admin 未啟用，無法寫入 foreignMasters 快取。', adminStatus: getAdminInitStatus(process.env) });

  try {
    const existing = await readCache(db, 'foreignMasters').catch(() => null);
    const manualItems = existing?.manualItems || existing?.manualPosts || [];
    const result = await foreignMastersSource.getLatest({ limit: 100 }, process.env);
    await writeCache(db, 'foreignMasters', {
      ...result,
      manualItems,
      manualCount: manualItems.length,
      cacheKey: 'foreignMasters',
      note: 'Foreign Masters cache stores source directory, public RSS posts and optional manual short excerpts. It does not store full articles or paywalled content.',
    });
    return res.json({
      success: true,
      total: result.count,
      sourceCount: result.sourceCount,
      ingestibleCount: result.ingestibleCount,
      manualCount: manualItems.length,
      bySport: result.bySport,
      directoryBySport: result.directoryBySport,
      failures: result.failures?.length || 0,
      refreshedAt: result.refreshedAt,
    });
  } catch (e) {
    console.error('[refresh-foreign-masters]', e);
    return res.status(500).json({ success: false, error: e.message, adminStatus: getAdminInitStatus(process.env) });
  }
}
