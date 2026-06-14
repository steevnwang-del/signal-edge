import { useState } from 'react';
import RadarChart from './RadarChart';

const C = { navy:'#0F3460', white:'#FFFFFF', dark:'#111827', muted:'#6B7280', border:'#D4D8DF', borderLight:'#E9EBF0', win:'#059669', amber:'#D97706', loss:'#DC2626', bg:'#F6F7FA' };

const StatItem = ({ label, value, rank, total, color }) => (
  <div style={{ marginBottom:6 }}>
    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
      <span style={{ fontSize:10, color:C.muted, fontWeight:600 }}>{label}</span>
      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
        <span style={{ fontSize:9, color:C.muted }}>{value}</span>
        {rank && <span style={{ fontSize:10, fontWeight:700, color, fontFamily:'ui-monospace,monospace' }}>#{rank}/{total}</span>}
      </div>
    </div>
    {rank && total && (
      <div style={{ height:4, background:C.borderLight, borderRadius:2, overflow:'hidden' }}>
        <div style={{ width:`${Math.round((1-rank/total)*100)}%`, height:'100%', background:color, borderRadius:2 }}/>
      </div>
    )}
  </div>
);

export default function TeamCard({ team, sportColor = '#0F3460' }) {
  const [tab, setTab] = useState('stats');

  return (
    <div style={{ background:C.white, border:`1px solid ${C.border}`, borderTop:`3px solid ${sportColor}`, borderRadius:10, padding:'16px 14px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div>
          <div style={{ fontSize:16, fontWeight:900, color:C.dark }}>{team.flag} {team.name}</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{team.league || team.region}</div>
        </div>
        {team.rank && (
          <div style={{ textAlign:'center', background:team.rank<=4?C.amber+'22':C.bg, border:`1px solid ${team.rank<=4?C.amber:C.border}`, borderRadius:8, padding:'6px 12px' }}>
            <div style={{ fontSize:8, color:C.muted, fontWeight:700 }}>排名</div>
            <div style={{ fontSize:22, fontWeight:900, color:team.rank<=4?C.amber:C.dark, fontFamily:'ui-monospace,monospace' }}>#{team.rank}</div>
          </div>
        )}
      </div>

      <div style={{ display:'flex', gap:0, border:`1px solid ${C.border}`, borderRadius:6, overflow:'hidden', marginBottom:12 }}>
        {[['stats','統計'],['roster','陣容'],['form','近況']].map(([v,l]) => (
          <button key={v} onClick={()=>setTab(v)} style={{ flex:1, padding:'6px 0', border:'none', cursor:'pointer', background:tab===v?sportColor:'transparent', color:tab===v?C.white:C.muted, fontSize:11, fontWeight:700 }}>{l}</button>
        ))}
      </div>

      {tab === 'stats' && team.stats?.length > 0 && (
        <>
          <div style={{ display:'flex', justifyContent:'center', margin:'0 0 10px' }}>
            <RadarChart stats={team.stats} color={sportColor} size={80}/>
          </div>
          {team.stats.map(s => <StatItem key={s.label} label={s.label} value={s.value} rank={s.rank} total={s.total} color={sportColor}/>)}
        </>
      )}

      {tab === 'roster' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
          {team.roster?.map((p,i) => (
            <div key={i} style={{ fontSize:12, color:C.dark, padding:'5px 8px', background:C.bg, borderRadius:5, fontWeight:i<2?700:400 }}>
              {i<2?'⭐':''} {p}
            </div>
          ))}
        </div>
      )}

      {tab === 'form' && (
        <div>
          <div style={{ display:'flex', gap:6, justifyContent:'center', marginBottom:12 }}>
            {team.form?.map((r,i) => (
              <div key={i} style={{ width:32, height:32, borderRadius:'50%', background:r==='W'?C.win:r==='L'?C.loss:C.amber, display:'flex', alignItems:'center', justifyContent:'center', color:C.white, fontSize:12, fontWeight:800 }}>{r}</div>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, textAlign:'center' }}>
            {[
              { label:'勝', val:team.form?.filter(f=>f==='W').length||0, color:C.win },
              { label:'平', val:team.form?.filter(f=>f==='D').length||0, color:C.amber },
              { label:'負', val:team.form?.filter(f=>f==='L').length||0, color:C.loss },
            ].map(s => (
              <div key={s.label} style={{ background:C.bg, borderRadius:6, padding:'8px 0' }}>
                <div style={{ fontSize:20, fontWeight:900, color:s.color }}>{s.val}</div>
                <div style={{ fontSize:10, color:C.muted }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 靜態分析（admin 預先生成，用戶唯讀） */}
      {team.analysis && (
        <div style={{ marginTop:12, background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:6, padding:'10px 12px' }}>
          <div style={{ fontSize:9, fontWeight:700, color:C.navy, letterSpacing:0.5, marginBottom:5 }}>📊 戰術分析</div>
          <p style={{ fontSize:12, color:C.dark, lineHeight:1.7, margin:0 }}>{team.analysis}</p>
        </div>
      )}
    </div>
  );
}
