import { useState, useEffect } from 'react';
import { loginEmail, loginGoogle, registerEmail, resetPassword, isLineBrowser, isWebView } from '../services/auth';

const C={navy:'#0F3460',white:'#FFFFFF',dark:'#111827',muted:'#6B7280',border:'#D4D8DF',win:'#059669',loss:'#DC2626',bg:'#F6F7FA'};
const iS={width:'100%',padding:'11px 14px',border:`1px solid ${C.border}`,borderRadius:8,fontSize:14,color:C.dark,outline:'none',boxSizing:'border-box',background:C.white,WebkitAppearance:'none'};
const ERRS={'auth/email-already-in-use':'此 Email 已被使用','auth/user-not-found':'找不到此帳號','auth/wrong-password':'密碼錯誤','auth/invalid-email':'Email 格式不正確','auth/weak-password':'密碼至少需要 6 個字','auth/too-many-requests':'嘗試次數太多，請稍後再試','auth/network-request-failed':'網路連線錯誤','auth/invalid-credential':'帳號或密碼錯誤','auth/popup-blocked':'彈窗被封鎖，請使用外部瀏覽器開啟','auth/popup-closed-by-user':''};

export default function LoginPage({setPage,setRole}){
  const [tab,setT]=useState('login');
  const [email,setE]=useState('');
  const [pw,setPw]=useState('');
  const [pw2,setPw2]=useState('');
  const [name,setN]=useState('');
  const [loading,setL]=useState(false);
  const [error,setErr]=useState('');
  const [succ,setSucc]=useState('');
  const [inLine]=useState(()=>isLineBrowser());
  const [inWebView]=useState(()=>isWebView());
  const [googleRedirecting,setGR]=useState(false);

  const go=async()=>{
    setL(true);setErr('');setSucc('');
    try{
      if(tab==='forgot'){await resetPassword(email);setSucc('重設密碼郵件已發送，請查收信箱');setL(false);return;}
      if(tab==='register'){
        if(pw!==pw2){setErr('兩次密碼不一致');setL(false);return;}
        if(!name.trim()){setErr('請輸入暱稱');setL(false);return;}
        await registerEmail(email,pw,name);
      }else{await loginEmail(email,pw);}
      setRole('free');setPage('dashboard');
    }catch(e){setErr(ERRS[e.code]||e.message);}
    setL(false);
  };

  const goGoogle=async()=>{
    setL(true);setErr('');
    if(inWebView||inLine){
      // WebView 用 redirect（頁面會跳轉，不會立即回來）
      setGR(true);
    }
    try{
      const u=await loginGoogle();
      if(u){setRole('free');setPage('dashboard');}
      // 如果是 WebView redirect 模式，u 會是 null，等頁面回來後由 App.jsx 的 handleRedirectResult 處理
    }catch(e){
      if(e.code&&ERRS[e.code]!==undefined){
        if(ERRS[e.code])setErr(ERRS[e.code]);
      }else{setErr('Google 登入失敗：'+e.message);}
    }
    setL(false);setGR(false);
  };

  // LINE 瀏覽器：提示用外部瀏覽器
  const openExternal=()=>{
    const url=window.location.href;
    // LINE 開啟外部瀏覽器的 URL scheme
    window.location.href=`https://line.me/R/ti/p/~${encodeURIComponent(url)}`;
  };

  return(
    <div style={{background:C.bg,minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{background:C.white,borderRadius:16,boxShadow:'0 20px 60px rgba(0,0,0,0.12)',width:'100%',maxWidth:420,overflow:'hidden'}}>
        <div style={{background:C.navy,padding:'28px 32px',textAlign:'center'}}>
          <div style={{fontSize:22,fontWeight:900,color:'#fff',marginBottom:4}}>SIGNALEDGE</div>
          <div style={{fontSize:12,color:'rgba(255,255,255,0.6)'}}>運動賽事數據分析平台</div>
        </div>
        <div style={{padding:'28px 32px'}}>
          {/* LINE 瀏覽器警告 */}
          {inLine&&(
            <div style={{background:'#ECFDF5',border:'1px solid #A7F3D0',borderRadius:8,padding:'12px 14px',marginBottom:16,fontSize:12,color:'#065F46'}}>
              💬 您正在使用 LINE 瀏覽器。
              <button onClick={openExternal} style={{marginTop:8,width:'100%',padding:'9px',background:'#059669',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontSize:12,fontWeight:700,display:'block'}}>
                點此用外部瀏覽器開啟（推薦）
              </button>
              <div style={{marginTop:6,color:'#065F46',fontSize:11}}>或繼續使用 Email 登入 👇</div>
            </div>
          )}

          {tab!=='forgot'&&(
            <div style={{display:'flex',border:`1px solid ${C.border}`,borderRadius:8,overflow:'hidden',marginBottom:24}}>
              {[['login','登入'],['register','免費註冊']].map(([t,l])=>(
                <button key={t} onClick={()=>{setT(t);setErr('');setSucc('');}} style={{flex:1,padding:'10px',border:'none',cursor:'pointer',background:tab===t?C.navy:'transparent',color:tab===t?C.white:C.muted,fontSize:13,fontWeight:700}}>{l}</button>
              ))}
            </div>
          )}

          {tab==='forgot'&&(
            <div style={{marginBottom:20}}>
              <button onClick={()=>{setT('login');setErr('');}} style={{background:'none',border:'none',color:C.muted,cursor:'pointer',fontSize:12,display:'block',marginBottom:8}}>← 返回登入</button>
              <div style={{fontSize:16,fontWeight:700,color:C.dark}}>忘記密碼</div>
            </div>
          )}

          {error&&<div style={{background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:7,padding:'10px 14px',color:C.loss,fontSize:13,marginBottom:14}}>⚠️ {error}</div>}
          {succ&&<div style={{background:'#ECFDF5',border:'1px solid #A7F3D0',borderRadius:7,padding:'10px 14px',color:C.win,fontSize:13,marginBottom:14}}>✅ {succ}</div>}

          {/* Google 登入（LINE 瀏覽器時會用 redirect）*/}
          {tab!=='forgot'&&(
            <>
              <button onClick={goGoogle} disabled={loading} style={{width:'100%',padding:'12px',border:`1.5px solid ${C.border}`,borderRadius:8,cursor:'pointer',background:C.white,fontSize:14,fontWeight:700,color:C.dark,display:'flex',alignItems:'center',justifyContent:'center',gap:10,marginBottom:16,opacity:loading?0.7:1}}>
                {googleRedirecting ? '跳轉中...' : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    使用 Google 繼續{inWebView?' (會跳轉頁面)':''}
                  </>
                )}
              </button>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                <div style={{flex:1,height:1,background:C.border}}/><span style={{fontSize:12,color:C.muted}}>或使用 Email</span><div style={{flex:1,height:1,background:C.border}}/>
              </div>
            </>
          )}

          <div style={{display:'grid',gap:12}}>
            {tab==='register'&&<div><div style={{fontSize:12,color:C.muted,marginBottom:5,fontWeight:600}}>暱稱</div><input value={name} onChange={e=>setN(e.target.value)} placeholder="輸入暱稱" style={iS}/></div>}
            <div><div style={{fontSize:12,color:C.muted,marginBottom:5,fontWeight:600}}>Email</div><input type="email" value={email} onChange={e=>setE(e.target.value)} placeholder="your@email.com" style={iS} onKeyDown={e=>e.key==='Enter'&&go()}/></div>
            {tab!=='forgot'&&<div><div style={{fontSize:12,color:C.muted,marginBottom:5,fontWeight:600}}>密碼</div><input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder={tab==='register'?'至少 6 個字':'請輸入密碼'} style={iS} onKeyDown={e=>e.key==='Enter'&&go()}/></div>}
            {tab==='register'&&<div><div style={{fontSize:12,color:C.muted,marginBottom:5,fontWeight:600}}>確認密碼</div><input type="password" value={pw2} onChange={e=>setPw2(e.target.value)} placeholder="再次輸入密碼" style={iS} onKeyDown={e=>e.key==='Enter'&&go()}/></div>}
          </div>

          {tab==='login'&&<button onClick={()=>setT('forgot')} style={{background:'none',border:'none',color:C.muted,cursor:'pointer',fontSize:12,marginTop:8}}>忘記密碼？</button>}

          <button onClick={go} disabled={loading} style={{width:'100%',padding:'13px',background:loading?C.muted:C.navy,color:C.white,border:'none',borderRadius:8,cursor:'pointer',fontSize:15,fontWeight:800,marginTop:16}}>
            {loading?'請稍候...':(tab==='login'?'登入':tab==='register'?'免費註冊':'發送重設連結')}
          </button>

          {/* LINE 登入即將開放 */}
          {tab!=='forgot'&&(
            <div style={{marginTop:16,padding:'12px',background:'#F0FFF4',border:'1px solid #BBF7D0',borderRadius:8,fontSize:12,color:'#065F46',textAlign:'center'}}>
              💬 LINE 登入開發中 · 目前先使用 Email 或 Google
            </div>
          )}

          {tab==='register'&&(
            <div style={{marginTop:12,fontSize:11,color:C.muted,textAlign:'center',lineHeight:1.6}}>
              本平台提供運動數據參考 · 不涉及任何投注服務 · 18歲以上才可使用
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
