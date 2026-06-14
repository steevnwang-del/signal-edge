import { useState } from 'react';
import AIBox from '../components/AIBox';
import { buildMatchPrompt } from '../services/aiAnalysis';

const C = { navy:'#0F3460', white:'#FFFFFF', dark:'#111827', muted:'#6B7280', border:'#D4D8DF', borderLight:'#E9EBF0', bg:'#ECEEF2', amber:'#D97706', win:'#059669', loss:'#DC2626', panelAlt:'#F6F7FA' };
const SPORT_C = { 世界杯:'#1B5E20', NBA:'#C9082A', MLB:'#002D72', LOL:'#C89B3C', Valorant:'#FF4655' };

const EVENTS = [
  { id:1, sport:'世界杯', home:{ name:'巴西 🇧🇷', form:['W','W','D','W','W'] }, away:{ name:'摩洛哥 🇲🇦', form:['W','L','W','W','D'] }, time:'今日 08:00', stage:'C組 第一場', status:'pending', modelHome:67, odds:{ home:1.62, away:4.80, draw:3.90 } },
  { id:2, sport:'世界杯', home:{ name:'法國 🇫🇷', form:['W','W','L','W','D'] }, away:{ name:'塞內加爾 🇸🇳', form:['W','W','L','W','W'] }, time:'今日 12:00', stage:'I組 第一場', status:'pending', modelHome:58, odds:{ home:1.45, away:6.20, draw:4.10 } },
  { id:3, sport:'LOL', home:{ name:'T1', form:['W','W','W','W','W'] }, away:{ name:'Gen.G', form:['W','W','L','W','W'] }, time:'今日 18:00', stage:'LCK 春季賽決賽', status:'pending', modelHome:62, odds:{ home:1.72, away:2.10 } },
  { id:4, sport:'MLB', home:{ name:'洛杉磯道奇', form:['W','W','W','W','L'] }, away:{ name:'紐約洋基', form:['L','W','W','L','W'] }, time:'今日 09:05', stage:'常規賽', status:'pending', modelHome:58, odds:{ home:1.72, away:2.15 } },
  { id:5, sport:'世界杯', home:{ name:'西班牙 🇪🇸', form:['W','W','W','W','W'] }, away:{ name:'烏拉圭 🇺🇾', form:['W','D','W','W','L'] }, time:'明日 02:00', stage:'H組 第一場', status:'upcoming', modelHome:71, odds:{ home:1.40, away:7.50, draw:4.50 } },
  { id:6, sport:'NBA', home:{ name:'塞爾提克', form:['W','W','L','W','W'] }, away:{ name:'印第安那溜馬', form:['W','W','W','L','W'] }, time:'明日 06:30', stage:'東區決賽 G1', status:'upcoming', modelHome:64, odds:{ home:1.65, away:2.30 } },
];

const StatusDot = ({ status }) => (
  <span style={{ width:8, height:8, borderRadius:'50%', background:status==='live'?'#DC2626':status==='pending'?C.amber:'#9CA3AF', display:'inline-block', marginRight:5, animation:status==='live'?'pulse 1.5s infinite':'' }}>
    <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
  </span>
);

