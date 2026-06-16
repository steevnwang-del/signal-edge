import { useState, useEffect } from 'react';
import { loginEmail, loginGoogle, registerEmail, resetPassword, isLineBrowser, isWebView } from '../services/auth';

const C={navy:'#0F3460',white:'#FFFFFF',dark:'#111827',muted:'#6B7280',border:'#D4D8DF',win:'#059669',loss:'#DC2626',bg:'#F6F7FA'};
const iS={width:'100%',padding:'11px 14px',border:`1px solid ${C.border}`,borderRadius:8,fontSize:14,color:C.dark,outline:'none',boxSizing:'border-box',background:C.white,WebkitAppearance:'none'};
const ERRS={'auth/email-already-in-use':'此 Email 已被使用','auth/user-not-found':'找不到此帳號','auth/wrong-password':'密碼錯誤','auth/invalid-email':'Email 格式不正確','auth/weak-password':'密碼至少需要 6 個字','auth/too-many-requests':'嘗試次數太多','auth/network-request-failed':'網路連線錯誤','auth/invalid-credential':'帳號或密碼錯誤'};

const LINE_CHANNEL_ID = import.meta.env.VITE_LINE_CHANNEL_ID || ''; // 在 Vercel 設定 VITE_LINE_CHANNEL_ID
const LINE_REDIRECT_URI = 'https://signal-edge-hews.vercel.app/api/auth/line-callback';

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

  // 處理 LINE 登入回調
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const lineToken=params.get('line_token');
    const lineError=params.get('line_error');

    if(lineError){
      setErr('LINE 登入失敗：'+decodeURIComponent(lineError));
      window.history.replaceState({},'',window.location.pathname);
    }

    if(lineToken){
      try{
        const data=JSON.parse(atob(lineToken));
        if(Date.now()<data.exp){
          // LINE 登入成功
          // 邀請碼處理（LINE 用戶暫用 lineUid 當識別）
          try{
            const pendingCode=localStorage.getItem('signalEdgeInviteCode');
            if(pendingCode&&data.lineUid){
              const fs=await import('../services/firestore.js');
              await fs.recordInvite?.({inviteCode:pendingCode,inviteeUid:data.lineUid,inviteeEmail:'',rules:{}});
              localStorage.removeItem('signalEdgeInviteCode');
            }
          }catch{}
          setRole('free');
          setPage('dashboard');
        }
      }catch{setErr('LINE 登入解析失敗');}
      window.history.replaceState({},'',window.location.pathname);
    }
  },[]);

  const goLine=()=>{
    if(!LINE_CHANNEL_ID){
      alert('LINE 登入尚未設定，請使用 Email 或 Google 登入');
      return;
    }
    const state=Math.random().toString(36).slice(2);
    sessionStorage.setItem('line_state',state);
    const params=new URLSearchParams({
      response_type:'code', client_id:LINE_CHANNEL_ID,
      redirect_uri:LINE_REDIRECT_URI, state,
      scope:'profile openid',
    });
    window.location.href=`https://access.line.me/oauth2/v2.1/authorize?${params}`;
  };

  const go=async()=>{
    setL(true);setErr('');setSucc('');
    try{
      if(tab==='forgot'){await resetPassword(email);setSucc('重設密碼郵件已發送');setL(false);return;}
      if(tab==='register'){
        if(pw!==pw2){setErr('兩次密碼不一致');setL(false);return;}
        if(!name.trim()){setErr('請輸入暱稱');setL(false);return;}
        await registerEmail(email,pw,name);
      }else{await loginEmail(email,pw);}
      // 處理待使用的邀請碼
      try{
        const pendingCode=localStorage.getItem('signalEdgeInviteCode');
        if(pendingCode){
          const{getAuth:gA}=await import('firebase/auth');
          const uid=gA().currentUser?.uid;
          const email2=gA().currentUser?.email;
          if(uid){
            const fs=await import('../services/firestore.js');
            const r=await fs.recordInvite?.({inviteCode:pendingCode,inviteeUid:uid,inviteeEmail:email2,rules:{}});
            if(r?.success)localStorage.removeItem('signalEdgeInviteCode');
          }
        }
      }catch(e){console.warn('[Login] invite record failed:',e.message);}
      setRole('free');setPage('dashboard');
    }catch(e){setErr(ERRS[e.code]||e.message);}
    setL(false);
  };

  const goGoogle=async()=>{
    setL(true);setErr('');
    try{
      const u=await loginGoogle();
      if(u){
        // 處理待使用的邀請碼
        try{
          const pendingCode=localStorage.getItem('signalEdgeInviteCode');
          if(pendingCode&&u.uid){
            const fs=await import('../services/firestore.js');
            const r=await fs.recordInvite?.({inviteCode:pendingCode,inviteeUid:u.uid,inviteeEmail:u.email,rules:{}});
            if(r?.success)localStorage.removeItem('signalEdgeInviteCode');
          }
        }catch(e){console.warn('[Login] google invite record failed:',e.message);}
        setRole('free');setPage('dashboard');
      }
    }catch(e){if(e.code&&ERRS[e.code]!==undefined){if(ERRS[e.code])setErr(ERRS[e.code]);}else{setErr('Google 登入失敗');}}
    setL(false);
  };

  return(
    <div style={{background:C.bg,minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{background:C.white,borderRadius:16,boxShadow:'0 20px 60px rgba(0,0,0,0.12)',width:'100%',maxWidth:420,overflow:'hidden'}}>
        <div style={{background:C.navy,padding:'28px 32px',textAlign:'center'}}>
          <div style={{fontSize:22,fontWeight:900,color:'#fff',marginBottom:4}}>SIGNALEDGE</div>
          <div style={{fontSize:12,color:'rgba(255,255,255,0.6)'}}>運動賽事數據分析平台</div>
        </div>
        <div style={{padding:'28px 32px'}}>
          {inLine&&(
            <div style={{background:'#ECFDF5',border:'1px solid #A7F3D0',borderRadius:8,padding:'12px 14px',marginBottom:16,fontSize:12,color:'#065F46'}}>
              💬 你正在 LINE 瀏覽器中，建議用外部瀏覽器開啟以使用 Google 登入
            </div>
          )}
          {tab!=='forgot'&&(
            <div style={{display:'flex',border:`1px solid ${C.border}`,borderRadius:8,overflow:'hidden',marginBottom:20}}>
              {[['login','登入'],['register','免費註冊']].map(([t,l])=>(
                <button key={t} onClick={()=>{setT(t);setErr('');}} style={{flex:1,padding:'10px',border:'none',cursor:'pointer',background:tab===t?C.navy:'transparent',color:tab===t?C.white:C.muted,fontSize:13,fontWeight:700}}>{l}</button>
              ))}
            </div>
          )}
          {tab==='forgot'&&<div style={{marginBottom:20}}><button onClick={()=>setT('login')} style={{background:'none',border:'none',color:C.muted,cursor:'pointer',fontSize:12,display:'block',marginBottom:8}}>← 返回登入</button><div style={{fontSize:16,fontWeight:700,color:C.dark}}>忘記密碼</div></div>}
          {error&&<div style={{background:'#FEF2F2',border:'1px solid #FECACA',borderRadius:7,padding:'10px 14px',color:C.loss,fontSize:13,marginBottom:14}}>⚠️ {error}</div>}
          {succ&&<div style={{background:'#ECFDF5',border:'1px solid #A7F3D0',borderRadius:7,padding:'10px 14px',color:C.win,fontSize:13,marginBottom:14}}>✅ {succ}</div>}

          {tab!=='forgot'&&(
            <div style={{display:'grid',gap:10,marginBottom:16}}>
              {/* LINE 登入（最顯眼，台灣用戶最熟悉）*/}
              <button onClick={goLine} disabled={loading} style={{width:'100%',padding:'12px',border:'none',borderRadius:8,cursor:'pointer',background:'#06C755',color:C.white,fontSize:14,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',gap:10}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
                使用 LINE 繼續
              </button>
              {/* Google 登入 */}
              <button onClick={goGoogle} disabled={loading} style={{width:'100%',padding:'11px',border:`1.5px solid ${C.border}`,borderRadius:8,cursor:'pointer',background:C.white,fontSize:14,fontWeight:700,color:C.dark,display:'flex',alignItems:'center',justifyContent:'center',gap:10}}>
                <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                使用 Google 繼續
              </button>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{flex:1,height:1,background:C.border}}/><span style={{fontSize:12,color:C.muted}}>或使用 Email</span><div style={{flex:1,height:1,background:C.border}}/>
              </div>
            </div>
          )}

          <div style={{display:'grid',gap:12}}>
            {tab==='register'&&<div><div style={{fontSize:12,color:C.muted,marginBottom:5,fontWeight:600}}>暱稱</div><input value={name} onChange={e=>setN(e.target.value)} placeholder="輸入暱稱" style={iS}/></div>}
            <div><div style={{fontSize:12,color:C.muted,marginBottom:5,fontWeight:600}}>Email</div><input type="email" value={email} onChange={e=>setE(e.target.value)} placeholder="your@email.com" style={iS} onKeyDown={e=>e.key==='Enter'&&go()}/></div>
            {tab!=='forgot'&&<div><div style={{fontSize:12,color:C.muted,marginBottom:5,fontWeight:600}}>密碼</div><input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder={tab==='register'?'至少 6 個字':'請輸入密碼'} style={iS} onKeyDown={e=>e.key==='Enter'&&go()}/></div>}
            {tab==='register'&&<div><div style={{fontSize:12,color:C.muted,marginBottom:5,fontWeight:600}}>確認密碼</div><input type="password" value={pw2} onChange={e=>setPw2(e.target.value)} placeholder="再次輸入密碼" style={iS} onKeyDown={e=>e.key==='Enter'&&go()}/></div>}
          </div>
          {tab==='login'&&<button onClick={()=>setT('forgot')} style={{background:'none',border:'none',color:C.muted,cursor:'pointer',fontSize:12,marginTop:8}}>忘記密碼？</button>}
          <button onClick={go} disabled={loading} style={{width:'100%',padding:'13px',background:loading?C.muted:C.navy,color:C.white,border:'none',borderRadius:8,cursor:'pointer',fontSize:15,fontWeight:800,marginTop:14}}>
            {loading?'請稍候...':(tab==='login'?'登入':tab==='register'?'免費註冊':'發送重設連結')}
          </button>
          {tab==='register'&&<div style={{marginTop:12,fontSize:11,color:C.muted,textAlign:'center'}}>本平台提供運動數據參考 · 不涉及投注服務 · 18歲以上才可使用</div>}
        </div>
      </div>
    </div>
  );
}

