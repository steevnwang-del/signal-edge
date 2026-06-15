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

const PROTECTED = ['dashboard', 'signal-detail', 'agent', 'community'];
const hasAdminAccess = (role) => role === 'admin' || role === 'super_admin';

export default function App() {
  const [page, setPage]         = useState('landing');
  const [actualRole, setActualRole] = useState('guest'); // 真實角色（來自 Firebase）
  const [previewRole, setPreviewRole] = useState(null);  // Admin 預覽角色（null = 不預覽）
  const [user, setUser]         = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [siteSettings, setSiteSettings] = useState(DEFAULT_SETTINGS);
  const { signals: liveSignals, justSettled } = useAutoSettle(SIGNALS);
  const justSettledSignal = justSettled ? liveSignals.find(s=>s.id===justSettled) : null;
  const liveSelected = selectedSignal ? liveSignals.find(s=>s.id===selectedSignal.id)||selectedSignal : null;

  // 實際顯示的角色：預覽優先，其次是真實角色
  const role = previewRole || actualRole;
  const isPreviewMode = !!previewRole;

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      try {
        const redirectUser = await handleRedirectResult();
        if (redirectUser) {
          setUser(redirectUser);
          const r = await getUserRole(redirectUser.uid);
          setActualRole(r);
          setPage('dashboard');
          setAuthReady(true);
          return;
        }
        unsub = onAuth(async (fbUser) => {
          if (fbUser) {
            setUser(fbUser);
            const r = await getUserRole(fbUser.uid);
            setActualRole(r);
            setPreviewRole(null); // 重新登入清除預覽
            setPage(prev => (prev === 'landing' || prev === 'login') ? 'dashboard' : prev);
          } else {
            setUser(null);
            setActualRole('guest');
            setPreviewRole(null);
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
    // 預覽模式下離開 admin 頁面 → 清除預覽
    if (pg !== 'admin' && isPreviewMode) {
      setPreviewRole(null);
    }
    if (PROTECTED.includes(pg) && !user) { setPage('login'); return; }
    if (pg === 'admin' && !hasAdminAccess(actualRole)) return; // 用真實角色判斷
    setPage(pg);
  };

  const handleLogout = async () => {
    try { await logout(); } catch {}
    setUser(null); setActualRole('guest'); setPreviewRole(null); setPage('landing');
  };

  // Admin 設定預覽角色（不影響真實角色）
  const handleSetPreviewRole = (newRole) => {
    if (!hasAdminAccess(actualRole)) return; // 只有真實 admin 能預覽
    setPreviewRole(newRole === actualRole ? null : newRole);
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
      {/* 預覽模式橫幅 */}
      {isPreviewMode && (
        <div style={{ background:'#DC2626', color:'#fff', textAlign:'center', padding:'6px', fontSize:12, fontWeight:700, position:'sticky', top:0, zIndex:200 }}>
          🎭 預覽模式：{role} 視角
          <button onClick={()=>{setPreviewRole(null);setPage('admin');}} style={{ marginLeft:16, background:'rgba(255,255,255,0.2)', border:'1px solid rgba(255,255,255,0.4)', color:'#fff', padding:'2px 10px', borderRadius:4, cursor:'pointer', fontSize:11 }}>
            退出預覽
          </button>
        </div>
      )}

      {page !== 'login' && (
        <MainNav
          page={page} role={role} user={user}
          setPage={goPage} setRole={setActualRole}
          onLogout={handleLogout} siteSettings={siteSettings}
        />
      )}
      {page !== 'login' && <SiteMarquee settings={siteSettings}/>}

      {page === 'login'     && <LoginPage setPage={setPage} setRole={setActualRole}/>}
      {page === 'landing'   && <LandingPage setPage={goPage} setRole={setActualRole}/>}
      {page === 'dashboard' && <Dashboard role={role} setPage={goPage} setSelectedSignal={setSelectedSignal} signals={liveSignals}/>}
      {page === 'signal-detail' && <SignalDetail signal={liveSelected} role={role} setPage={goPage}/>}
      {page === 'agent'     && <AgentPanel/>}

      {page === 'admin' && hasAdminAccess(actualRole) && (
        <AdminPanel
          signals={liveSignals}
          setPreviewRole={handleSetPreviewRole}   // ← 現在只設預覽，不改真實角色
          setPage={setPage}
          siteSettings={siteSettings}
          setSiteSettings={setSiteSettings}
        />
      )}

      {page === 'players' && siteSettings.playerSearchEnabled && <PlayerSearch/>}
      {page === 'players' && !siteSettings.playerSearchEnabled && (
        <div style={{ textAlign:'center', padding:'80px 20px', color:'#6B7280' }}>
          <div style={{ fontSize:40, marginBottom:16 }}>🔧</div>
          <div style={{ fontSize:16, fontWeight:700, color:'#111827', marginBottom:8 }}>選手搜尋即將開放</div>
        </div>
      )}

      {page === 'teams'     && <TeamAnalysis role={role}/>}
      {page === 'news'      && <NewsPage/>}
      {page === 'calendar'  && <CalendarPage role={role}/>}
      {page === 'community' && <CommunityPage/>}

      <SettlementToast signal={justSettledSignal}/>
    </div>
  );
}
