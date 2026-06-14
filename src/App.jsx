import { useState } from 'react';
import { useAutoSettle } from './hooks/useAutoSettle';
import { SIGNALS } from './constants/mockData';
import MainNav from './components/MainNav';
import SettlementToast from './components/SettlementToast';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import SignalDetail from './pages/SignalDetail';
import AgentPanel from './pages/AgentPanel';
import AdminPanel from './pages/admin/AdminPanel';
// New pages
import PlayerSearch from './pages/PlayerSearch';
import TeamAnalysis from './pages/TeamAnalysis';
import NewsPage from './pages/NewsPage';
import CalendarPage from './pages/CalendarPage';
import CommunityPage from './pages/CommunityPage';

export default function App() {
  const [page, setPage] = useState('landing');
  const [role, setRole] = useState('guest');
  const [selectedSignal, setSelectedSignal] = useState(null);
  const { signals: liveSignals, justSettled } = useAutoSettle(SIGNALS);

  const liveSelected = selectedSignal ? liveSignals.find(s => s.id === selectedSignal.id) || selectedSignal : null;
  const justSettledSignal = justSettled ? liveSignals.find(s => s.id === justSettled) : null;

  return (
    <div style={{ fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", minHeight:'100vh', background:'#ECEEF2' }}>
      <MainNav page={page} role={role} setPage={setPage} setRole={setRole}/>
      {page === 'landing'    && <LandingPage setPage={setPage} setRole={setRole}/>}
      {page === 'dashboard'  && <Dashboard role={role} setPage={setPage} setSelectedSignal={setSelectedSignal} signals={liveSignals}/>}
      {page === 'signal-detail' && <SignalDetail signal={liveSelected} role={role} setPage={setPage}/>}
      {page === 'agent'      && <AgentPanel/>}
      {page === 'admin'      && <AdminPanel signals={liveSignals} setPreviewRole={setRole} setPage={setPage}/>}
      {page === 'players'    && <PlayerSearch/>}
      {page === 'teams'      && <TeamAnalysis/>}
      {page === 'news'       && <NewsPage/>}
      {page === 'calendar'   && <CalendarPage/>}
      {page === 'community'  && <CommunityPage/>}
      <SettlementToast signal={justSettledSignal}/>
    </div>
  );
}
