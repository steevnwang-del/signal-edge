export default async function handler(req, res) {
  const { code, error } = req.query;
  const baseUrl = process.env.VITE_APP_URL || 'https://signal-edge-hews.vercel.app';
  if (error) return res.redirect(`${baseUrl}/login?line_error=${error}`);
  if (!code) return res.status(400).json({ error: 'Missing code' });
  const channelId = process.env.LINE_CHANNEL_ID;
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  const redirectUri = `${baseUrl}/api/auth/line-callback`;
  try {
    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token',{
      method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams({grant_type:'authorization_code',code,redirect_uri:redirectUri,client_id:channelId,client_secret:channelSecret}),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error('無法取得 LINE token');
    const profileRes = await fetch('https://api.line.me/v2/profile',{headers:{'Authorization':`Bearer ${tokenData.access_token}`}});
    const profile = await profileRes.json();
    const sessionToken = Buffer.from(JSON.stringify({
      lineUid:`line_${profile.userId}`, displayName:profile.displayName,
      photoURL:profile.pictureUrl, exp:Date.now()+300000,
    })).toString('base64');
    return res.redirect(`${baseUrl}/login?line_token=${sessionToken}`);
  } catch(e) {
    return res.redirect(`${baseUrl}/login?line_error=${encodeURIComponent(e.message)}`);
  }
}
