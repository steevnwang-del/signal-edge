export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { planId, userId, email } = req.body || {};
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return res.status(500).json({ error: 'Stripe 未設定，請在 Vercel 加入 STRIPE_SECRET_KEY' });
  const PLANS = {
    monthly:  { name:'SignalEdge VIP 月費', amount:29900, currency:'twd', mode:'subscription', interval:'month' },
    quarterly:{ name:'SignalEdge VIP 季費', amount:79900, currency:'twd', mode:'payment' },
    worldcup: { name:'SignalEdge 世界杯全程通', amount:39900, currency:'twd', mode:'payment' },
  };
  const plan = PLANS[planId];
  if (!plan) return res.status(400).json({ error: '無效方案' });
  const baseUrl = process.env.VITE_APP_URL || 'https://signal-edge-hews.vercel.app';
  const body = {
    payment_method_types:['card'], customer_email:email,
    metadata:{ userId, planId },
    success_url:`${baseUrl}/?upgrade=success&plan=${planId}`,
    cancel_url:`${baseUrl}/?upgrade=cancel`,
  };
  if (plan.mode === 'subscription') {
    body.mode = 'subscription';
    body.line_items = [{ price_data:{ currency:plan.currency, product_data:{name:plan.name}, unit_amount:plan.amount, recurring:{interval:plan.interval} }, quantity:1 }];
  } else {
    body.mode = 'payment';
    body.line_items = [{ price_data:{ currency:plan.currency, product_data:{name:plan.name}, unit_amount:plan.amount }, quantity:1 }];
  }
  const flatten=(obj,pfx='')=>Object.keys(obj).reduce((acc,k)=>{
    const fk=pfx?`${pfx}[${k}]`:k;
    if(typeof obj[k]==='object'&&!Array.isArray(obj[k])&&obj[k]!==null)Object.assign(acc,flatten(obj[k],fk));
    else if(Array.isArray(obj[k]))obj[k].forEach((v,i)=>typeof v==='object'?Object.assign(acc,flatten(v,`${fk}[${i}]`)):acc[`${fk}[${i}]`]=v);
    else if(obj[k]!=null)acc[fk]=obj[k];
    return acc;
  },{});
  try {
    const r = await fetch('https://api.stripe.com/v1/checkout/sessions',{
      method:'POST', headers:{'Authorization':`Bearer ${stripeKey}`,'Content-Type':'application/x-www-form-urlencoded'},
      body: new URLSearchParams(flatten(body)).toString(),
    });
    const s = await r.json();
    if(s.error) return res.status(400).json({error:s.error.message});
    res.json({url:s.url});
  } catch(e) { res.status(500).json({error:e.message}); }
}
