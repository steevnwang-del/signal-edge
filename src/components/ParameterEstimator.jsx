import { useState, useMemo } from 'react';
import { predictScores } from '../utils/scorePrediction';
import { calcNoVig, calcEV, calcEdge, calcMinOdds, calcStake, getDecision, DECISIONS, calcOverround } from '../utils/evCalculator';

const C = {
  navy:'#0F3460', white:'#FFFFFF', dark:'#111827',
  muted:'#6B7280', border:'#D4D8DF', borderLight:'#E9EBF0',
  win:'#059669', loss:'#DC2626', amber:'#D97706',
  bg:'#F6F7FA', panelAlt:'#EFF6FF',
};

const Slider = ({ label, value, onChange, color = C.navy, hint }) => (
  <div style={{ marginBottom:14 }}>
    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
      <span style={{ fontSize:11, color:C.muted, fontWeight:600 }}>{label}</span>
      <span style={{ fontSize:17, fontWeight:900, color, fontFamily:'ui-monospace,monospace' }}>{value}</span>
    </div>
    <input type="range" min={0} max={100} value={value} onChange={e=>onChange(+e.target.value)}
      style={{ width:'100%', accentColor:color, cursor:'pointer' }}/>
    {hint && <div style={{ fontSize:9, color:C.muted, marginTop:2 }}>{hint}</div>}
  </div>
);

const DecisionBadge = ({ decision, size = 'md' }) => {
  const d = DECISIONS[decision] || DECISIONS.NO_BET;
  const pad = size === 'lg' ? '8px 20px' : '4px 12px';
  const fs = size === 'lg' ? 16 : 12;
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:d.bg, border:`1.5px solid ${d.border}`, borderRadius:6, padding:pad }}>
      <span style={{ fontSize:fs, fontWeight:900, color:d.color }}>{d.label}</span>
      <span style={{ fontSize:fs-3, color:d.color, opacity:0.8 }}>{d.zh}</span>
    </div>
  );
};

const EVMeter = ({ ev, edge }) => {
  const color = ev > 5 ? C.win : ev > 0 ? C.amber : C.loss;
  return (
    <div style={{ textAlign:'center' }}>
      <div style={{ fontSize:28, fontWeight:900, color, fontFamily:'ui-monospace,monospace', letterSpacing:-1 }}>
        {ev > 0 ? '+' : ''}{ev}%
      </div>
      <div style={{ fontSize:10, color:C.muted }}>期望值 EV</div>
      <div style={{ fontSize:12, fontWeight:700, color, marginTop:2 }}>Edge {edge > 0 ? '+' : ''}{edge}%</div>
    </div>
  );
};