export default function CalendarPage() {
  const [filter, setFilter] = useState('全部');
  const [selected, setSelected] = useState(null);

  const filtered = EVENTS.filter(e => filter === '全部' || e.sport === filter);
  const sports = ['全部','世界杯','NBA','MLB','LOL','Valorant'];

  return (
    <div style={{ background:C.bg, minHeight:'100vh' }}>
      <div style={{ maxWidth:1000, margin:'0 auto', padding:'28px 20px' }}>
        <div style={{ marginBottom:22 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:1.5, color:C.amber, marginBottom:6, textTransform:'uppercase' }}>賽事行事曆</div>
          <h2 style={{ fontSize:26, fontWeight:900, color:C.dark, margin:'0 0 6px' }}>今明兩日賽程</h2>
          <p style={{ color:C.muted, fontSize:13, margin:0 }}>點擊賽事查看 AI 賽前分析報告</p>
        </div>

        <div style={{ display:'flex', border:`1px solid ${C.border}`, borderRadius:8, overflow:'hidden', background:C.white, marginBottom:20, width:'fit-content' }}>
          {sports.map(s => (
            <button key={s} onClick={()=>setFilter(s)} style={{ padding:'7px 16px', border:'none', cursor:'pointer', background:filter===s?C.navy:'transparent', color:filter===s?C.white:C.muted, fontSize:12, fontWeight:700, borderRight:`1px solid ${C.borderLight}` }}>{s}</button>
          ))}
        </div>

        <div style={{ display:'grid', gap:10 }}>
          {filtered.map(ev => {
            const sc = SPORT_C[ev.sport] || C.navy;
            const isSelected = selected === ev.id;
            const matchPrompt = buildMatchPrompt(ev.home, ev.away, ev.odds);
            return (
              <div key={ev.id} style={{ background:C.white, border:`1px solid ${isSelected?sc:C.border}`, borderLeft:`4px solid ${sc}`, borderRadius:'0 9px 9px 0', overflow:'hidden' }}>
                <div onClick={()=>setSelected(isSelected?null:ev.id)} style={{ padding:'14px 18px', cursor:'pointer' }}
                  onMouseEnter={e=>e.currentTarget.style.background=C.panelAlt}
                  onMouseLeave={e=>e.currentTarget.style.background=C.white}>
                  <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:10, flexWrap:'wrap' }}>
                    <span style={{ background:sc+'18', color:sc, fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:3 }}>{ev.sport}</span>
                    <StatusDot status={ev.status}/>
                    <span style={{ fontSize:11, fontWeight:700, color:C.amber }}>{ev.time}</span>
                    <span style={{ fontSize:11, color:C.muted }}>{ev.stage}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:15, fontWeight:700, color:C.dark }}>{ev.home.name} <span style={{ color:C.muted, fontWeight:400 }}>vs</span> {ev.away.name}</div>
                      <div style={{ display:'flex', gap:4, marginTop:6 }}>
                        {ev.home.form.map((r,i)=><div key={i} style={{ width:10, height:10, borderRadius:'50%', background:r==='W'?C.win:r==='L'?C.loss:C.amber }}/>)}
                      </div>
                    </div>
                    <div style={{ textAlign:'center', minWidth:120 }}>
                      <div style={{ fontSize:10, color:C.muted, marginBottom:4 }}>模型預測</div>
                      <div style={{ display:'flex', gap:6, alignItems:'center', justifyContent:'center' }}>
                        <span style={{ fontSize:18, fontWeight:800, color:C.win, fontFamily:'ui-monospace,monospace' }}>{ev.modelHome}%</span>
                        <span style={{ fontSize:11, color:C.muted }}>|</span>
                        <span style={{ fontSize:18, fontWeight:800, color:C.loss, fontFamily:'ui-monospace,monospace' }}>{100-ev.modelHome}%</span>
                      </div>
                      <div style={{ height:5, background:C.loss+'44', borderRadius:3, overflow:'hidden', marginTop:5 }}>
                        <div style={{ width:`${ev.modelHome}%`, height:'100%', background:C.win }}/>
                      </div>
                    </div>
                    <div style={{ textAlign:'right', minWidth:100 }}>
                      <div style={{ fontSize:10, color:C.muted, marginBottom:4 }}>賠率參考</div>
                      <div style={{ fontSize:12, fontWeight:700, color:C.dark, fontFamily:'ui-monospace,monospace' }}>
                        {ev.odds.home} / {ev.odds.away}
                      </div>
                    </div>
                    <div style={{ color:isSelected?sc:C.muted, fontSize:12 }}>{isSelected?'▲':'▼'}</div>
                  </div>
                </div>
                {isSelected && (
                  <div style={{ padding:'0 18px 16px', borderTop:`1px solid ${C.borderLight}` }}>
                    <div style={{ marginTop:14 }}>
                      <AIBox prompt={matchPrompt} type="match" title="AI 賽前分析報告"/>
                    </div>
                    <div style={{ marginTop:10, fontSize:11, color:C.muted }}>
                      ⓘ 以上分析基於統計模型，僅供研究參考，不構成任何投注建議
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
