import { useState } from 'react';

const C={navy:'#0F3460',white:'#FFFFFF',dark:'#111827',muted:'#6B7280',border:'#D4D8DF',bg:'#ECEEF2',amber:'#D97706',win:'#059669',loss:'#DC2626'};

const PLANS=[
  {id:'monthly',label:'月費方案',price:299,usd:9,period:'/ 月',desc:'每月自動續費，隨時取消',badge:'',color:C.navy},
  {id:'quarterly',label:'季費方案',price:799,usd:24,period:'/ 季（3個月）',desc:'較月費省 10%，一次付清',badge:'最受歡迎',color:'#7C3AED'},
  {id:'worldcup',label:'世界杯全程通',price:399,usd:12,period:'/ 世界杯全程',desc:'一次付清，全程 VIP 分析',badge:'限時',color:C.win},
];

const CRYPTO_ADDRS={
  'USDT (TRC20)': { addr:'填入你的USDT錢包地址', icon:'💵', note:'手續費最低，推薦' },
  'ETH': { addr:'填入你的ETH錢包地址', icon:'⬡', note:'以太坊主網' },
  'BTC': { addr:'填入你的BTC錢包地址', icon:'₿', note:'比特幣' },
};

export default function UpgradePage({user,role,setPage}){
  const [plan,setPlan]=useState('monthly');
  const [payMethod,setPayMethod]=useState('stripe');
  const [cryptoCoin,setCryptoCoin]=useState('USDT (TRC20)');
  const [loading,setLoading]=useState(false);
  const [copied,setCopied]=useState('');

  const selectedPlan=PLANS.find(p=>p.id===plan)||PLANS[0];

  const handleStripe=async()=>{
    if(!user){setPage('login');return;}
    setLoading(true);
    try{
      const r=await fetch('/api/stripe/checkout',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({planId:plan,userId:user.uid,email:user.email}),
      });
      const d=await r.json();
      if(d.url)window.location.href=d.url;
      else alert('❌ 建立付款失敗：'+d.error);
    }catch(e){alert('❌ 錯誤：'+e.message);}
    setLoading(false);
  };

  const copyAddr=async(addr,coin)=>{
    try{await navigator.clipboard.writeText(addr);setCopied(coin);setTimeout(()=>setCopied(''),2000);}
    catch{alert(addr);}
  };

  if(role==='vip'||role==='admin'||role==='super_admin'){
    return(
      <div style={{background:C.bg,minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{background:C.white,borderRadius:16,padding:'40px',textAlign:'center',maxWidth:400}}>
          <div style={{fontSize:48,marginBottom:16}}>⭐</div>
          <div style={{fontSize:22,fontWeight:900,color:C.dark,marginBottom:8}}>你已經是 VIP 會員</div>
          <div style={{fontSize:14,color:C.muted,marginBottom:24}}>享有所有進階功能，感謝支持！</div>
          <button onClick={()=>setPage('dashboard')} style={{background:C.navy,color:C.white,border:'none',padding:'12px 28px',borderRadius:8,cursor:'pointer',fontSize:14,fontWeight:700}}>回到賽事分析</button>
        </div>
      </div>
    );
  }

  return(
    <div style={{background:C.bg,minHeight:'100vh',padding:'40px 20px'}}>
      <div style={{maxWidth:760,margin:'0 auto'}}>
        {/* Header */}
        <div style={{textAlign:'center',marginBottom:36}}>
          <div style={{fontSize:12,fontWeight:700,color:C.amber,letterSpacing:2,marginBottom:8,textTransform:'uppercase'}}>升級 VIP</div>
          <h1 style={{fontSize:32,fontWeight:900,color:C.dark,margin:'0 0 10px'}}>解鎖完整分析能力</h1>
          <p style={{color:C.muted,fontSize:15,margin:0}}>EV 分析 · 最低可參考賠率 · 決策條件 · 盤口移動追蹤</p>
        </div>

        {/* 方案選擇 */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12,marginBottom:32}}>
          {PLANS.map(p=>(
            <div key={p.id} onClick={()=>setPlan(p.id)} style={{background:plan===p.id?C.navy:C.white,border:`2px solid ${plan===p.id?C.navy:C.border}`,borderRadius:12,padding:'20px 16px',cursor:'pointer',textAlign:'center',position:'relative',transition:'all 0.2s'}}>
              {p.badge&&<div style={{position:'absolute',top:-8,left:'50%',transform:'translateX(-50%)',background:p.color,color:C.white,fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:20,whiteSpace:'nowrap'}}>{p.badge}</div>}
              <div style={{fontSize:13,fontWeight:700,color:plan===p.id?'rgba(255,255,255,0.7)':C.muted,marginBottom:6}}>{p.label}</div>
              <div style={{fontSize:28,fontWeight:900,color:plan===p.id?C.white:C.dark}}>NT${p.price}</div>
              <div style={{fontSize:11,color:plan===p.id?'rgba(255,255,255,0.6)':C.muted,marginBottom:6}}>{p.period}</div>
              <div style={{fontSize:11,color:plan===p.id?'rgba(255,255,255,0.5)':C.muted}}>{p.desc}</div>
            </div>
          ))}
        </div>

        {/* VIP 功能列表 */}
        <div style={{background:C.white,borderRadius:12,padding:'20px 24px',marginBottom:28}}>
          <div style={{fontSize:13,fontWeight:700,color:C.dark,marginBottom:12}}>VIP 解鎖內容</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            {['✅ 完整 EV 分析','✅ 最低可參考賠率','✅ 決策條件（BET/LEAN/WAIT）','✅ 去水市場概率','✅ 盤口移動追蹤','✅ 所有運動完整報告','✅ AI 深度分析報告','✅ 優先通知推播'].map(f=>(
              <div key={f} style={{fontSize:12,color:C.dark}}>{f}</div>
            ))}
          </div>
        </div>

        {/* 付款方式選擇 */}
        <div style={{background:C.white,borderRadius:12,overflow:'hidden',marginBottom:20}}>
          <div style={{display:'flex',borderBottom:`1px solid ${C.border}`}}>
            {[['stripe','💳 信用卡'],['crypto','₿ 加密貨幣'],['atm','🏦 ATM轉帳']].map(([m,l])=>(
              <button key={m} onClick={()=>setPayMethod(m)} style={{flex:1,padding:'14px',border:'none',cursor:'pointer',background:payMethod===m?C.navy:'transparent',color:payMethod===m?C.white:C.muted,fontSize:13,fontWeight:700,borderRight:`1px solid ${C.border}`}}>
                {l}
              </button>
            ))}
          </div>

          <div style={{padding:'24px'}}>
            {/* Stripe */}
            {payMethod==='stripe'&&(
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:13,color:C.muted,marginBottom:20}}>
                  安全加密結帳 · 支援 Visa / Mastercard / Apple Pay / Google Pay<br/>
                  台灣信用卡可直接使用，全程 Stripe 加密保護
                </div>
                <div style={{fontSize:28,fontWeight:900,color:C.dark,marginBottom:6}}>NT${selectedPlan.price}</div>
                <div style={{fontSize:12,color:C.muted,marginBottom:24}}>{selectedPlan.period}</div>
                <button onClick={handleStripe} disabled={loading} style={{background:loading?C.muted:'#635BFF',color:C.white,border:'none',padding:'14px 40px',borderRadius:8,cursor:'pointer',fontSize:15,fontWeight:800,width:'100%',maxWidth:300}}>
                  {loading?'跳轉中...':'前往 Stripe 付款 →'}
                </button>
                <div style={{marginTop:12,fontSize:11,color:C.muted}}>🔒 由 Stripe 安全處理，SignalEdge 不儲存你的卡號</div>
              </div>
            )}

            {/* 加密貨幣 */}
            {payMethod==='crypto'&&(
              <div>
                <div style={{fontSize:13,color:C.muted,marginBottom:16,textAlign:'center'}}>
                  付款金額：約 <strong>US${selectedPlan.usd}</strong>（依當時匯率換算）<br/>
                  付款後請截圖傳至 Line/Email 確認升級
                </div>
                {/* 幣種選擇 */}
                <div style={{display:'flex',gap:8,marginBottom:20,justifyContent:'center'}}>
                  {Object.keys(CRYPTO_ADDRS).map(coin=>(
                    <button key={coin} onClick={()=>setCryptoCoin(coin)} style={{padding:'8px 14px',border:`2px solid ${cryptoCoin===coin?C.navy:C.border}`,borderRadius:8,cursor:'pointer',background:cryptoCoin===coin?C.navy:C.white,color:cryptoCoin===coin?C.white:C.dark,fontSize:12,fontWeight:700}}>
                      {CRYPTO_ADDRS[coin].icon} {coin}
                    </button>
                  ))}
                </div>
                {/* 錢包地址 */}
                <div style={{background:'#F6F7FA',borderRadius:8,padding:'16px',marginBottom:16}}>
                  <div style={{fontSize:11,color:C.muted,marginBottom:6}}>轉帳地址（{cryptoCoin}）</div>
                  <div style={{fontSize:13,fontFamily:'ui-monospace,monospace',color:C.dark,wordBreak:'break-all',marginBottom:10}}>
                    {CRYPTO_ADDRS[cryptoCoin].addr}
                  </div>
                  <button onClick={()=>copyAddr(CRYPTO_ADDRS[cryptoCoin].addr,cryptoCoin)}
                    style={{background:copied===cryptoCoin?C.win:C.navy,color:C.white,border:'none',padding:'8px 20px',borderRadius:6,cursor:'pointer',fontSize:12,fontWeight:700}}>
                    {copied===cryptoCoin?'✅ 已複製':'複製地址'}
                  </button>
                </div>
                <div style={{background:'#FEF3C7',borderRadius:8,padding:'12px',fontSize:12,color:'#92400E'}}>
                  ⚠️ 請確認發送正確幣種到對應地址，轉帳錯誤無法退款<br/>
                  💬 付款後請截圖傳至 LINE：<strong>@signaledge</strong> 或 Email：<strong>support@signaledge.com</strong>
                </div>
              </div>
            )}

            {/* ATM 轉帳 */}
            {payMethod==='atm'&&(
              <div>
                <div style={{fontSize:13,color:C.muted,marginBottom:20,textAlign:'center'}}>
                  轉帳後截圖傳送給我們，通常 1-3 小時內完成升級
                </div>
                <div style={{background:'#F6F7FA',borderRadius:8,padding:'20px',marginBottom:16}}>
                  <div style={{display:'grid',gridTemplateColumns:'auto 1fr',gap:'8px 16px',fontSize:13}}>
                    {[['銀行','台灣銀行（004）'],['帳號','填入你的帳號'],['戶名','填入你的姓名'],['金額',`NT$${selectedPlan.price}`]].map(([k,v])=>(
                      <>
                        <div key={k} style={{color:C.muted,fontWeight:600}}>{k}：</div>
                        <div key={v} style={{color:C.dark,fontWeight:700,fontFamily:k==='帳號'?'ui-monospace,monospace':'inherit'}}>{v}</div>
                      </>
                    ))}
                  </div>
                </div>
                <div style={{background:'#EFF6FF',borderRadius:8,padding:'12px',fontSize:12,color:C.navy}}>
                  📋 轉帳完成後，請截圖傳至：<br/>
                  💬 LINE：<strong>@signaledge</strong><br/>
                  📧 Email：<strong>support@signaledge.com</strong><br/>
                  請附上你的 Email 帳號以便查詢
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{textAlign:'center',fontSize:11,color:C.muted}}>
          SignalEdge 提供運動數據參考 · 不涉及投注服務 · 訂閱可隨時取消
        </div>
      </div>
    </div>
  );
}
