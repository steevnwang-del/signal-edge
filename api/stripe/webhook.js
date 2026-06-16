/**
 * Stripe Webhook Handler
 * 接收 Stripe 付款成功事件 → 升級用戶 VIP
 * 
 * Vercel 環境變數需要：
 * STRIPE_SECRET_KEY=sk_live_...
 * STRIPE_WEBHOOK_SECRET=whsec_...
 * FIREBASE_SERVICE_ACCOUNT_JSON=...
 */

import { getAdminDB, adminTimestamp } from '../../lib/server/firebaseAdmin.js';

// Stripe raw body parser（webhook 需要原始 body 驗證簽名）
export const config = { api: { bodyParser: false } };

const getRawBody = (req) => new Promise((resolve, reject) => {
  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', () => resolve(Buffer.concat(chunks)));
  req.on('error', reject);
});

// 手動驗證 Stripe signature（不用 stripe npm，節省 bundle）
const verifyStripeSignature = async (rawBody, signature, secret) => {
  const parts = signature.split(',').reduce((acc, part) => {
    const [k, v] = part.split('=');
    acc[k] = v;
    return acc;
  }, {});

  const timestamp = parts['t'];
  const sigV1 = parts['v1'];
  if (!timestamp || !sigV1) throw new Error('Invalid signature format');

  // Check timestamp tolerance (5 minutes)
  if (Math.abs(Date.now() / 1000 - parseInt(timestamp)) > 300) {
    throw new Error('Webhook timestamp too old');
  }

  const payload = `${timestamp}.${rawBody.toString()}`;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(payload);

  const key = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, messageData);
  const expectedSig = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  if (expectedSig !== sigV1) throw new Error('Signature mismatch');
  return true;
};

// 方案 ID → VIP 資訊對應
const PLAN_ROLES = {
  monthly:  { role: 'vip', label: 'VIP 月費', durationDays: 31 },
  quarterly:{ role: 'vip', label: 'VIP 季費', durationDays: 92 },
  worldcup: { role: 'vip', label: '世界杯全程通', durationDays: 60 },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return res.status(500).json({ error: 'STRIPE_WEBHOOK_SECRET 未設定' });

  let rawBody, event;
  try {
    rawBody = await getRawBody(req);
    const signature = req.headers['stripe-signature'];
    if (!signature) return res.status(400).json({ error: 'Missing stripe-signature header' });
    await verifyStripeSignature(rawBody, signature, webhookSecret);
    event = JSON.parse(rawBody.toString());
  } catch (e) {
    console.error('[Stripe Webhook] Signature verify failed:', e.message);
    return res.status(400).json({ error: `Webhook signature verification failed: ${e.message}` });
  }

  console.log('[Stripe Webhook] Event:', event.type);

  // 只處理付款成功事件
  if (event.type !== 'checkout.session.completed') {
    return res.json({ received: true, handled: false, type: event.type });
  }

  const session = event.data.object;
  const { userId, planId } = session.metadata || {};

  if (!userId || !planId) {
    console.error('[Stripe Webhook] Missing metadata:', session.metadata);
    return res.status(400).json({ error: 'Missing userId or planId in session metadata' });
  }

  const planInfo = PLAN_ROLES[planId];
  if (!planInfo) {
    console.error('[Stripe Webhook] Unknown planId:', planId);
    return res.status(400).json({ error: `Unknown planId: ${planId}` });
  }

  try {
    const db = getAdminDB(process.env);
    if (!db) throw new Error('Firebase Admin 未初始化，請檢查 FIREBASE_SERVICE_ACCOUNT_JSON');

    const now = adminTimestamp();
    const expiresAt = new Date(Date.now() + planInfo.durationDays * 86400000);

    // 升級用戶 role
    await db.collection('users').doc(userId).set({
      role: planInfo.role,
      vipPlan: planId,
      vipLabel: planInfo.label,
      vipStartAt: now,
      vipExpiresAt: expiresAt,
      stripeSessionId: session.id,
      stripeCustomerEmail: session.customer_email || '',
      updatedAt: now,
    }, { merge: true });

    // 記錄付款紀錄
    await db.collection('payments').add({
      userId,
      planId,
      planLabel: planInfo.label,
      amount: session.amount_total,
      currency: session.currency,
      stripeSessionId: session.id,
      stripeCustomerEmail: session.customer_email || '',
      status: 'paid',
      createdAt: now,
    });

    console.log(`[Stripe Webhook] ✅ User ${userId} upgraded to ${planInfo.role} (${planId})`);
    return res.json({ received: true, handled: true, userId, plan: planId, role: planInfo.role });
  } catch (e) {
    console.error('[Stripe Webhook] DB update failed:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
