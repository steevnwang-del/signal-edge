import { useState } from 'react';
const C={navy:'#0F3460',white:'#FFFFFF',dark:'#111827',muted:'#6B7280',border:'#D4D8DF',amber:'#D97706'};
const roleLabel={guest:'訪客',free:'免費',vip:'VIP',agent:'推廣夥伴',admin:'管理',super_admin:'超管'};
const roleColor={guest:C.muted,free:C.muted,vip:'#D97706',agent:'#7C3AED',admin:'#059669',super_admin:'#DC2626'};

export default function MainNav({page,role,user,setPage,onLogout,siteSettings}){
  const [showProfile,setShowProfile]=useState(false);
  const isAdmin=role==='admin'||role==='super_admin';
  const isLoggedIn=role!=='guest'&&!!user;
  const avatar=user?.photoURL;
  const displayName=user?.displayName||user?.email?.split('@')[0]||'用戶';
  const initials=(displayName||'U').charAt(0).toUpperCase();

  const navItems=[
    {id:'dashboard',label:'賽事分析',icon:'📊'},
    {id:'teams',label:'隊伍',icon:'🏆'},
    {id:'calendar',label:'賽程',icon:'📅'},
    {id:'news',label:'新聞',icon:'📰'},
    ...(siteSettings?.playerSearchEnabled?[{id:'players',label:'選手',icon:'🏅'}]:[]),
  ];

  return(
    <nav style={{background:C.navy,color:C.white,position:'sticky',top:0,zIndex:100,boxShadow:'0 2px 8px rgba(0,0,0,0.2)'}}>
      <div style={{maxWidth:1200,margin:'0 auto',padding:'0 20px',display:'flex',alignItems:'center',gap:16,height:52}}>
        <button onClick={()=>setPage('landing')} style={{background:'none',border:'none',cursor:'pointer',color:C.white,fontSize:18,fontWeight:900,letterSpacing:1,padding:0,flexShrink:0}}>SIGNALEDGE</button>
        <div style={{display:'flex',gap:2,flex:1,overflowX:'auto'}}>
          {navItems.map(n=>(
            <button key={n.id} onClick={()=>setPage(n.id)} style={{background:page===n.id?'rgba(255,255,255,0.15)':'transparent',color:C.white,border:'none',cursor:'pointer',padding:'6px 10px',borderRadius:6,fontSize:12,fontWeight:page===n.id?700:400,whiteSpace:'nowrap'}}>
              {n.icon} {n.label}
            </button>
          ))}
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center',flexShrink:0,position:'relative'}}>
          {isAdmin&&<button onClick={()=>setPage('admin')} style={{background:'rgba(220,38,38,0.2)',color:'#FCA5A5',border:'1px solid rgba(220,38,38,0.3)',padding:'5px 10px',borderRadius:6,cursor:'pointer',fontSize:11,fontWeight:700}}>管理</button>}
          {isLoggedIn?(
            <div style={{position:'relative'}}>
              <button onClick={()=>setShowProfile(!showProfile)} style={{background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:8,padding:0}}>
                {avatar?(
                  <img src={avatar} alt="" style={{width:32,height:32,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.3)'}}/>
                ):(
                  <div style={{width:32,height:32,borderRadius:'50%',background:'rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:C.white,border:'2px solid rgba(255,255,255,0.3)'}}>{initials}</div>
                )}
                <div style={{textAlign:'left'}}>
                  <div style={{fontSize:11,fontWeight:700,color:C.white,lineHeight:1.2}}>{displayName}</div>
                  <div style={{fontSize:9,fontWeight:700,color:roleColor[role]||C.muted}}>{roleLabel[role]||role}</div>
                </div>
              </button>
              {showProfile&&(
                <div style={{position:'absolute',right:0,top:'calc(100% + 8px)',background:C.white,border:`1px solid ${C.border}`,borderRadius:10,boxShadow:'0 8px 24px rgba(0,0,0,0.12)',minWidth:200,zIndex:200}} onMouseLeave={()=>setShowProfile(false)}>
                  <div style={{padding:'14px 16px',borderBottom:`1px solid ${C.border}`}}>
                    <div style={{fontSize:13,fontWeight:700,color:C.dark}}>{displayName}</div>
                    <div style={{fontSize:11,color:C.muted}}>{user?.email}</div>
                    <div style={{marginTop:4,display:'inline-block',fontSize:10,fontWeight:700,color:roleColor[role],background:roleColor[role]+'18',padding:'2px 8px',borderRadius:3}}>{roleLabel[role]}</div>
                  </div>
                  <div style={{padding:'6px 0'}}>
                    <button onClick={()=>{setPage('agent');setShowProfile(false);}} style={{display:'block',width:'100%',textAlign:'left',padding:'9px 16px',border:'none',cursor:'pointer',background:'transparent',fontSize:13,color:C.dark}} onMouseEnter={e=>e.currentTarget.style.background='#F6F7FA'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>🎁 邀請好友</button>
                    {isAdmin&&<button onClick={()=>{setPage('admin');setShowProfile(false);}} style={{display:'block',width:'100%',textAlign:'left',padding:'9px 16px',border:'none',cursor:'pointer',background:'transparent',fontSize:13,color:C.dark}} onMouseEnter={e=>e.currentTarget.style.background='#F6F7FA'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>🔧 管理後台</button>}
                  </div>
                  <div style={{padding:'6px 0',borderTop:`1px solid ${C.border}`}}>
                    <button onClick={()=>{onLogout?.();setShowProfile(false);}} style={{display:'block',width:'100%',textAlign:'left',padding:'9px 16px',border:'none',cursor:'pointer',background:'transparent',fontSize:13,color:'#DC2626',fontWeight:600}} onMouseEnter={e=>e.currentTarget.style.background='#FEF2F2'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>🚪 登出</button>
                  </div>
                </div>
              )}
            </div>
          ):(
            <div style={{display:'flex',gap:6}}>
              <button onClick={()=>setPage('login')} style={{background:'transparent',color:C.white,border:'1px solid rgba(255,255,255,0.3)',padding:'6px 14px',borderRadius:6,cursor:'pointer',fontSize:12,fontWeight:600}}>登入</button>
              <button onClick={()=>setPage('login')} style={{background:'#E9B44C',color:C.navy,border:'none',padding:'6px 14px',borderRadius:6,cursor:'pointer',fontSize:12,fontWeight:800}}>免費加入</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
