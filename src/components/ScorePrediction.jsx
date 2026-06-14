import { predictScores } from '../utils/scorePrediction';

const C = { navy:'#0F3460', white:'#FFFFFF', dark:'#111827', muted:'#6B7280', border:'#D4D8DF', bg:'#F6F7FA', win:'#059669', loss:'#DC2626', amber:'#D97706' };

export default function ScorePrediction({ homeName, awayName, homeLambda = 1.8, awayLambda = 0.9 }) {
  const { topScores, homeWin, draw, awayWin } = predictScores(homeLambda, awayLambda);
  const maxBar = topScores[0]?.prob || 1;

  return (
    <div style={{ border:`1px solid ${C.border}`, borderRadius:8, overflow:'hidden' }}>
      <div style={{ padding:'10px 14px', background:C.bg, borderBottom:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:12, fontWeight:700, color:C.navy }}>📊 比賽結果預測</span>
        <span style={{ fontSize:9, color:C.muted, background:'#EFF6FF', padding:'2px 7px', borderRadius:3 }}>泊松分布統計模型</span>
      </div>
      <div style={{ padding:'14px 16px' }}>

        {/* 結果概率 */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:14 }}>
          {[
            { label:'主隊勝', val:homeWin, name:homeName, color:C.win },
            { label:'平局', val:draw, name:'平局', color:C.amber },
            { label:'客隊勝', val:awayWin, name:awayName, color:C.loss },
          ].map(s => (
            <div key={s.label} style={{ textAlign:'center', background:s.color+'0f', border:`1px solid ${s.color}33`, borderRadius:6, padding:'8px 4px' }}>
              <div style={{ fontSize:9, color:C.muted, marginBottom:3 }}>{s.label}</div>
              <div style={{ fontSize:20, fontWeight:900, color:s.color, fontFamily:'ui-monospace,monospace' }}>{s.val}%</div>
              <div style={{ fontSize:9, color:C.muted, marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.name}</div>
            </div>
          ))}
        </div>

        {/* 最可能比分 */}
        <div style={{ fontSize:10, fontWeight:700, color:C.muted, letterSpacing:0.5, marginBottom:8 }}>最可能比分（模型預測）</div>
        {topScores.map((s, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:5 }}>
            <div style={{ fontSize:11, fontWeight:i===0?800:600, color:i===0?C.dark:C.muted, minWidth:70, fontFamily:'ui-monospace,monospace' }}>
              {i===0?'🥇':i===1?'🥈':i===2?'🥉':'  '} {s.home}-{s.away}
            </div>
            <div style={{ flex:1, height:6, background:'#E9EBF0', borderRadius:3, overflow:'hidden' }}>
              <div style={{ width:`${Math.round(s.prob/maxBar*100)}%`, height:'100%', background:i===0?C.navy:'#94A3B8', borderRadius:3 }}/>
            </div>
            <div style={{ fontSize:11, fontWeight:700, color:i===0?C.navy:C.muted, fontFamily:'ui-monospace,monospace', minWidth:36 }}>{s.prob}%</div>
          </div>
        ))}

        <div style={{ marginTop:12, fontSize:10, color:C.muted, borderTop:`1px solid #E9EBF0`, paddingTop:8 }}>
          ⓘ 基於兩隊近期場均進球數計算，僅供學術分析參考
        </div>
      </div>
    </div>
  );
}
