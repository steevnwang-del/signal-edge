import { useState } from 'react';
import { useAutoSettle } from './hooks/useAutoSettle';
import { SIGNALS } from './constants/mockData';
import MainNav from './components/MainNav';
import SiteMarquee from './components/SiteMarquee';
import SettlementToast from './components/SettlementToast';
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

// 全站設定 - 之後從 Firestore 讀取
const SITE_SETTINGS = {
  marqueeEnabled: true,
  marqueeText: '🏆 2026世界杯分析進行中｜今日已發出3個分析報告｜本月模型命中率 68.4%｜輸入邀請碼 VIP2026 立即升級',
  marqueeSpeed: 'normal',
  announcementEnabled: true,
  announcementText: '世界杯特別活動：6月份新加入用戶首月VIP免費！',
  announcementType: 'info',
  ads: [],
};

export default function App() {
  const [page, setPage] = useState('landing');
  const [role, setRole] = useState('guest');
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [siteSettings, setSiteSettings] = useState(SITE_SETTINGS);
  const { signals: liveSignals, justSettled } = useAutoSettle(SIGNALS);
  const liveSelected = selectedSignal ? liveSignals.find(s=>s.id===selectedSignal.id)||selectedSignal : null;
  const justSettledSignal = justSettled ? liveSignals.find(s=>s.id===justSettled) : null;

  return (
    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", minHeight:'100vh', background:'#ECEEF2' }}>
      {/* 導覽列 */}
      <MainNav page={page} role={role} setPage={setPage} setRole={setRole}/>
      
      {/* 跑馬燈 + 公告 + 廣告 - 所有用戶都看得到 */}
      <SiteMarquee settings={siteSettings}/>

      {/* 頁面內容 */}
      {page==='landing'       && <LandingPage setPage={setPage} setRole={setRole}/>}
      {page==='dashboard'     && <Dashboard role={role} setPage={setPage} setSelectedSignal={setSelectedSignal} signals={liveSignals}/>}
      {page==='signal-detail' && <SignalDetail signal={liveSelected} role={role} setPage={setPage}/>}
      {page==='agent'         && <AgentPanel/>}
      {page==='admin'         && <AdminPanel signals={liveSignals} setPreviewRole={setRole} setPage={setPage} siteSettings={siteSettings} setSiteSettings={setSiteSettings}/>}
      {page==='players'       && <PlayerSearch/>}
      {page==='teams'         && <TeamAnalysis/>}
      {page==='news'          && <NewsPage/>}
      {page==='calendar'      && <CalendarPage/>}
      {page==='community'     && <CommunityPage/>}

      <SettlementToast signal={justSettledSignal}/>
    </div>
  );
}
