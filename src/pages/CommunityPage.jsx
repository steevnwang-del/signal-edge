import { useState } from 'react';

const C = { navy:'#0F3460', white:'#FFFFFF', dark:'#111827', muted:'#6B7280', border:'#D4D8DF', borderLight:'#E9EBF0', bg:'#ECEEF2', amber:'#D97706', win:'#059669', loss:'#DC2626', panelAlt:'#F6F7FA' };

const PREDICTIONS = [
  { id:1, user:'@stevelinTW', avatar:'SL', match:'巴西 vs 摩洛哥', pick:'巴西勝', modelPick:'巴西勝', correct:null, time:'2h前', modelProb:67, confidence:80, sport:'世界杯' },
  { id:2, user:'@kevin_sports', avatar:'KS', match:'T1 vs Gen.G', pick:'Gen.G 勝', modelPick:'T1 勝', correct:false, time:'昨日', modelProb:62, confidence:65, sport:'LOL' },
  { id:3, user:'@linda_hk', avatar:'LH', match:'道奇 vs 洋基', pick:'道奇勝', modelPick:'道奇勝', correct:true, time:'2天前', modelProb:58, confidence:75, sport:'MLB' },
  { id:4, user:'@markchen88', avatar:'MC', match:'塞爾提克 vs 熱火', pick:'塞爾提克勝', modelPick:'塞爾提克勝', correct:true, time:'3天前', modelProb:61, confidence:85, sport:'NBA' },
  { id:5, user:'@jason_bet', avatar:'JB', match:'西班牙 vs 維德角', pick:'西班牙勝', modelPick:'西班牙勝', correct:true, time:'4天前', modelProb:78, confidence:90, sport:'世界杯' },
];

const LEADERBOARD = [
  { rank:1, user:'@markchen88', avatar:'MC', correct:18, total:24, rate:75, streak:6, badge:'🏆' },
  { rank:2, user:'@linda_hk', avatar:'LH', correct:15, total:22, rate:68, streak:3, badge:'🥈' },
  { rank:3, user:'@stevelinTW', avatar:'SL', correct:14, total:21, rate:67, streak:2, badge:'🥉' },
  { rank:4, user:'@jason_bet', avatar:'JB', correct:13, total:20, rate:65, streak:1, badge:'' },
  { rank:5, user:'@kevin_sports', avatar:'KS', correct:11, total:20, rate:55, streak:0, badge:'' },
];

