import { useState } from 'react';
import ScorePrediction from '../components/ScorePrediction';

const C = { navy:'#0F3460', white:'#FFFFFF', dark:'#111827', muted:'#6B7280', border:'#D4D8DF', borderLight:'#E9EBF0', bg:'#ECEEF2', amber:'#D97706', win:'#059669', loss:'#DC2626', panelAlt:'#F6F7FA' };
const SPORT_C = { 世界杯:'#1B5E20', NBA:'#C9082A', MLB:'#002D72', LOL:'#C89B3C', Valorant:'#FF4655' };

// 賽事數據 - 每場有 homeLambda/awayLambda 用於比分預測
const EVENTS = [
  { id:1, sport:'世界杯', home:{ name:'巴西 🇧🇷', form:['W','W','D','W','W'] }, away:{ name:'摩洛哥 🇲🇦', form:['W','L','W','W','D'] }, time:'今日 08:00', stage:'C組 第一場', modelHome:67, modelDraw:14, modelAway:19, homeLambda:1.82, awayLambda:0.71,
    analysis:'巴西近5場攻守俱佳，場均進球 2.1，失球 0.6。摩洛哥防線穩健但客場進球率偏低（0.8/場）。泊松模型預測巴西主動進球概率明顯偏高。' },
  { id:2, sport:'世界杯', home:{ name:'法國 🇫🇷', form:['W','W','L','W','D'] }, away:{ name:'塞內加爾 🇸🇳', form:['W','W','L','W','W'] }, time:'今日 12:00', stage:'I組 第一場', modelHome:52, modelDraw:16, modelAway:32, homeLambda:1.41, awayLambda:1.08,
    analysis:'法國 Griezmann 傷況存疑，影響中場組織效率。塞內加爾 Mané 近期狀態回升，本場兩隊實力差距縮小，市場高估法國優勢，模型評估差距約 6%。' },
  { id:3, sport:'LOL', home:{ name:'T1', form:['W','W','W','W','W'] }, away:{ name:'Gen.G', form:['W','W','L','W','W'] }, time:'今日 18:00', stage:'LCK 春季賽決賽', modelHome:62, modelDraw:0, modelAway:38, homeLambda:null, awayLambda:null,
    analysis:'T1 本賽季正規賽 28-4，Faker 個人評分達本賽季峰值。Gen.G Chovy 對線能力突出，但 T1 團戰協調性更強，五局長賽 T1 體能優勢顯著。' },
  { id:4, sport:'MLB', home:{ name:'洛杉磯道奇', form:['W','W','W','W','L'] }, away:{ name:'紐約洋基', form:['L','W','W','L','W'] }, time:'今日 09:05', stage:'常規賽', modelHome:58, modelDraw:0, modelAway:42, homeLambda:1.62, awayLambda:1.18,
    analysis:'道奇先發 Yamamoto（ERA 2.31）對決洋基 Cole（ERA 3.12），先發優勢偏向主隊。道奇近8場主場 7 勝 1 敗，打擊率 .284 維持高檔。' },
  { id:5, sport:'世界杯', home:{ name:'西班牙 🇪🇸', form:['W','W','W','W','W'] }, away:{ name:'烏拉圭 🇺🇾', form:['W','D','W','W','L'] }, time:'明日 02:00', stage:'H組 第一場', modelHome:71, modelDraw:14, modelAway:15, homeLambda:2.08, awayLambda:0.64,
    analysis:'西班牙本屆資格賽控球率均值 66%，傳球成功率 92%，進攻多元化。烏拉圭依賴 Nuñez 的個人能力，客場防守任務艱鉅。模型預測西班牙主宰比賽節奏。' },
];

