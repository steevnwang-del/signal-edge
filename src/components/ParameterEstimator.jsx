import { useState, useMemo } from 'react';
import { predictScores } from '../utils/scorePrediction';

const C = {
  navy:'#0F3460', white:'#FFFFFF', dark:'#111827',
  muted:'#6B7280', border:'#D4D8DF', borderLight:'#E9EBF0',
  win:'#059669', loss:'#DC2626', amber:'#D97706',
  bg:'#F6F7FA', panelAlt:'#EFF6FF',
};

const Slider = ({ label, value, onChange, min = 0, max = 100, color = C.navy }) => (
  <div style={{ marginBottom:14 }}>
    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
      <span style={{ fontSize:12, color:C.muted, fontWeight:600 }}>{label}</span>
      <span style={{ fontSize:16, fontWeight:900, color, fontFamily:'ui-monospace,monospace' }}>{value}</span>
    </div>
    <input type="range" min={min} max={max} value={value}
      onChange={e => onChange(+e.target.value)}
      style={{ width:'100%', accentColor:color, cursor:'pointer' }}/>
    <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:C.muted, marginTop:3 }}>
      <span>弱 ({min})</span><span>平均 (50)</span><span>強 ({max})</span>
    </div>
  </div>
);

const ProbBar = ({ label, prob, color, inverse = false }) => {
  const display = inverse ? 100 - prob : prob;
  return (
    <div style={{ marginBottom:8 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
        <span style={{ fontSize:11, color:C.muted, fontWeight:600 }}>{label}</span>
        <span style={{ fontSize:16, fontWeight:900, color, fontFamily:'ui-monospace,monospace' }}>{prob}%</span>
      </div>
      <div style={{ height:6, background:C.borderLight, borderRadius:3, overflow:'hidden' }}>
        <div style={{ width:`${prob}%`, height:'100%', background:color, borderRadius:3, transition:'width 0.3s' }}/>
      </div>
    </div>
  );
};

const EVBadge = ({ ev }) => {
  const positive = ev > 0;
  return (
    <span style={{
      display:'inline-block', padding:'2px 8px', borderRadius:4, fontSize:11, fontWeight:700,
      background: positive ? '#ECFDF5' : '#FEF2F2',
      color: positive ? C.win : C.loss,
      border: `1px solid ${positive ? '#A7F3D0' : '#FECACA'}`,
    }}>
      EV {positive ? '+' : ''}{ev.toFixed(1)}%
    </span>
  );
};

export default function ParameterEstimator({ homeTeam = '主隊', awayTeam = '客隊', sport = 'soccer' }) {
  // 使用者可調整的攻防係數
  const [homeAtk, setHomeAtk] = useState(72);
  const [homeDef, setHomeDef] = useState(68);
  const [awayAtk, setAwayAtk] = useState(65);
  const [awayDef, setAwayDef] = useState(71);
  const [ouLine, setOuLine] = useState(2.5);
  const [homeField, setHomeField] = useState(true);

  // 台灣運彩賠率輸入
  const [twHomeOdds, setTwHomeOdds] = useState('');
  const [twDrawOdds, setTwDrawOdds] = useState('');
  const [twAwayOdds, setTwAwayOdds] = useState('');
  const [twOverOdds, setTwOverOdds] = useState('');
  const [twUnderOdds, setTwUnderOdds] = useState('');

  // 計算期望進球數（基於係數）
  const homeLambda = useMemo(() => {
    const base = (homeAtk / 100) * 2.2 * (homeField ? 1.15 : 0.88);
    const defAdj = 1 - ((awayDef - 50) / 200);
    return Math.max(0.3, Math.round(base * defAdj * 10) / 10);
  }, [homeAtk, awayDef, homeField]);

  const awayLambda = useMemo(() => {
    const base = (awayAtk / 100) * 2.2 * (homeField ? 0.88 : 1.05);
    const defAdj = 1 - ((homeDef - 50) / 200);
    return Math.max(0.3, Math.round(base * defAdj * 10) / 10);
  }, [awayAtk, homeDef, homeField]);

  // 泊松計算
  const result = useMemo(() => {
    const scores = predictScores(homeLambda, awayLambda);
    return scores;
  }, [homeLambda, awayLambda]);

  // 大小分概率
  const overProb = useMemo(() => {
    let p = 0;
    for (let h = 0; h <= 6; h++) {
      for (let a = 0; a <= 6; a++) {
        if (h + a > ouLine) {
          const ph = Math.exp(-homeLambda) * Math.pow(homeLambda, h) / factorial(h);
          const pa = Math.exp(-awayLambda) * Math.pow(awayLambda, a) / factorial(a);
          p += ph * pa;
        }
      }
    }
    return Math.round(p * 1000) / 10;
  }, [homeLambda, awayLambda, ouLine]);

  // 建議賠率區間（公平賠率 = 1/概率，建議區間 = ±8%）
  const fairHomeOdds = result.homeWin > 0 ? (100 / result.homeWin) : null;
  const fairAwayOdds = result.awayWin > 0 ? (100 / result.awayWin) : null;
  const fairOverOdds = overProb > 0 ? (100 / overProb) : null;
  const fairUnderOdds = (100 - overProb) > 0 ? (100 / (100 - overProb)) : null;

  const range = (fair, margin = 0.08) => fair ? `${(fair*(1-margin)).toFixed(2)} ~ ${(fair*(1+margin)).toFixed(2)}` : '—';

  // EV 計算
  const calcEV = (prob, odds) => {
    const o = parseFloat(odds);
    if (!o || isNaN(o) || prob <= 0) return null;
    return Math.round(((prob / 100) * o - 1) * 1000) / 10;
  };

  const homeEV  = calcEV(result.homeWin, twHomeOdds);
  const awayEV  = calcEV(result.awayWin, twAwayOdds);
  const overEV  = calcEV(overProb, twOverOdds);
  const underEV = calcEV(100 - overProb, twUnderOdds);

  return (
    <div style={{ background:C.white, border:`1.5px solid ${C.border}`, borderRadius:12, overflow:'hidden' }}>
      {/* Header */}
      <div style={{ background:C.navy, padding:'14px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.6)', letterSpacing:1, marginBottom:3 }}>AI 衍生參數預估值（合規輸出）</div>
          <div style={{ fontSize:16, fontWeight:800, color:'#fff' }}>{homeTeam} <span style={{ opacity:0.5, fontWeight:400 }}>vs</span> {awayTeam}</div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <span style={{ fontSize:10, fontWeight:700, background:'rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.7)', padding:'3px 10px', borderRadius:4 }}>統計模型</span>
          <span style={{ fontSize:10, fontWeight:700, background:'rgba(0,230,118,0.15)', color:'#4ade80', padding:'3px 10px', borderRadius:4 }}>合規輸出</span>
        </div>
      </div>

      <div style={{ padding:'16px 18px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

          {/* 左側：係數輸入 */}
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:C.muted, letterSpacing:0.8, marginBottom:12, textTransform:'uppercase' }}>攻防係數設定</div>

            <div style={{ marginBottom:10, padding:'8px 10px', background:'#EFF6FF', borderRadius:6, fontSize:11, color:C.navy }}>
              <strong>{homeTeam}</strong>（{homeField ? '主場' : '客場'}）
            </div>
            <Slider label="攻擊爆發係數" value={homeAtk} onChange={setHomeAtk} color={C.win}/>
            <Slider label="防守韌性係數" value={homeDef} onChange={setHomeDef} color={C.navy}/>

            <div style={{ marginTop:4, marginBottom:10, padding:'8px 10px', background:'#FEF2F2', borderRadius:6, fontSize:11, color:C.loss }}>
              <strong>{awayTeam}</strong>（{homeField ? '客場' : '主場'}）
            </div>
            <Slider label="攻擊爆發係數" value={awayAtk} onChange={setAwayAtk} color={C.loss}/>
            <Slider label="防守韌性係數" value={awayDef} onChange={setAwayDef} color='#7C3AED'/>

            <div style={{ marginTop:10, display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
              <div>
                <div style={{ fontSize:10, color:C.muted, marginBottom:4 }}>大小分界點</div>
                <select value={ouLine} onChange={e=>setOuLine(+e.target.value)}
                  style={{ padding:'5px 10px', border:`1px solid ${C.border}`, borderRadius:5, fontSize:12, color:C.dark, background:C.white }}>
                  {[1.5,2.0,2.5,3.0,3.5,4.0].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize:10, color:C.muted, marginBottom:4 }}>主客場</div>
                <button onClick={()=>setHomeField(!homeField)}
                  style={{ padding:'5px 12px', background:C.navy, color:C.white, border:'none', borderRadius:5, cursor:'pointer', fontSize:11, fontWeight:700 }}>
                  {homeTeam} {homeField ? '主場' : '客場'}
                </button>
              </div>
            </div>

            {/* 期望進球顯示 */}
            <div style={{ marginTop:12, padding:'8px 12px', background:C.bg, borderRadius:6, display:'flex', gap:16, fontSize:11 }}>
              <div><span style={{ color:C.muted }}>期望進球 </span><span style={{ color:C.win, fontWeight:700, fontFamily:'ui-monospace,monospace' }}>{homeLambda}</span></div>
              <div><span style={{ color:C.muted }}>vs </span></div>
              <div><span style={{ color:C.loss, fontWeight:700, fontFamily:'ui-monospace,monospace' }}>{awayLambda}</span></div>
            </div>
          </div>

          {/* 右側：模型輸出 */}
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:C.muted, letterSpacing:0.8, marginBottom:12, textTransform:'uppercase' }}>模型動態輸出</div>

            {/* 勝負概率 */}
            <div style={{ background:C.bg, borderRadius:8, padding:'12px 14px', marginBottom:12 }}>
              <div style={{ fontSize:10, color:C.muted, fontWeight:700, marginBottom:10, letterSpacing:0.5 }}>主 / 客 動態戰力推估率</div>
              <ProbBar label={`${homeTeam} 勝率`} prob={result.homeWin} color={C.win}/>
              {result.draw > 0 && <ProbBar label="平局概率" prob={result.draw} color={C.amber}/>}
              <ProbBar label={`${awayTeam} 勝率`} prob={result.awayWin} color={C.loss}/>
              <div style={{ fontSize:9, color:C.muted, marginTop:6 }}>
                基於攻守係數 {homeAtk}/{awayAtk} 對比回測
              </div>
            </div>

            {/* 大小分 */}
            <div style={{ background:C.bg, borderRadius:8, padding:'12px 14px', marginBottom:12 }}>
              <div style={{ fontSize:10, color:C.muted, fontWeight:700, marginBottom:10, letterSpacing:0.5 }}>分界點 {ouLine} 大小分推估</div>
              <ProbBar label={`大分 (>${ouLine})`} prob={overProb} color={C.navy}/>
              <ProbBar label={`小分 (<${ouLine})`} prob={Math.round(1000-overProb*10)/10} color='#7C3AED'/>
              <div style={{ fontSize:9, color:C.muted, marginTop:6 }}>攻擊爆發值加權影響</div>
            </div>

            {/* 最可能比分 */}
            {sport === 'soccer' && result.topScores?.length > 0 && (
              <div style={{ background:C.bg, borderRadius:8, padding:'12px 14px', marginBottom:12 }}>
                <div style={{ fontSize:10, color:C.muted, fontWeight:700, marginBottom:8, letterSpacing:0.5 }}>最可能比分（泊松模型）</div>
                {result.topScores.slice(0,3).map((s,i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px 0', borderBottom:i<2?`1px solid ${C.borderLight}`:'none' }}>
                    <span style={{ fontSize:13, fontWeight:i===0?800:500, color:i===0?C.dark:C.muted, fontFamily:'ui-monospace,monospace' }}>
                      {i===0?'🥇':i===1?'🥈':'🥉'} {s.home}-{s.away}
                    </span>
                    <span style={{ fontSize:12, fontWeight:700, color:i===0?C.navy:C.muted, fontFamily:'ui-monospace,monospace' }}>{s.prob}%</span>
                  </div>
                ))}
              </div>
            )}

            {/* 建議賠率參數區間 */}
            <div style={{ background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:8, padding:'12px 14px' }}>
              <div style={{ fontSize:10, color:'#92400E', fontWeight:700, marginBottom:8, letterSpacing:0.5 }}>模型適配之合規賠率參數防線</div>
              {[
                { label:`${homeTeam} 建議區間`, range: range(fairHomeOdds) },
                { label:`${awayTeam} 建議區間`, range: range(fairAwayOdds) },
                { label:`大分 建議區間`, range: range(fairOverOdds) },
                { label:`小分 建議區間`, range: range(fairUnderOdds) },
              ].map(r => (
                <div key={r.label} style={{ display:'flex', justifyContent:'space-between', fontSize:11, padding:'3px 0' }}>
                  <span style={{ color:C.muted }}>{r.label}</span>
                  <span style={{ fontWeight:700, color:'#92400E', fontFamily:'ui-monospace,monospace' }}>{r.range}</span>
                </div>
              ))}
              <div style={{ marginTop:6, fontSize:9, color:'#92400E', opacity:0.8 }}>
                *超出此區間下注可能為負期望值，請謹慎參考
              </div>
            </div>
          </div>
        </div>

        {/* 台灣運彩賠率比對 */}
        <div style={{ marginTop:16, border:`1px solid ${C.border}`, borderRadius:8, overflow:'hidden' }}>
          <div style={{ background:'#1B5E20', padding:'10px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:12, fontWeight:700, color:'#fff' }}>🇹🇼 台灣運彩官方賠率比對</span>
            <a href="https://www.sportslottery.com.tw" target="_blank" rel="noopener noreferrer"
              style={{ fontSize:10, color:'rgba(255,255,255,0.7)', textDecoration:'none', background:'rgba(255,255,255,0.15)', padding:'2px 8px', borderRadius:4 }}>
              前往台灣運彩官網 →
            </a>
          </div>
          <div style={{ padding:'14px 16px' }}>
            <div style={{ fontSize:11, color:C.muted, marginBottom:12 }}>
              輸入台灣運彩官網的賠率，系統自動計算與模型公平賠率的期望值差異
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:10 }}>
              {[
                { label:`${homeTeam} 勝`, key:'home', val:twHomeOdds, set:setTwHomeOdds, ev:homeEV },
                { label:`${awayTeam} 勝`, key:'away', val:twAwayOdds, set:setTwAwayOdds, ev:awayEV },
                { label:`大分 >${ouLine}`, key:'over', val:twOverOdds, set:setTwOverOdds, ev:overEV },
                { label:`小分 <${ouLine}`, key:'under', val:twUnderOdds, set:setTwUnderOdds, ev:underEV },
              ].map(f => (
                <div key={f.key} style={{ background:C.bg, borderRadius:7, padding:'10px 12px' }}>
                  <div style={{ fontSize:10, color:C.muted, fontWeight:600, marginBottom:6 }}>{f.label}</div>
                  <input
                    type="number" step="0.01" min="1" placeholder="輸入賠率"
                    value={f.val} onChange={e => f.set(e.target.value)}
                    style={{ width:'100%', padding:'5px 8px', border:`1px solid ${C.border}`, borderRadius:5, fontSize:13, fontFamily:'ui-monospace,monospace', color:C.dark, background:C.white, boxSizing:'border-box' }}
                  />
                  {f.ev !== null && (
                    <div style={{ marginTop:6 }}>
                      <EVBadge ev={f.ev}/>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 說明文字 */}
            <div style={{ marginTop:14, padding:'10px 12px', background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:6, fontSize:11, color:C.navy, lineHeight:1.7 }}>
              <strong>為何給「參數區間」而非「跟單明牌」？</strong><br/>
              直接建議下注在台灣易觸犯刑法第 268 條。本工具為體育特徵權重計算機，由使用者自主設定攻防係數，系統只反饋該係數下的數學概率與期望值計算。台灣運彩為合法投注管道，如有投注需求請至官方網站自行決策。<br/>
              <strong>本站不提供非法博彩連結，不設外站跳轉按鈕，僅專注於數據演算分析。</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function factorial(n) {
  if (n <= 1) return 1;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}