const Avatar = ({ initials, size = 36, color = C.navy }) => (
  <div style={{ width:size, height:size, borderRadius:'50%', background:color+'22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.33, fontWeight:700, color, flexShrink:0 }}>
    {initials}
  </div>
);

export default function CommunityPage() {
  const [tab, setTab] = useState('predict');
  const [myPick, setMyPick] = useState('');
  const [myMatch, setMyMatch] = useState('');
  const [myConf, setMyConf] = useState(70);
  const [submitted, setSubmitted] = useState(false);

  const modelAccuracy = Math.round(PREDICTIONS.filter(p=>p.correct!==null).filter(p=>(p.modelPick===p.pick&&p.correct)||(p.modelPick!==p.pick&&p.correct===false)).length / PREDICTIONS.filter(p=>p.correct!==null).length * 100);
  const userAvg = Math.round(LEADERBOARD.reduce((s,u)=>s+u.rate,0)/LEADERBOARD.length);

  return (
    <div style={{ background:C.bg, minHeight:'100vh' }}>
      <div style={{ maxWidth:1000, margin:'0 auto', padding:'28px 20px' }}>
        <div style={{ marginBottom:22 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:1.5, color:C.amber, marginBottom:6, textTransform:'uppercase' }}>社群預測</div>
          <h2 style={{ fontSize:26, fontWeight:900, color:C.dark, margin:'0 0 6px' }}>用戶 vs AI 模型</h2>
          <p style={{ color:C.muted, fontSize:13, margin:0 }}>你的預測 vs 數據模型，看誰更準</p>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:22 }}>
          {[
            { label:'AI模型準確率（近30場）', val:`${modelAccuracy}%`, color:C.win, sub:'基於統計數據' },
            { label:'社群平均準確率', val:`${userAvg}%`, color:C.navy, sub:'本月' },
            { label:'已提交預測', val:PREDICTIONS.length.toString(), color:C.amber, sub:'24小時內' },
          ].map(s => (
            <div key={s.label} style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:9, padding:'14px 16px' }}>
              <div style={{ fontSize:10, color:C.muted, marginBottom:6 }}>{s.label}</div>
              <div style={{ fontSize:24, fontWeight:800, color:s.color, fontFamily:'ui-monospace,monospace' }}>{s.val}</div>
              <div style={{ fontSize:10, color:C.muted, marginTop:3 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:0, border:`1px solid ${C.border}`, borderRadius:8, overflow:'hidden', background:C.white, marginBottom:20, width:'fit-content' }}>
          {[['predict','提交預測'],['feed','最新動態'],['board','排行榜']].map(([v,l]) => (
            <button key={v} onClick={()=>setTab(v)} style={{ padding:'8px 20px', border:'none', cursor:'pointer', background:tab===v?C.navy:'transparent', color:tab===v?C.white:C.muted, fontSize:13, fontWeight:700, borderRight:`1px solid ${C.borderLight}` }}>{l}</button>
          ))}
        </div>

        {/* Submit Prediction */}
        {tab === 'predict' && (
          <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:10, padding:'20px' }}>
            {!submitted ? (
              <>
                <div style={{ fontSize:14, fontWeight:700, color:C.dark, marginBottom:16 }}>提交今日預測</div>
                <div style={{ display:'grid', gap:12 }}>
                  <div>
                    <div style={{ fontSize:11, color:C.muted, fontWeight:700, marginBottom:6 }}>選擇賽事</div>
                    <select value={myMatch} onChange={e=>setMyMatch(e.target.value)}
                      style={{ width:'100%', padding:'9px 12px', border:`1px solid ${C.border}`, borderRadius:7, fontSize:13, color:C.dark, background:C.white }}>
                      <option value="">-- 選擇賽事 --</option>
                      {PREDICTIONS.filter(p=>p.correct===null).map(p=>(
                        <option key={p.id} value={p.match}>{p.match}（模型：{p.modelPick} {p.modelProb}%）</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize:11, color:C.muted, fontWeight:700, marginBottom:6 }}>你的預測</div>
                    <input value={myPick} onChange={e=>setMyPick(e.target.value)} placeholder="例：巴西勝" style={{ width:'100%', padding:'9px 12px', border:`1px solid ${C.border}`, borderRadius:7, fontSize:13, color:C.dark, background:C.white, boxSizing:'border-box' }}/>
                  </div>
                  <div>
                    <div style={{ fontSize:11, color:C.muted, fontWeight:700, marginBottom:6 }}>信心程度：{myConf}%</div>
                    <input type="range" min="50" max="100" value={myConf} onChange={e=>setMyConf(+e.target.value)} style={{ width:'100%' }}/>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:C.muted, marginTop:4 }}>
                      <span>50% 普通</span><span>75% 較有把握</span><span>100% 非常確定</span>
                    </div>
                  </div>
                  <button onClick={()=>{ if(myMatch&&myPick) setSubmitted(true); }}
                    style={{ background:C.navy, color:C.white, border:'none', padding:'11px', borderRadius:7, cursor:'pointer', fontSize:14, fontWeight:700 }}>
                    提交預測
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign:'center', padding:'24px 0' }}>
                <div style={{ fontSize:36, marginBottom:12 }}>✅</div>
                <div style={{ fontSize:16, fontWeight:700, color:C.dark, marginBottom:6 }}>預測已提交！</div>
                <div style={{ fontSize:13, color:C.muted }}>賽事結束後系統自動結算，計入你的準確率</div>
                <button onClick={()=>setSubmitted(false)} style={{ marginTop:16, background:'transparent', border:`1px solid ${C.border}`, color:C.muted, padding:'8px 20px', borderRadius:6, cursor:'pointer', fontSize:13 }}>再提交一個</button>
              </div>
            )}
          </div>
        )}

        {/* Feed */}
        {tab === 'feed' && (
          <div style={{ display:'grid', gap:10 }}>
            {PREDICTIONS.map(p => (
              <div key={p.id} style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:9, padding:'14px 16px' }}>
                <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                  <Avatar initials={p.avatar}/>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:C.dark }}>{p.user}</span>
                      <span style={{ fontSize:11, color:C.muted }}>{p.time}</span>
                    </div>
                    <div style={{ fontSize:12, color:C.muted, marginBottom:8 }}>{p.match}</div>
                    <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                      <span style={{ fontSize:12, fontWeight:700, background:C.navy+'18', color:C.navy, padding:'3px 10px', borderRadius:4 }}>
                        用戶：{p.pick}
                      </span>
                      <span style={{ fontSize:12, color:C.muted, padding:'3px 10px', borderRadius:4, background:C.panelAlt }}>
                        模型：{p.modelPick} ({p.modelProb}%)
                      </span>
                      {p.correct !== null && (
                        <span style={{ fontSize:12, fontWeight:700, color:p.correct?C.win:C.loss }}>
                          {p.correct ? '✓ 命中' : '✗ 未中'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Leaderboard */}
        {tab === 'board' && (
          <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
            <div style={{ padding:'12px 16px', borderBottom:`1px solid ${C.borderLight}`, display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontSize:13, fontWeight:700, color:C.dark }}>本月準確率排行</span>
              <span style={{ fontSize:11, color:C.muted }}>最少預測 15 場才計入</span>
            </div>
            {LEADERBOARD.map(u => (
              <div key={u.rank} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', borderBottom:`1px solid ${C.borderLight}` }}>
                <div style={{ width:28, fontSize:16, textAlign:'center' }}>{u.badge || `#${u.rank}`}</div>
                <Avatar initials={u.avatar} color={u.rank<=3?C.amber:C.navy}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:C.dark }}>{u.user}</div>
                  <div style={{ fontSize:11, color:C.muted }}>{u.correct}/{u.total} 場命中 {u.streak>0?`· 連中 ${u.streak} 場`:''}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:20, fontWeight:800, color:u.rate>=70?C.win:u.rate>=60?C.navy:C.muted, fontFamily:'ui-monospace,monospace' }}>{u.rate}%</div>
                  <div style={{ fontSize:10, color:C.muted }}>準確率</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