export default function CalendarPage() {
  const [filter, setFilter] = useState('全部');
  const [expanded, setExpanded] = useState(null);
  const sports = ['全部','世界杯','NBA','MLB','LOL'];
  const filtered = EVENTS.filter(e => filter === '全部' || e.sport === filter);

  return (
    <div style={{ background:C.bg, minHeight:'100vh' }}>
      <div style={{ maxWidth:1000, margin:'0 auto', padding:'28px 20px' }}>
        <div style={{ marginBottom:22 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:1.5, color:C.amber, marginBottom:6, textTransform:'uppercase' }}>賽事行事曆</div>
          <h2 style={{ fontSize:26, fontWeight:900, color:C.dark, margin:'0 0 6px' }}>今明兩日賽程</h2>
          <p style={{ color:C.muted, fontSize:13, margin:0 }}>統計模型預測 · 比賽結果概率 · 點擊查看詳細分析</p>
        </div>

        <div style={{ display:'flex', border:`1px solid ${C.border}`, borderRadius:8, overflow:'hidden', background:C.white, marginBottom:20, width:'fit-content' }}>
          {sports.map(s => (
            <button key={s} onClick={()=>setFilter(s)} style={{ padding:'7px 16px', border:'none', cursor:'pointer', background:filter===s?C.navy:'transparent', color:filter===s?C.white:C.muted, fontSize:12, fontWeight:700, borderRight:`1px solid ${C.borderLight}` }}>{s}</button>
          ))}
        </div>

        <div style={{ display:'grid', gap:10 }}>
          {filtered.map(ev => {
            const sc = SPORT_C[ev.sport] || C.navy;
            const isOpen = expanded === ev.id;
            const isSoccer = ev.sport === '世界杯' || ev.sport === '足球';
            return (
              <div key={ev.id} style={{ background:C.white, border:`1px solid ${isOpen?sc:C.border}`, borderLeft:`4px solid ${sc}`, borderRadius:'0 9px 9px 0', overflow:'hidden', transition:'border-color 0.15s' }}>
                <div onClick={()=>setExpanded(isOpen?null:ev.id)} style={{ padding:'14px 18px', cursor:'pointer' }}
                  onMouseEnter={e=>e.currentTarget.style.background=C.panelAlt}
                  onMouseLeave={e=>e.currentTarget.style.background=C.white}>
                  <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:10, flexWrap:'wrap' }}>
                    <span style={{ background:sc+'18', color:sc, fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:3 }}>{ev.sport}</span>
                    <span style={{ fontSize:11, fontWeight:700, color:C.amber }}>{ev.time}</span>
                    <span style={{ fontSize:11, color:C.muted }}>{ev.stage}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:15, fontWeight:700, color:C.dark }}>{ev.home.name} <span style={{ color:C.muted, fontWeight:400 }}>vs</span> {ev.away.name}</div>
                      <div style={{ display:'flex', gap:4, marginTop:6 }}>
                        {ev.home.form.map((r,i)=><div key={i} style={{ width:10, height:10, borderRadius:'50%', background:r==='W'?C.win:r==='L'?C.loss:C.amber }}/>)}
                      </div>
                    </div>
                    <div style={{ textAlign:'center', minWidth:140 }}>
                      <div style={{ fontSize:10, color:C.muted, marginBottom:4 }}>勝負概率</div>
                      <div style={{ display:'flex', gap:4, alignItems:'center', justifyContent:'center', flexWrap:'wrap' }}>
                        <div style={{ textAlign:'center' }}>
                          <div style={{ fontSize:16, fontWeight:800, color:C.win, fontFamily:'ui-monospace,monospace' }}>{ev.modelHome}%</div>
                          <div style={{ fontSize:9, color:C.muted }}>主勝</div>
                        </div>
                        {ev.modelDraw > 0 && <>
                          <div style={{ textAlign:'center' }}>
                            <div style={{ fontSize:14, fontWeight:700, color:C.amber, fontFamily:'ui-monospace,monospace' }}>{ev.modelDraw}%</div>
                            <div style={{ fontSize:9, color:C.muted }}>平</div>
                          </div>
                        </>}
                        <div style={{ textAlign:'center' }}>
                          <div style={{ fontSize:16, fontWeight:800, color:C.loss, fontFamily:'ui-monospace,monospace' }}>{ev.modelAway}%</div>
                          <div style={{ fontSize:9, color:C.muted }}>客勝</div>
                        </div>
                      </div>
                      <div style={{ height:5, background:C.loss+'44', borderRadius:3, overflow:'hidden', marginTop:6, position:'relative' }}>
                        <div style={{ position:'absolute', left:`${ev.modelHome}%`, width:`${ev.modelDraw}%`, height:'100%', background:C.amber }}/>
                        <div style={{ width:`${ev.modelHome}%`, height:'100%', background:C.win }}/>
                      </div>
                    </div>
                    <div style={{ color:isOpen?sc:C.muted, fontSize:12, flexShrink:0 }}>{isOpen?'▲':'▼'}</div>
                  </div>
                </div>

                {isOpen && (
                  <div style={{ padding:'0 18px 18px', borderTop:`1px solid ${C.borderLight}` }}>
                    {/* 靜態分析文字（admin 預設好的，用戶不能觸發） */}
                    {ev.analysis && (
                      <div style={{ marginTop:14, padding:'12px 14px', background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:7 }}>
                        <div style={{ fontSize:10, fontWeight:700, color:C.navy, marginBottom:6, letterSpacing:0.5 }}>📊 賽事數據分析</div>
                        <p style={{ fontSize:13, color:C.dark, lineHeight:1.8, margin:0 }}>{ev.analysis}</p>
                      </div>
                    )}

                    {/* 比分預測（泊松模型，只對足球類） */}
                    {isSoccer && ev.homeLambda && (
                      <div style={{ marginTop:14 }}>
                        <ScorePrediction
                          homeName={ev.home.name}
                          awayName={ev.away.name}
                          homeLambda={ev.homeLambda}
                          awayLambda={ev.awayLambda}
                        />
                      </div>
                    )}

                    <div style={{ marginTop:10, fontSize:10, color:C.muted }}>
                      ⓘ 所有預測基於統計數據模型，僅供研究參考，不構成任何投注建議
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
