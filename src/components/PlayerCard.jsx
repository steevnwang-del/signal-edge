import { useState } from 'react';
import RadarChart from './RadarChart';
import AIBox from './AIBox';
import { buildPlayerPrompt } from '../services/aiAnalysis';

const C = { navy:'#0F3460', white:'#FFFFFF', dark:'#111827', muted:'#6B7280', border:'#D4D8DF', borderLight:'#E9EBF0', win:'#059669', amber:'#D97706', bg:'#F6F7FA' };

const OVRBadge = ({ ovr }) => {
  const color = ovr >= 96 ? '#D97706' : ovr >= 90 ? '#0F3460' : '#059669';
  return (
    <div style={{ width:52, height:52, borderRadius:'50%', background:color, color:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      <div style={{ fontSize:7, fontWeight:700, opacity:0.8 }}>OVR</div>
      <div style={{ fontSize:20, fontWeight:900, lineHeight:1, fontFamily:'ui-monospace,monospace' }}>{ovr}</div>
    </div>
  );
};

const PercentileBar = ({ label, value, raw, color }) => (
  <div style={{ marginBottom:6 }}>
    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
      <span style={{ fontSize:10, color:C.muted, fontWeight:600 }}>{label}</span>
      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
        <span style={{ fontSize:9, color:C.muted }}>{raw}</span>
        <span style={{ fontSize:10, fontWeight:800, color, fontFamily:'ui-monospace,monospace' }}>前 {100-value}%</span>
      </div>
    </div>
    <div style={{ height:4, background:C.borderLight, borderRadius:2, overflow:'hidden', position:'relative' }}>
      <div style={{ width:'50%', height:'100%', borderRight:'1.5px dashed #9CA3AF', position:'absolute', top:0 }}/>
      <div style={{ width:`${value}%`, height:'100%', background:color, borderRadius:2 }}/>
    </div>
  </div>
);

export default function PlayerCard({ player, sport, sportColor = '#0F3460' }) {
  const [showAI, setShowAI] = useState(false);
  const aiPrompt = player.stats ? buildPlayerPrompt(
    { name: player.name, team: player.team, position: player.pos || player.role, sport },
    Object.fromEntries((player.stats || []).map(s => [s.label, `${s.raw || s.value} (百分位:${s.value}%)`]))
  ) : '';

  return (
    <div style={{ background:C.white, border:`1px solid ${C.border}`, borderTop:`3px solid ${sportColor}`, borderRadius:10, padding:'16px 14px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div>
          <div style={{ fontSize:15, fontWeight:800, color:C.dark }}>{player.name}</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{player.team}</div>
          <span style={{ fontSize:10, fontWeight:700, background:sportColor+'18', color:sportColor, padding:'2px 7px', borderRadius:3, display:'inline-block', marginTop:5 }}>
            {player.pos || player.role}
          </span>
        </div>
        <OVRBadge ovr={player.ovr}/>
      </div>

      {player.stats?.length > 0 && (
        <>
          <div style={{ display:'flex', justifyContent:'center', margin:'0 0 10px' }}>
            <RadarChart stats={player.stats} color={sportColor} size={80}/>
          </div>
          <div style={{ marginBottom:10 }}>
            {player.stats.map(s => <PercentileBar key={s.label} label={s.label} value={s.value} raw={s.raw || ''} color={sportColor}/>)}
          </div>
        </>
      )}

      {player.recent && (
        <div style={{ background:C.bg, borderRadius:6, padding:'8px 10px', marginBottom:10 }}>
          <div style={{ fontSize:9, fontWeight:700, color:C.muted, letterSpacing:0.5, marginBottom:5 }}>近期數據</div>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            {Object.entries(player.recent).map(([k,v]) => (
              <div key={k}>
                <div style={{ fontSize:9, color:'#9CA3AF' }}>{k}</div>
                <div style={{ fontSize:13, fontWeight:800, color:C.dark, fontFamily:'ui-monospace,monospace' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {player.form && (
        <div style={{ display:'flex', gap:4, alignItems:'center', marginBottom:10 }}>
          <span style={{ fontSize:10, color:C.muted }}>近況</span>
          {player.form.map((r,i) => <div key={i} style={{ width:10, height:10, borderRadius:'50%', background:r==='W'?C.win:r==='L'?'#DC2626':C.amber }}/>)}
        </div>
      )}

      {aiPrompt && (
        <button onClick={() => setShowAI(!showAI)} style={{ width:'100%', background:'transparent', border:`1px solid ${C.border}`, borderRadius:6, padding:'7px', cursor:'pointer', fontSize:12, color:C.navy, fontWeight:600, marginBottom: showAI?10:0 }}>
          {showAI ? '▲ 收合 AI 分析' : '▼ 展開 AI 分析'}
        </button>
      )}
      {showAI && aiPrompt && <AIBox prompt={aiPrompt} type="player" title="選手 AI 分析"/>}
    </div>
  );
}
