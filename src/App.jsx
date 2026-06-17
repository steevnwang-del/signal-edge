import { useState, useEffect } from 'react';
import { onAuth, getUserRole, handleRedirectResult, logout } from './services/auth';
import { getSettings } from './services/firestore';
import SiteMarquee from './components/SiteMarquee';
import SettlementToast from './components/SettlementToast';
import MainNav from './components/MainNav';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import SignalDetail from './pages/SignalDetail';
import AgentPanel from './pages/AgentPanel';
import AdminPanel from './pages/admin/AdminPanel';
import PlayerSearch from './pages/PlayerSearch';
import TeamAnalysis from './pages/TeamAnalysis';
import NewsPage from './pages/NewsPage';
import InternationalInsights from './pages/InternationalInsights';
import CalendarPage from './pages/CalendarPage';
import CommunityPage from './pages/CommunityPage';
import UpgradePage from './pages/UpgradePage';
import { SIGNALS } from './constants/mockData';
import { useAutoSettle } from './hooks/useAutoSettle';

const DEFAULT_SETTINGS = {
  marqueeEnabled: true,
  marqueeText: '🏆 2026 世界盃專題進行中｜每日模型更新｜免費加入即可查看完整分析',
  marqueeSpeed: 'normal',
  announcementEnabled: false,
  announcementText: '',
  announcementType: 'info',
  ads: [
    { id:'home_top', enabled:false, placement:'home_top', title:'世界盃專題贊助', imageUrl:'', linkUrl:'', sponsorName:'', type:'banner', priority:10 },
  ],
  adRules: { showDisplayAds:true, rewardedUnlockEnabled:true, rewardedUnlockCount:1 },
  inviteRewards: { enabled:true, inviterUnlocks:2, inviteeUnlocks:1, rewardDays:1, allGamesThreshold:3, passThreshold:10 },
  freeLimits: { guestDailyCards:3, freeDailyCards:5, registeredBonusCards:2 },
  analysisSettings: { enabledSports:['世界杯','MLB','NBA','電競'], minDataCompleteness:0.65, autoGenerateCount:12 },
  brandSettings: { showTaiwanCalculator:true, showInviteCta:true, showEngineeringCopy:false },
  playerSearchEnabled: false,
  plans: {
    monthly:   { name:'月費方案', price:299, usd:9,  period:'/ 月',    desc:'每月自動續費，隨時取消', enabled:true },
    quarterly: { name:'季費方案', price:799, usd:24, period:'/ 季',    desc:'較月費省 10%，一次付清', enabled:true },
    worldcup:  { name:'世界杯全程通', price:399, usd:12, period:'/ 全程', desc:'一次付清，全程 VIP 分析', enabled:true },
  },
};

const PROTECTED = ['dashboard','signal-detail','agent','community'];
const hasAdminAccess = (r) => r==='admin'||r==='super_admin';

const PAGE_TO_PATH = {
  landing:'/', login:'/login', dashboard:'/dashboard', teams:'/teams', calendar:'/calendar', news:'/news', insights:'/insights',
  players:'/players', agent:'/invite', upgrade:'/upgrade', admin:'/admin', community:'/community', 'signal-detail':'/analysis'
};
const PATH_TO_PAGE = {
  '/':'landing', '/login':'login', '/dashboard':'dashboard', '/teams':'teams', '/calendar':'calendar', '/news':'news', '/insights':'insights',
  '/players':'players', '/invite':'agent', '/upgrade':'upgrade', '/admin':'admin', '/community':'community', '/analysis':'signal-detail'
};
const pageFromPath = () => PATH_TO_PAGE[window.location.pathname] || 'landing';

