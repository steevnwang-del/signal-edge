import { useState } from 'react';
import ParameterEstimator from '../components/ParameterEstimator';

const C = { navy:'#0F3460', white:'#FFFFFF', dark:'#111827', muted:'#6B7280', border:'#D4D8DF', bg:'#ECEEF2', amber:'#D97706', win:'#059669' };

const TODAY_MATCHES = [
  { id:1, home:'巴西 🇧🇷', away:'摩洛哥 🇲🇦', sport:'世界杯', time:'今日 08:00' },
  { id:2, home:'法國 🇫🇷', away:'塞內加爾 🇸🇳', sport:'世界杯', time:'今日 12:00' },
  { id:3, home:'T1', away:'Gen.G', sport:'LOL', time:'今日 18:00' },
];

export default function LandingPage({ setPage, setRole }) {
  const [activeMatch, setActiveMatch] = useState(0);
  const match = TODAY_MATCHES[activeMatch];

  return (
    <div style={{ background:C.bg, minHeight:'100vh' }}>
      <div style={{ background:C.navy, color:C.white, padding:'48px 20px 40px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', textAlign:'center' }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, color:C.amber, marginBottom:14, textTransform:'uppercase' }}>台灣首個 AI 運動數據分析研究平台</div>
          <h1 style={{ fontSize:42, fontWeight:900, lineHeight:1.1, margin:'0 0 16px', letterSpacing:-1.5 }}>
            用數學模型<span style={{ color:C.amber }}>看穿市場定價</span>
          </h1>
          <p style={{ fontSize:15, lineHeight:1.7, color:'rgba(255,255,255,0.65)', maxWidth:520, margin:'0 auto 28px' }}>
            整合 Polymarket 預測市場、多平台賠率比對、台灣運彩官方數據。
            所有輸出為統計參數，使用者自主判斷，不提供投注建議。
          </p>
          <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={()=>{ setRole('free'); setPage('dashboard'); }} style={{ background:C.amber, color:'#111', border:'none', padding:'12px 28px', borderRadius:8, cursor:'pointer', fontSize:14, fontWeight:800 }}>免費開始使用</button>
            <button onClick={()=>setPage('calendar')} style={{ background:'transparent', border:'1.5px solid rgba(255,255,255,0.3)', color:C.white, padding:'12px 28px', borderRadius:8, cursor:'pointer', fontSize:14, fontWeight:600 }}>查看今日賽程</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'36px 20px 0' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:12, marginBottom:36 }}>
          {[
            { label:'累計分析報告', val:'247', unit:'份' },
            { label:'模型命中率', val:'68.4', unit:'%', color:C.win },
            { label:'覆蓋運動項目', val:'6', unit:'項' },
            { label:'台灣運彩比對', val:'✓', color:C.win },
          ].map(s => (
            <div key={s.label} style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:10, padding:'16px 18px', textAlign:'center' }}>
              <div style={{ fontSize:10, color:C.muted, marginBottom:6 }}>{s.label}</div>
              <div style={{ fontSize:26, fontWeight:800, color:s.color||C.dark, fontFamily:'ui-monospace,monospace' }}>{s.val}<span style={{ fontSize:14 }}>{s.unit||''}</span></div>
            </div>
          ))}
        </div>

        {/* 參數估算器 */}
        <div style={{ marginBottom:36 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:1.5, color:C.amber, marginBottom:8, textTransform:'uppercase' }}>今日精選賽事 · 即時參數分析</div>
          <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
            {TODAY_MATCHES.map((m,i) => (
              <button key={m.id} onClick={()=>setActiveMatch(i)} style={{ padding:'7px 14px', border:`1.5px solid ${activeMatch===i?C.navy:C.border}`, borderRadius:7, cursor:'pointer', background:activeMatch===i?C.navy:C.white, color:activeMatch===i?C.white:C.muted, fontSize:12, fontWeight:activeMatch===i?700:500 }}>
                {m.home.split(' ')[0]} vs {m.away.split(' ')[0]}
                <span style={{ fontSize:10, marginLeft:6, opacity:0.7 }}>{m.sport}</span>
              </button>
            ))}
          </div>
          <ParameterEstimator key={match.id} homeTeam={match.home} awayTeam={match.away} sport={match.sport==='LOL'?'esports':'soccer'}/>
        </div>

        {/* 合規聲明 */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:12, marginBottom:36 }}>
          {[
            { icon:'📊', title:'純數學模型', desc:'所有輸出基於泊松分布、貝葉斯統計等數學模型，不含主觀判斷。' },
            { icon:'🇹🇼', title:'台灣運彩合法比對', desc:'僅引用台灣合法運彩官方賠率做數學比較，不提供非法平台連結。' },
            { icon:'⚖️', title:'使用者自主決策', desc:'本站不提供投注建議，不提供跟單服務，使用者需自行評估法律責任。' },
            { icon:'🔒', title:'不設外站跳轉', desc:'不設非法博彩外站連結，不進行任何形式的推廣抽成或導流服務。' },
          ].map(c => (
            <div key={c.title} style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:10, padding:'16px 18px' }}>
              <div style={{ fontSize:20, marginBottom:8 }}>{c.icon}</div>
              <div style={{ fontSize:13, fontWeight:700, color:C.dark, marginBottom:6 }}>{c.title}</div>
              <div style={{ fontSize:12, color:C.muted, lineHeight:1.6 }}>{c.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ textAlign:'center', paddingBottom:40 }}>
          <button onClick={()=>{ setRole('free'); setPage('dashboard'); }} style={{ background:C.navy, color:C.white, border:'none', padding:'14px 40px', borderRadius:8, cursor:'pointer', fontSize:15, fontWeight:800 }}>立即免費使用完整功能</button>
          <div style={{ marginTop:10, fontSize:11, color:C.muted }}>
            ⓘ 本平台為運動數據研究工具，依中華民國法律，博彩相關活動受刑法第 268 條規範，請使用者自行評估。
          </div>
        </div>
      </div>
    </div>
  );
}
