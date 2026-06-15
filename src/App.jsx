import { useState, useEffect } from 'react';
import { onAuth, getUserRole, handleRedirectResult, logout } from './services/auth';
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
import CalendarPage from './pages/CalendarPage';
import CommunityPage from './pages/CommunityPage';
import { SIGNALS } from './constants/mockData';
import { useAutoSettle } from './hooks/useAutoSettle';

const DEFAULT_SETTINGS = {
  marqueeEnabled: true,
  marqueeText: '🏆 2026世界杯分析進行中｜AI自動分析每日更新｜免費加入即可查看',
  marqueeSpeed: 'normal',
  announcementEnabled: false,
  announcementText: '',
  announcementType: 'info',
  ads: [],
  playerSearchEnabled: false,
};

const PROTECTED = ['dashboard','signal-detail','agent','community'];

export default function App() {
  const [page, setPage]           = useState('landing');
  const [role, setRole]           = useState('guest');
  const [user, setUser]           = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [siteSettings, setSiteSettings] = useState(DEFAULT_SETTINGS);
  const { signals: liveSignals, justSettled } = useAutoSettle(SIGNALS);
  const justSettledSignal = justSettled ? liveSignals.find(s=>s.id===justSettled) : null;
  const liveSelected = selectedSignal ? liveSignals.find(s=>s.id===selectedSignal.id)||selectedSignal : null;

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      try {
        // 處理 Google redirect 回來（LINE 瀏覽器用）
        const redirectUser = await handleRedirectResult();
        if (redirectUser) {
          setUser(redirectUser);
          setRole(await getUserRole(redirectUser.uid));
          setPage('dashboard');
          setAuthReady(true);
          return;
        }
        unsub = onAuth(async (fbUser) => {
          if (fbUser) {
            setUser(fbUser);
            setRole(await getUserRole(fbUser.uid));
          } else {
            setUser(null);
            setRole('guest');
          }
          setAuthReady(true);
        });
      } catch(e) {
        console.warn('[App] Auth:', e.message);
        setAuthReady(true);
      }
    })();
    return () => { try { unsub(); } catch {} };
  }, []);

  const goPage = (pg) => {
    if (PROTECTED.includes(pg) && !user) { setPage('login'); return; }
    setPage(pg);
  };

  const handleLogout = async () => {
    try { await logout(); } catch {}
    setUser(null); setRole('guest'); setPage('landing');
  };

  if (!authReady) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#ECEEF2', flexDirection:'column', gap:14 }}>
        <div style={{ width:38, height:38, border:'3px solid #D4D8DF', borderTopColor:'#0F3460', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
        <div style={{ fontSize:14, color:'#6B7280', fontWeight:600 }}>SIGNALEDGE</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", minHeight:'100vh', background:'#ECEEF2' }}>
      {page !== 'login' && (
        <MainNav page={page} role={role} user={user} setPage={goPage} setRole={setRole} onLogout={handleLogout} siteSettings={siteSettings}/>
      )}
      {page !== 'login' && <SiteMarquee settings={siteSettings}/>}

      {page === 'login'         && <LoginPage setPage={setPage} setRole={setRole}/>}
      {page === 'landing'       && <LandingPage setPage={goPage} setRole={setRole}/>}
      {page === 'dashboard'     && <Dashboard role={role} setPage={goPage} setSelectedSignal={setSelectedSignal} signals={liveSignals}/>}
      {page === 'signal-detail' && <SignalDetail signal={liveSelected} role={role} setPage={goPage}/>}
      {page === 'agent'         && <AgentPanel/>}
      {page === 'admin'         && role==='admin' && <AdminPanel signals={liveSignals} setPreviewRole={setRole} setPage={setPage} siteSettings={siteSettings} setSiteSettings={setSiteSettings}/>}
      {page === 'players'       && siteSettings.playerSearchEnabled && <PlayerSearch/>}
      {page === 'players'       && !siteSettings.playerSearchEnabled && (
        <div style={{ textAlign:'center', padding:'80px 20px', color:'#6B7280' }}>
          <div style={{ fontSize:40, marginBottom:16 }}>🔧</div>
          <div style={{ fontSize:16, fontWeight:700, color:'#111827', marginBottom:8 }}>選手搜尋即將開放</div>
          <div style={{ fontSize:13 }}>此功能正在優化中，敬請期待</div>
        </div>
      )}
      {page === 'teams'         && <TeamAnalysis/>}
      {page === 'news'          && <NewsPage/>}
      {page === 'calendar'      && <CalendarPage/>}
      {page === 'community'     && <CommunityPage/>}

      <SettlementToast signal={justSettledSignal}/>
    </div>
  );
}