export default function App() {
  const [page, setPage]           = useState(() => { try { return pageFromPath(); } catch { return 'landing'; } });
  const [actualRole, setActualRole] = useState('guest');
  const [previewRole, setPreviewRole] = useState(null);
  const [user, setUser]           = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [siteSettings, setSiteSettings] = useState(DEFAULT_SETTINGS);
  const { signals: liveSignals, justSettled } = useAutoSettle(SIGNALS);
  const justSettledSignal = justSettled ? liveSignals.find(s=>s.id===justSettled) : null;
  const liveSelected = selectedSignal ? liveSignals.find(s=>s.id===selectedSignal.id)||selectedSignal : null;

  const role = previewRole || actualRole;
  const isPreviewMode = !!previewRole;


  useEffect(() => {
    try {
      const m = window.location.pathname.match(/^\/invite\/([^/]+)/);
      if (m?.[1]) {
        localStorage.setItem('signalEdgeInviteCode', decodeURIComponent(m[1]));
        setPage('login');
      }
    } catch {}
  }, []);

  useEffect(() => {
    const onPop = () => {
      const next = pageFromPath();
      setPage(next);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const remote = await getSettings();
        if (remote && Object.keys(remote).length) {
          setSiteSettings(prev => ({ ...prev, ...remote, plans: { ...(prev.plans || {}), ...(remote.plans || {}) } }));
        }
      } catch (e) { console.warn('[App] load settings skipped:', e.message); }
    })();
  }, []);


  useEffect(() => {
    let unsub = () => {};
    (async () => {
      try {
        const redirectUser = await handleRedirectResult();
        if (redirectUser) {
          setUser(redirectUser);
          const r = await getUserRole(redirectUser.uid);
          setActualRole(r); setPage('dashboard'); setAuthReady(true); return;
        }
        unsub = onAuth(async (fbUser) => {
          if (fbUser) {
            setUser(fbUser);
            const r = await getUserRole(fbUser.uid);
            setActualRole(r); setPreviewRole(null);
            setPage(prev => (prev==='landing'||prev==='login') ? 'dashboard' : prev);
          } else {
            setUser(null); setActualRole('guest'); setPreviewRole(null);
          }
          setAuthReady(true);
        });
      } catch(e) { console.warn('[App]',e.message); setAuthReady(true); }
    })();
    return () => { try{unsub();}catch{} };
  }, []);

  const goPage = (pg, { replace = false } = {}) => {
    if (pg !== 'admin' && isPreviewMode) setPreviewRole(null);
    const target = (PROTECTED.includes(pg) && !user) ? 'login' : pg;
    if (target === 'admin' && !hasAdminAccess(actualRole)) return;
    setPage(target);
    try {
      const path = PAGE_TO_PATH[target] || '/';
      const current = window.location.pathname + window.location.search;
      if (current !== path) {
        const fn = replace ? 'replaceState' : 'pushState';
        window.history[fn]({ page: target }, '', path);
      }
    } catch {}
  };

  const handleLogout = async () => {
    try{await logout();}catch{}
    setUser(null); setActualRole('guest'); setPreviewRole(null); setPage('landing'); try { window.history.pushState({ page:'landing' }, '', '/'); } catch {}
  };

  const handleSetPreviewRole = (r) => {
    if (!hasAdminAccess(actualRole)) return;
    setPreviewRole(r===actualRole ? null : r);
  };

  if (!authReady) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#ECEEF2',flexDirection:'column',gap:14}}>
      <div style={{width:38,height:38,border:'3px solid #D4D8DF',borderTopColor:'#0F3460',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <div style={{fontSize:14,color:'#6B7280',fontWeight:600}}>SIGNALEDGE</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",minHeight:'100vh',background:'#ECEEF2'}}>
      {isPreviewMode && (
        <div style={{background:'#DC2626',color:'#fff',textAlign:'center',padding:'6px',fontSize:12,fontWeight:700,position:'sticky',top:0,zIndex:200}}>
          🎭 預覽模式：{role} 視角
          <button onClick={()=>{setPreviewRole(null);setPage('admin');}} style={{marginLeft:16,background:'rgba(255,255,255,0.2)',border:'1px solid rgba(255,255,255,0.4)',color:'#fff',padding:'2px 10px',borderRadius:4,cursor:'pointer',fontSize:11}}>退出預覽</button>
        </div>
      )}
      {page!=='login'&&<MainNav page={page} role={role} user={user} setPage={goPage} setRole={setActualRole} onLogout={handleLogout} siteSettings={siteSettings}/>}
      {page!=='login'&&<SiteMarquee settings={siteSettings}/>}

      {page==='login'   &&<LoginPage setPage={setPage} setRole={setActualRole}/>}
      {page==='landing' &&<LandingPage setPage={goPage} setRole={setActualRole} siteSettings={siteSettings}/>}
      {page==='dashboard'&&<Dashboard role={role} setPage={goPage} setSelectedSignal={setSelectedSignal} signals={liveSignals}/>}
      {page==='signal-detail'&&<SignalDetail signal={liveSelected} role={role} setPage={goPage}/>}
      {page==='agent'   &&<AgentPanel user={user} siteSettings={siteSettings} setPage={goPage}/>}
      {page==='upgrade' &&<UpgradePage user={user} role={role} setPage={goPage} plans={siteSettings.plans}/>}

      {page==='admin'&&hasAdminAccess(actualRole)&&(
        <AdminPanel signals={liveSignals} setPreviewRole={handleSetPreviewRole} setPage={goPage}
          siteSettings={siteSettings} setSiteSettings={setSiteSettings}/>
      )}

      {page==='players'&&siteSettings.playerSearchEnabled&&<PlayerSearch/>}
      {page==='players'&&!siteSettings.playerSearchEnabled&&(
        <div style={{textAlign:'center',padding:'80px 20px',color:'#6B7280'}}>
          <div style={{fontSize:40,marginBottom:16}}>🔧</div>
          <div style={{fontSize:16,fontWeight:700,color:'#111827',marginBottom:8}}>選手搜尋即將開放</div>
        </div>
      )}
      {page==='teams'    &&<TeamAnalysis role={role}/>}
      {page==='news'     &&<NewsPage role={role}/>}
      {page==='insights' &&<InternationalInsights role={role}/>}
      {page==='calendar' &&<CalendarPage role={role}/>}
      {page==='community'&&<CommunityPage/>}

      <SettlementToast signal={justSettledSignal}/>
    </div>
  );
}

