/**
 * SIGNALEDGE API Gateway
 * Server-side proxy for external APIs and AI providers.
 * V6A: records daily/monthly usage counters when Firebase Admin is configured.
 */

import { getAdminDB, adminTimestamp } from '../lib/server/firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';

const SOURCES = {
  gemini:     () => import('../lib/sources/gemini.js'),
  groq:       () => import('../lib/sources/groq.js'),
  aiProvider: () => import('../lib/sources/aiProvider.js'),
  odds:       () => import('../lib/sources/odds.js'),
  football:   () => import('../lib/sources/football.js'),
  nba:        () => import('../lib/sources/nba.js'),
  mlb:        () => import('../lib/sources/mlb.js'),
  esports:    () => import('../lib/sources/esports.js'),
  news:       () => import('../lib/sources/news.js'),
  polymarket: () => import('../lib/sources/polymarket.js'),
  apisports:  () => import('../lib/sources/apisports.js'),
  predictions: () => import('../lib/sources/predictions.js'),
  insights:    () => import('../lib/sources/insights.js'),
};

const dateKey = () => new Date().toISOString().slice(0, 10);
const monthKey = () => new Date().toISOString().slice(0, 7);
const safeId = (s) => String(s || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');

async function recordUsage({ source, action, ok = true, error = null, durationMs = 0 }) {
  try {
    const db = getAdminDB(process.env);
    if (!db) return;
    const base = {
      source,
      action,
      updatedAt: adminTimestamp(),
      lastDurationMs: durationMs,
      lastStatus: ok ? 'ok' : 'error',
      ...(error ? { lastError: String(error).slice(0, 300) } : {}),
    };
    const dayId = `${dateKey()}_${safeId(source)}_${safeId(action)}`;
    const monthId = `${monthKey()}_${safeId(source)}_${safeId(action)}`;
    await Promise.all([
      db.collection('apiUsageDaily').doc(dayId).set({
        ...base,
        date: dateKey(),
        count: FieldValue.increment(1),
        errorCount: ok ? FieldValue.increment(0) : FieldValue.increment(1),
      }, { merge: true }),
      db.collection('apiUsageMonthly').doc(monthId).set({
        ...base,
        month: monthKey(),
        count: FieldValue.increment(1),
        errorCount: ok ? FieldValue.increment(0) : FieldValue.increment(1),
      }, { merge: true }),
    ]);
  } catch (e) {
    console.warn('[Gateway] usage log skipped:', e.message);
  }
}

// Simple in-memory rate limiter (resets on cold start, good enough for serverless)
const rateLimitMap = new Map();
const RATE_LIMIT = 30; // requests per minute per IP
const RATE_WINDOW = 60000; // 1 minute

const checkRateLimit = (ip) => {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, resetAt: now + RATE_WINDOW };
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + RATE_WINDOW; }
  entry.count++;
  rateLimitMap.set(ip, entry);
  return entry.count <= RATE_LIMIT;
};

const ALLOWED_ORIGIN = process.env.VITE_APP_URL || 'https://signal-edge-hews.vercel.app';

// Admin-only sources that should not be called from frontend
const ADMIN_ONLY_SOURCES = ['aiProvider', 'gemini', 'groq'];

const isAdminGatewayRequest = (req) => {
  if (process.env.CRON_SECRET && req.headers.authorization === `Bearer ${process.env.CRON_SECRET}`) return true;
  if (process.env.ADMIN_API_SECRET && req.headers['x-admin-secret'] === process.env.ADMIN_API_SECRET) return true;
  if (process.env.NODE_ENV !== 'production' && req.headers['x-admin-trigger']) return true;
  return false;
};

export default async function handler(req, res) {
  // CORS - only allow our own domain
  const origin = req.headers.origin || '';
  const isAllowedOrigin = origin.includes('signal-edge') || origin.includes('localhost') || !origin;
  res.setHeader('Access-Control-Allow-Origin', isAllowedOrigin ? origin : ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Secret');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Rate limiting
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  if (req.method === 'GET') {
    return res.json({ status: 'ok', version: '6D' });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const started = Date.now();
  const { source, action, params = {} } = req.body || {};

  if (!source || !action) {
    return res.status(400).json({ error: 'Missing source or action', example: { source: 'aiProvider', action: 'diagnose', params: {} } });
  }
  if (!SOURCES[source]) {
    return res.status(404).json({ error: `Unknown source: ${source}`, available: Object.keys(SOURCES) });
  }
  if (ADMIN_ONLY_SOURCES.includes(source) && !isAdminGatewayRequest(req)) {
    await recordUsage({ source, action, ok: false, error: 'Admin-only source blocked', durationMs: Date.now() - started });
    return res.status(403).json({
      success: false,
      source,
      action,
      error: 'This AI provider is server/admin-only. Frontend calls are blocked to protect AI quota.',
    });
  }

  try {
    const mod = await SOURCES[source]();
    const h = mod.default || mod;
    if (!h[action]) {
      await recordUsage({ source, action, ok: false, error: 'Unknown action', durationMs: Date.now() - started });
      return res.status(404).json({ error: `Unknown action: ${action} for source: ${source}`, available: Object.keys(h) });
    }
    const result = await h[action](params, process.env);
    await recordUsage({ source, action, ok: true, durationMs: Date.now() - started });
    res.json({ success: true, source, action, result, ts: Date.now() });
  } catch (err) {
    console.error(`[Gateway] ${source}.${action}:`, err.message);
    await recordUsage({ source, action, ok: false, error: err.message, durationMs: Date.now() - started });
    res.status(500).json({
      success: false, source, action,
      error: err.message,
      hint: source === 'gemini' || source === 'aiProvider'
        ? '請執行 source=aiProvider, action=diagnose 查看詳細 AI 診斷'
        : undefined,
    });
  }
}