export default function ParameterEstimator({ homeTeam='主隊', awayTeam='客隊', sport='soccer' }) {
  const [homeAtk, setHomeAtk] = useState(72);
  const [homeDef, setHomeDef] = useState(68);
  const [awayAtk, setAwayAtk] = useState(65);
  const [awayDef, setAwayDef] = useState(71);
  const [ouLine, setOuLine] = useState(2.5);
  const [homeField, setHomeField] = useState(true);

  // 台灣運彩賠率輸入
  const [twHome, setTwHome] = useState('');
  const [twDraw, setTwDraw] = useState('');
  const [twAway, setTwAway] = useState('');
  const [twOver, setTwOver] = useState('');
  const [twUnder, setTwUnder] = useState('');

  // 期望進球數
  const homeLambda = useMemo(() => {
    const base = (homeAtk/100)*2.2*(homeField?1.12:0.90);
    return Math.max(0.3, Math.round(base*(1-(awayDef-50)/200)*10)/10);
  }, [homeAtk, awayDef, homeField]);

  const awayLambda = useMemo(() => {
    const base = (awayAtk/100)*2.2*(homeField?0.88:1.05);
    return Math.max(0.3, Math.round(base*(1-(homeDef-50)/200)*10)/10);
  }, [awayAtk, homeDef, homeField]);

  const result = useMemo(() => predictScores(homeLambda, awayLambda), [homeLambda, awayLambda]);

  // 大小分
  const overProb = useMemo(() => {
    let p = 0;
    for (let h=0;h<=6;h++) for (let a=0;a<=6;a++) {
      if (h+a > ouLine) {
        const ph = Math.exp(-homeLambda)*Math.pow(homeLambda,h)/factorial(h);
        const pa = Math.exp(-awayLambda)*Math.pow(awayLambda,a)/factorial(a);
        p += ph*pa;
      }
    }
    return Math.round(p*1000)/10;
  }, [homeLambda, awayLambda, ouLine]);

  // 模型概率
  const modelHome = result.homeWin;
  const modelDraw = result.draw;
  const modelAway = result.awayWin;

  // 公平賠率
  const fairHomeOdds = modelHome > 0 ? +(100/modelHome).toFixed(2) : null;
  const fairAwayOdds = modelAway > 0 ? +(100/modelAway).toFixed(2) : null;
  const fairOverOdds = overProb > 0 ? +(100/overProb).toFixed(2) : null;
  const fairUnderOdds = (100-overProb) > 0 ? +(100/(100-overProb)).toFixed(2) : null;

  // 台彩 EV 計算（去水 + edge）
  const calcTwEV = (modelPct, oddsStr) => {
    const odds = parseFloat(oddsStr);
    if (!odds || isNaN(odds) || modelPct <= 0) return null;
    const noVigPct = modelPct; // 用模型當基準
    const ev = calcEV(modelPct, odds);
    const edge = calcEdge(modelPct, 100/odds);
    const decision = getDecision(edge);
    const minOdds = calcMinOdds(modelPct);
    const stake = calcStake(edge);
    return { ev, edge, decision, minOdds, stake, odds };
  };

  // 台彩 no-vig
  const twNoVig = useMemo(() => {
    const arr = [twHome, twDraw, twAway].filter(v=>parseFloat(v)>0).map(v=>parseFloat(v));
    if (arr.length < 2) return null;
    return calcNoVig(arr);
  }, [twHome, twDraw, twAway]);

  const twOverround = useMemo(() => {
    const arr = [twHome, twDraw, twAway].filter(v=>parseFloat(v)>0).map(v=>parseFloat(v));
    return arr.length >= 2 ? calcOverround(arr) : null;
  }, [twHome, twDraw, twAway]);

  const twEVHome  = calcTwEV(modelHome, twHome);
  const twEVAway  = calcTwEV(modelAway, twAway);
  const twEVOver  = calcTwEV(overProb, twOver);
  const twEVUnder = calcTwEV(100-overProb, twUnder);

  const bestTwBet = [twEVHome, twEVAway, twEVOver, twEVUnder].filter(Boolean).sort((a,b)=>b.ev-a.ev)[0];
  const overallDecision = bestTwBet ? getDecision(bestTwBet.edge) : 'WAIT';

  return (
    <div style={{ background:C.white, border:'1.5px solid #D4D8DF', borderRadius:12, overflow:'hidden' }}>
      {/* Header */}
      <div style={{ background:C.navy, padding:'14px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.55)', letterSpacing:1, marginBottom:3 }}>AI 衍生參數估算（合規輸出）</div>
          <div style={{ fontSize:16, fontWeight:800, color:'#fff' }}>{homeTeam} <span style={{ opacity:0.5, fontWeight:400 }}>vs</span> {awayTeam}</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <span style={{ fontSize:10, fontWeight:700, background:'rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.7)', padding:'3px 10px', borderRadius:4 }}>泊松模型</span>
          {bestTwBet && <DecisionBadge decision={overallDecision}/>}
        </div>
      </div>

      <div style={{ padding:'18px 20px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

          {/* 左：係數輸入 */}
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:C.muted, letterSpacing:0.8, marginBottom:14, textTransform:'uppercase' }}>攻防係數設定</div>
            <div style={{ marginBottom:10, padding:'6px 10px', background:'#EFF6FF', borderRadius:5, fontSize:11, color:C.navy, fontWeight:600 }}>{homeTeam}（{homeField?'主場':'客場'}）</div>
            <Slider label="攻擊爆發係數" value={homeAtk} onChange={setHomeAtk} color={C.win} hint="近期進球效率 vs 聯盟均值"/>
            <Slider label="防守韌性係數" value={homeDef} onChange={setHomeDef} color={C.navy}/>
            <div style={{ marginBottom:10, padding:'6px 10px', background:'#FEF2F2', borderRadius:5, fontSize:11, color:C.loss, fontWeight:600 }}>{awayTeam}（{homeField?'客場':'主場'}）</div>
            <Slider label="攻擊爆發係數" value={awayAtk} onChange={setAwayAtk} color={C.loss}/>
            <Slider label="防守韌性係數" value={awayDef} onChange={setAwayDef} color='#7C3AED'/>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:4 }}>
              <div>
                <div style={{ fontSize:10, color:C.muted, marginBottom:4 }}>大小分界點</div>
                <select value={ouLine} onChange={e=>setOuLine(+e.target.value)} style={{ padding:'5px 10px', border:`1px solid ${C.border}`, borderRadius:5, fontSize:12, background:C.white }}>
                  {[1.5,2.0,2.5,3.0,3.5,4.0].map(v=><option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize:10, color:C.muted, marginBottom:4 }}>主客場</div>
                <button onClick={()=>setHomeField(!homeField)} style={{ padding:'5px 12px', background:C.navy, color:'#fff', border:'none', borderRadius:5, cursor:'pointer', fontSize:11, fontWeight:700 }}>
                  {homeTeam} {homeField?'主場':'客場'}
                </button>
              </div>
            </div>
            <div style={{ marginTop:12, padding:'8px 10px', background:C.bg, borderRadius:6, fontSize:11, display:'flex', gap:16 }}>
              <span style={{ color:C.muted }}>期望進球：</span>
              <span style={{ color:C.win, fontWeight:700, fontFamily:'ui-monospace,monospace' }}>{homeLambda}</span>
              <span style={{ color:C.muted }}>vs</span>
              <span style={{ color:C.loss, fontWeight:700, fontFamily:'ui-monospace,monospace' }}>{awayLambda}</span>
            </div>
          </div>

          {/* 右：模型輸出 */}
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:C.muted, letterSpacing:0.8, marginBottom:14, textTransform:'uppercase' }}>模型輸出</div>

            {/* 勝負概率 */}
            <div style={{ background:C.bg, borderRadius:8, padding:'12px 14px', marginBottom:10 }}>
              <div style={{ fontSize:10, color:C.muted, fontWeight:700, marginBottom:8 }}>主 / 客 戰力推估（模型概率）</div>
              {[
                { label:`${homeTeam} 勝`, pct:modelHome, color:C.win },
                { label:'平局', pct:modelDraw, color:C.amber },
                { label:`${awayTeam} 勝`, pct:modelAway, color:C.loss },
              ].filter(s=>s.pct>0).map(s=>(
                <div key={s.label} style={{ marginBottom:6 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                    <span style={{ fontSize:11, color:C.muted }}>{s.label}</span>
                    <span style={{ fontSize:14, fontWeight:800, color:s.color, fontFamily:'ui-monospace,monospace' }}>{s.pct}%</span>
                  </div>
                  <div style={{ height:5, background:'#E9EBF0', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ width:`${s.pct}%`, height:'100%', background:s.color }}/>
                  </div>
                </div>
              ))}
              <div style={{ fontSize:9, color:C.muted, marginTop:6 }}>泊松分布模型 · 攻守係數加權</div>
            </div>

            {/* 大小分 */}
            <div style={{ background:C.bg, borderRadius:8, padding:'12px 14px', marginBottom:10 }}>
              <div style={{ fontSize:10, color:C.muted, fontWeight:700, marginBottom:8 }}>大小分 {ouLine} 推估</div>
              <div style={{ display:'flex', gap:16, marginBottom:6 }}>
                <div style={{ textAlign:'center', flex:1 }}>
                  <div style={{ fontSize:20, fontWeight:900, color:C.navy, fontFamily:'ui-monospace,monospace' }}>{overProb}%</div>
                  <div style={{ fontSize:10, color:C.muted }}>大分 ({'>'}{ouLine})</div>
                </div>
                <div style={{ textAlign:'center', flex:1 }}>
                  <div style={{ fontSize:20, fontWeight:900, color:'#7C3AED', fontFamily:'ui-monospace,monospace' }}>{+(100-overProb).toFixed(1)}%</div>
                  <div style={{ fontSize:10, color:C.muted }}>小分 ({'<'}{ouLine})</div>
                </div>
              </div>
            </div>

            {/* 比分預測 */}
            {sport==='soccer' && result.topScores?.length>0 && (
              <div style={{ background:C.bg, borderRadius:8, padding:'12px 14px', marginBottom:10 }}>
                <div style={{ fontSize:10, color:C.muted, fontWeight:700, marginBottom:8 }}>最可能比分</div>
                {result.topScores.slice(0,3).map((s,i)=>(
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'3px 0', borderBottom:i<2?`1px solid ${C.borderLight}`:'none' }}>
                    <span style={{ fontSize:12, fontWeight:i===0?800:500, color:i===0?C.dark:C.muted, fontFamily:'ui-monospace,monospace' }}>
                      {i===0?'🥇':i===1?'🥈':'🥉'} {s.home}-{s.away}
                    </span>
                    <span style={{ fontSize:12, fontWeight:700, color:i===0?C.navy:C.muted }}>{s.prob}%</span>
                  </div>
                ))}
              </div>
            )}

            {/* 公平賠率 & 建議賠率區間 */}
            <div style={{ background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:8, padding:'12px 14px' }}>
              <div style={{ fontSize:10, color:'#92400E', fontWeight:700, marginBottom:8 }}>模型公平賠率 & 最低可下注賠率</div>
              {[
                { label:`${homeTeam} 勝`, fair:fairHomeOdds, min:calcMinOdds(modelHome) },
                { label:`${awayTeam} 勝`, fair:fairAwayOdds, min:calcMinOdds(modelAway) },
                { label:`大分 >${ouLine}`, fair:fairOverOdds, min:calcMinOdds(overProb) },
                { label:`小分 <${ouLine}`, fair:fairUnderOdds, min:calcMinOdds(100-overProb) },
              ].map(r=>(
                <div key={r.label} style={{ display:'flex', justifyContent:'space-between', fontSize:11, padding:'3px 0' }}>
                  <span style={{ color:C.muted }}>{r.label}</span>
                  <span style={{ fontFamily:'ui-monospace,monospace', color:'#92400E', fontWeight:700 }}>
                    公平 {r.fair} · 最低 <span style={{ color:C.loss }}>{r.min}</span>
                  </span>
                </div>
              ))}
              <div style={{ fontSize:9, color:'#92400E', marginTop:6, opacity:0.8 }}>
                *最低可下注賠率 = 1/(模型概率-2%)。低於最低賠率下注屬負EV
              </div>
            </div>
          </div>
        </div>

        {/* 台灣運彩賠率比對 + EV 決策 */}
        <div style={{ marginTop:18, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
          <div style={{ background:'#1B5E20', padding:'10px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
            <span style={{ fontSize:12, fontWeight:700, color:'#fff' }}>🇹🇼 台灣運彩賠率輸入 → EV 即時計算</span>
            <a href="https://www.sportslottery.com.tw" target="_blank" rel="noopener noreferrer"
              style={{ fontSize:10, color:'rgba(255,255,255,0.7)', background:'rgba(255,255,255,0.15)', padding:'2px 8px', borderRadius:4, textDecoration:'none' }}>
              台灣運彩官網 →
            </a>
          </div>
          <div style={{ padding:'16px 18px' }}>
            <div style={{ fontSize:11, color:C.muted, marginBottom:14 }}>
              從台灣運彩官網查詢賠率後輸入，系統計算「去水概率」與「期望值」，判斷是否有統計優勢
            </div>

            {/* 賠率輸入 */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:10, marginBottom:14 }}>
              {[
                { label:`${homeTeam} 勝`, val:twHome, set:setTwHome, modelPct:modelHome },
                { label:'平局', val:twDraw, set:setTwDraw, modelPct:modelDraw },
                { label:`${awayTeam} 勝`, val:twAway, set:setTwAway, modelPct:modelAway },
                { label:`大分 >${ouLine}`, val:twOver, set:setTwOver, modelPct:overProb },
                { label:`小分 <${ouLine}`, val:twUnder, set:setTwUnder, modelPct:100-overProb },
              ].map(f => {
                const evData = calcTwEV(f.modelPct, f.val);
                const d = evData ? DECISIONS[evData.decision] : null;
                return (
                  <div key={f.label} style={{ background:d?d.bg:C.bg, border:`1px solid ${d?d.border:C.border}`, borderRadius:8, padding:'10px 12px' }}>
                    <div style={{ fontSize:10, color:C.muted, fontWeight:600, marginBottom:6 }}>{f.label}</div>
                    <input type="number" step="0.01" min="1" placeholder="台彩賠率"
                      value={f.val} onChange={e=>f.set(e.target.value)}
                      style={{ width:'100%', padding:'5px 8px', border:`1px solid ${C.border}`, borderRadius:5, fontSize:14, fontFamily:'ui-monospace,monospace', color:C.dark, background:C.white, boxSizing:'border-box' }}/>
                    {evData && (
                      <div style={{ marginTop:8 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                          <span style={{ fontSize:10, color:C.muted }}>去水概率</span>
                          <span style={{ fontSize:11, fontWeight:700, color:C.navy, fontFamily:'ui-monospace,monospace' }}>{+(100/evData.odds).toFixed(1)}%</span>
                        </div>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                          <span style={{ fontSize:10, color:C.muted }}>EV</span>
                          <span style={{ fontSize:11, fontWeight:800, color:evData.ev>0?C.win:C.loss, fontFamily:'ui-monospace,monospace' }}>{evData.ev>0?'+':''}{evData.ev}%</span>
                        </div>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                          <span style={{ fontSize:10, color:C.muted }}>Edge</span>
                          <span style={{ fontSize:11, fontWeight:700, color:evData.edge>0?C.win:C.loss, fontFamily:'ui-monospace,monospace' }}>{evData.edge>0?'+':''}{evData.edge}%</span>
                        </div>
                        <DecisionBadge decision={evData.decision}/>
                        {evData.decision === 'BET' && (
                          <div style={{ marginTop:6, fontSize:10, color:C.win }}>
                            建議注碼：{evData.stake}u · 最低賠率：{evData.minOdds}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 台彩水錢分析 */}
            {twNoVig && (
              <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:7, padding:'10px 14px', marginBottom:12 }}>
                <div style={{ fontSize:10, fontWeight:700, color:C.navy, marginBottom:6 }}>台彩去水分析</div>
                <div style={{ display:'flex', gap:16, flexWrap:'wrap', fontSize:11 }}>
                  <span style={{ color:C.muted }}>莊家水錢：<strong style={{ color:twOverround>8?C.loss:C.amber }}>{twOverround}%</strong></span>
                  <span style={{ color:C.muted }}>去水主勝：<strong style={{ color:C.navy }}>{twNoVig[0]}%</strong></span>
                  {twNoVig[1] && <span style={{ color:C.muted }}>去水平局：<strong style={{ color:C.navy }}>{twNoVig[1]}%</strong></span>}
                  <span style={{ color:C.muted }}>去水客勝：<strong style={{ color:C.navy }}>{twNoVig[twNoVig.length-1]}%</strong></span>
                </div>
              </div>
            )}

            {/* 決策規則說明 */}
            <div style={{ background:'#F6F7FA', border:'1px solid #D4D8DF', borderRadius:7, padding:'10px 14px' }}>
              <div style={{ fontSize:10, fontWeight:700, color:C.muted, marginBottom:6, letterSpacing:0.5 }}>EV 決策框架</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:6 }}>
                {[
                  { range:'Edge < 2%', dec:'NO BET', color:C.loss },
                  { range:'Edge 2-4%', dec:'LEAN（觀察）', color:C.amber },
                  { range:'Edge 4-7%', dec:'BET 0.25-0.5u', color:C.win },
                  { range:'Edge > 10%', dec:'REVIEW（確認數據）', color:'#7C3AED' },
                ].map(r=>(
                  <div key={r.range} style={{ fontSize:10, padding:'5px 8px', background:C.white, borderRadius:4, border:`1px solid ${C.borderLight}` }}>
                    <div style={{ color:C.muted }}>{r.range}</div>
                    <div style={{ fontWeight:700, color:r.color }}>{r.dec}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:10, fontSize:11, color:C.muted, lineHeight:1.6 }}>
                <strong>為何只給賠率區間？</strong> 直接跟單在台灣易觸犯刑法第 268 條。本工具為體育特徵權重計算機，由使用者自主設定係數，系統只反饋數學概率與期望值計算。台灣運彩為合法投注管道，所有決策由使用者自行承擔。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function factorial(n) { if(n<=1)return 1; let r=1; for(let i=2;i<=n;i++)r*=i; return r; }
