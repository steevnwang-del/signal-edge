/**
 * LINE OAuth Callback
 * 完整流程：LINE code → token → profile → Firebase Custom Token → 前端登入
 * 
 * Vercel 環境變數需要：
 * LINE_CHANNEL_ID=...
 * LINE_CHANNEL_SECRET=...
 * FIREBASE_SERVICE_ACCOUNT_JSON=...（Firebase Admin 建立 custom token 需要）
 */

import { getAdminAuth, getAdminDB, adminTimestamp } from '../../lib/server/firebaseAdmin.js';

export default async function handler(req, res) {
  const { code, state, error } = req.query;
  const baseUrl = process.env.VITE_APP_URL || 'https://signal-edge-hews.vercel.app';
  const redirectUri = `${baseUrl}/api/auth/line-callback`;

  if (error) {
    console.warn('[LINE] OAuth error:', error);
    return res.redirect(`${baseUrl}/login?line_error=${encodeURIComponent(error)}`);
  }
  if (!code) return res.status(400).json({ error: 'Missing code' });

  const channelId = process.env.LINE_CHANNEL_ID;
  const channelSecret = process.env.LINE_CHANNEL_SECRET;

  if (!channelId || !channelSecret) {
    return res.redirect(`${baseUrl}/login?line_error=${encodeURIComponent('LINE Channel 尚未設定，請聯繫管理員')}`);
  }

  try {
    // Step 1: Exchange code for access token
    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: channelId,
        client_secret: channelSecret,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      throw new Error(tokenData.error_description || '無法取得 LINE token');
    }

    // Step 2: Get LINE profile
    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();
    if (!profile.userId) throw new Error('無法取得 LINE 用戶資料');

    // Step 3: Create Firebase UID for LINE user
    const firebaseUid = `line_${profile.userId}`;

    // Step 4: Try to create Firebase Custom Token (if Admin is available)
    const adminAuth = getAdminAuth?.(process.env);
    const db = getAdminDB(process.env);

    let customToken = null;
    if (adminAuth) {
      try {
        customToken = await adminAuth.createCustomToken(firebaseUid, {
          provider: 'line',
          lineUid: profile.userId,
          displayName: profile.displayName,
        });
      } catch (e) {
        console.warn('[LINE] createCustomToken failed:', e.message);
      }
    }

    // Step 5: Upsert user in Firestore
    if (db) {
      try {
        const userRef = db.collection('users').doc(firebaseUid);
        const userSnap = await userRef.get();
        const now = adminTimestamp();

        if (!userSnap.exists()) {
          await userRef.set({
            uid: firebaseUid,
            email: '',
            displayName: profile.displayName || '',
            photoURL: profile.pictureUrl || '',
            role: 'free',
            source: 'line',
            lineUid: profile.userId,
            createdAt: now,
            lastLoginAt: now,
          });
        } else {
          await userRef.update({
            displayName: profile.displayName || '',
            photoURL: profile.pictureUrl || '',
            lastLoginAt: now,
          });
        }
      } catch (e) {
        console.warn('[LINE] Firestore upsert failed:', e.message);
      }
    }

    // Step 6: Return to frontend
    if (customToken) {
      // Best case: Firebase custom token → frontend uses signInWithCustomToken
      return res.redirect(`${baseUrl}/login?line_token=${encodeURIComponent(customToken)}&line_uid=${firebaseUid}&line_name=${encodeURIComponent(profile.displayName || '')}`);
    } else {
      // Fallback: simple session token (limited persistence)
      const sessionToken = Buffer.from(JSON.stringify({
        lineUid: firebaseUid,
        displayName: profile.displayName,
        photoURL: profile.pictureUrl || '',
        exp: Date.now() + 86400000, // 24 hours
      })).toString('base64');
      return res.redirect(`${baseUrl}/login?line_session=${sessionToken}`);
    }
  } catch (e) {
    console.error('[LINE] callback error:', e.message);
    return res.redirect(`${baseUrl}/login?line_error=${encodeURIComponent(e.message)}`);
  }
}
