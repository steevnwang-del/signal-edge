import { useState, useEffect } from 'react';
import { onAuth, getUserRole, logout } from './services/auth';
import MainNav from './components/MainNav';
import SiteMarquee from './components/SiteMarquee';
import SettlementToast from './components/SettlementToast';
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

const SITE_SETTINGS = {
  marqueeEnabled: true,
  marqueeText: '🏆 2026世界杯分析進行中｜AI自動分析每日更新｜免費加入即可查看預測',
  marqueeSpeed: 'normal',
  announcementEnabled: false,
  announcementText: '',
  announcementType: 'info',
  ads: [],
  playerSearchEnabled: false, // 選手搜尋預設關閉
};

// 需要登入才能看的頁面
const PROTECTED_PAGES = ['dashboard','signal-detail','agent','community'];
const VIP_PAGES = ['dashboard']; // VIP 功能在這些頁面裡

export default function App() {
  const [page, setPage]         = useState('landing');
  const [role, setRole]         = useState('guest');
  const [user, setUser]         = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [siteSettings, setSiteSettings] = useState(SITE_SETTINGS);
  const { signals: liveSignals, justSettled } = useAutoSettle(SIGNALS);
  const justSettledSignal = justSettled ? liveSignals.find(s=>s.id===justSettled) : null;

  // Firebase Auth 狀態監聽
  useEffect(() => {
    const unsub = onAuth(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userRole = await getUserRole(firebaseUser.uid);
        setRole(userRole);
        // 登入後自動跳轉到 dashboard
        if (page === 'landing' || page === 'login') {
          setPage('dashboard');
        }
      } else {
        setUser(null);
        setRole('guest');
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // 頁面保護：未登入不能看受保護頁面
  const safePage = (pg) => {
    if (PROTECTED_PAGES.includes(pg) && !user) {
      setPage('login');
      return;
    }
    setPage(pg);
  };

  const handleLogout = async () => {
    await logout();
    setRole('guest');
    setUser(null);
    setPage('landing');
  };

  if (authLoading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#ECEEF2' }}>
        <div style={{ width:36, height:36, border:'3px solid #D4D8DF', borderTopColor:'#0F3460', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const liveSelected = selectedSignal ? liveSignals.find(s=>s.id===selectedSignal.id)||selectedSignal : null;

  return (
    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", minHeight:'100vh', background:'#ECEEF2' }}>
      {page !== 'login' && (
        <MainNav page={page} role={role} user={user} setPage={safePage} setRole={setRole} onLogout={handleLogout} siteSettings={siteSettings}/>
      )}
      {page !== 'login' && <SiteMarquee settings={siteSettings}/>}

      {page === 'login'         && <LoginPage setPage={setPage} setRole={setRole}/>}
      {page === 'landing'       && <LandingPage setPage={safePage} setRole={setRole}/>}
      {page === 'dashboard'     && <Dashboard role={role} setPage={safePage} setSelectedSignal={setSelectedSignal} signals={liveSignals}/>}
      {page === 'signal-detail' && <SignalDetail signal={liveSelected} role={role} setPage={safePage}/>}
      {page === 'agent'         && <AgentPanel/>}
      {page === 'admin'         && role === 'admin' && <AdminPanel signals={liveSignals} setPreviewRole={setRole} setPage={setPage} siteSettings={siteSettings} setSiteSettings={setSiteSettings}/>}
      {page === 'players'       && siteSettings.playerSearchEnabled && <PlayerSearch/>}
      {page === 'players'       && !siteSettings.playerSearchEnabled && (
        <div style={{ textAlign:'center', padding:60, color:'#6B7280', fontSize:16 }}>
          🔧 選手搜尋功能即將開放
          <div style={{ fontSize:13, marginTop:8 }}>此功能正在優化中，敬請期待</div>
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
