// ── App.jsx ────────────────────────────────────────────────────────────────────
// 路由總控：管理頁面切換和角色狀態
// 串接 Firebase 後，role 會從 Firebase Auth 的 user.claims 讀取

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

export default function App() {
  const [page, setPage] = useState('landing');
  const [role, setRole] = useState('guest');
  const [selectedSignal, setSelectedSignal] = useState(null);
  const { signals: liveSignals, justSettled } = useAutoSettle(SIGNALS);

  const liveSelected = selectedSignal
    ? liveSignals.find(s => s.id === selectedSignal.id) || selectedSignal
    : null;

  const justSettledSignal = justSettled
    ? liveSignals.find(s => s.id === justSettled)
    : null;

  const navigate = (p) => setPage(p);

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", minHeight: '100vh' }}>
      <MainNav page={page} role={role} setPage={navigate} setRole={setRole} />
      {page === 'landing' && <LandingPage setPage={navigate} setRole={setRole} />}
      {page === 'dashboard' && <Dashboard role={role} setPage={navigate} setSelectedSignal={setSelectedSignal} signals={liveSignals} />}
      {page === 'signal-detail' && <SignalDetail signal={liveSelected} role={role} setPage={navigate} />}
      {page === 'agent' && <AgentPanel />}
      {page === 'admin' && <AdminPanel signals={liveSignals} setPreviewRole={setRole} setPage={navigate} />}
      <SettlementToast signal={justSettledSignal} />
    </div>
  );
}
