import { useState } from 'react';

const C = { navy:'#0F3460', white:'#FFFFFF', dark:'#111827', muted:'#6B7280', border:'#D4D8DF', borderLight:'#E9EBF0', bg:'#F6F7FA', amber:'#D97706', win:'#059669', loss:'#DC2626', panelAlt:'#EFF6FF' };

const ALL_SOURCES = [
  { id:'aiProvider', name:'AI Provider（Gemini/Groq）', envKey:'GEMINI_API_KEY / GROQ_API_KEY', free:false, cat:'AI', desc:'Gemini 優先，失敗自動 fallback Groq', quota:'依 provider 額度', source:'aiProvider', action:'analyze', test:{ prompt:'請用一句繁體中文回覆：AI Provider 測試成功。', type:'general' } },
  { id:'odds', name:'The Odds API', envKey:'ODDS_API_KEY', free:false, cat:'賠率', desc:'多平台賠率', quota:'500/月', source:'odds', action:'getSports', test:{} },
  { id:'footballdata', name:'football-data.org', envKey:'FOOTBALL_DATA_KEY', free:false, cat:'足球', desc:'世界杯數據', quota:'10/分鐘', source:'football', action:'getStandings', test:{ competition:'WC' } },
  { id:'apisports', name:'API-Sports', envKey:'API_SPORTS_KEY', free:false, cat:'多項', desc:'籃球+棒球+F1', quota:'100/天', source:'apisports', action:'getUsage', test:{} },
  { id:'riot', name:'Riot Games API', envKey:'RIOT_API_KEY', free:false, cat:'電競', desc:'LOL選手數據', quota:'20/秒', source:'esports', action:'lolPlayer', test:{ summonerName:'Faker', region:'kr' } },
  { id:'newsapi', name:'News API', envKey:'NEWS_API_KEY', free:false, cat:'新聞', desc:'英文新聞', quota:'100/天', source:'news', action:'getNewsAPI', test:{ query:'sports', limit:1 } },
  { id:'balldontlie', name:'Ball Don\'t Lie', envKey:null, free:true, cat:'NBA', desc:'NBA免費數據', quota:'無限制', source:'nba', action:'getGames', test:{} },
  { id:'mlb', name:'MLB Stats API', envKey:null, free:true, cat:'MLB', desc:'棒球官方', quota:'無限制', source:'mlb', action:'getSchedule', test:{} },
  { id:'polymarket', name:'Polymarket', envKey:null, free:true, cat:'市場', desc:'預測市場', quota:'無限制', source:'polymarket', action:'getSportsMarkets', test:{} },
  { id:'opendota', name:'OpenDota', envKey:null, free:true, cat:'電競', desc:'Dota2數據', quota:'50k/月', source:'esports', action:'dota2Player', test:{ accountId:'87278757' } },
  { id:'rss', name:'RSS Feeds', envKey:null, free:true, cat:'新聞', desc:'ESPN/BBC/Dot Esports', quota:'無限制', source:'news', action:'getLatest', test:{ limit:2 } },
  { id:'espn', name:'ESPN unofficial', envKey:null, free:true, cat:'新聞', desc:'NBA新聞/比分', quota:'無限制', source:'nba', action:'getNews', test:{} },
  { id:'liquipedia', name:'Liquipedia', envKey:null, free:true, cat:'電競', desc:'電競賽事百科', quota:'無限制', source:'esports', action:'getTeam', test:{ teamName:'T1', game:'leagueoflegends' } },
];

const StatusBadge = ({ s }) => {
  const MAP = { ok:['#059669','#ECFDF5','連線正常'], error:['#DC2626','#FEF2F2','連線失敗'], testing:['#D97706','#FFFBEB','測試中'], free:['#059669','#ECFDF5','免費直接用'], '':['#6B7280','#F6F7FA','未測試'] };
  const [c,bg,label] = MAP[s]||MAP[''];
  return <span style={{ fontSize:10, fontWeight:700, color:c, background:bg, padding:'2px 8px', borderRadius:4 }}>● {label}</span>;
};

const UsageBar = ({ used, total, label }) => {
  const pct = total ? Math.round(used/total*100) : 0;
  const color = pct > 80 ? '#DC2626' : pct > 50 ? '#D97706' : '#059669';
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, marginBottom:3 }}>
        <span style={{ color:C.muted }}>{label}</span>
        <span style={{ fontWeight:700, color, fontFamily:'ui-monospace,monospace' }}>{used}/{total} ({pct}%)</span>
      </div>
      <div style={{ height:5, background:'#E9EBF0', borderRadius:3, overflow:'hidden' }}>
        <div style={{ width:`${Math.min(100,pct)}%`, height:'100%', background:color, borderRadius:3, transition:'width 0.5s' }}/>
      </div>
    </div>
  );
};

export default function APISettings() {
  const [statuses, setStatuses] = useState({});
  const [testing, setTesting] = useState({});
  const [usage, setUsage] = useState({});
  const [testingAll, setTestingAll] = useState(false);
  const [cronRunning, setCronRunning] = useState(false);
  const [cronLog, setCronLog] = useState('');

  const callGateway = async (source, action, params) => {
    const r = await fetch('/api/gateway', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ source, action, params }) });
    return r.json();
  };

  const testOne = async (src) => {
    setTesting(p=>({...p,[src.id]:true}));
    setStatuses(p=>({...p,[src.id]:'testing'}));
    try {
      const d = await callGateway(src.source, src.action, src.test);
      const ok = d.success;
      setStatuses(p=>({...p,[src.id]:ok?'ok':'error'}));
      // 抓使用量
      if (ok && src.id === 'apisports' && d.result) {
        setUsage(p=>({...p, apisports: d.result }));
      }
      if (ok && src.id === 'odds' && d.result?.remaining !== undefined) {
        setUsage(p=>({...p, odds: { used: 500-d.result.remaining, total:500, remaining:d.result.remaining } }));
      }
    } catch { setStatuses(p=>({...p,[src.id]:'error'})); }
    setTesting(p=>({...p,[src.id]:false}));
  };

  const testAll = async () => {
    setTestingAll(true);
    for (const src of ALL_SOURCES) {
      await testOne(src);
      await new Promise(r=>setTimeout(r,700));
    }
    setTestingAll(false);
  };

  // 手動觸發 Cron
  const runCron = async () => {
    setCronRunning(true);
    setCronLog('⏳ 正在呼叫 AI 生成分析...');
    try {
      const r = await fetch('/api/cron/generate-analysis', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'x-admin-trigger':'1' }
      });
      const d = await r.json();
      if (d.success) {
        setCronLog(`✅ 完成！成功生成 ${d.generated} 份分析，失敗 ${d.failed||0} 份。${new Date().toLocaleTimeString('zh-TW')}`);
      } else {
        setCronLog('❌ 生成失敗，請確認 AI_PROVIDER / GEMINI_API_KEY / GROQ_API_KEY / ODDS_API_KEY 已設定');
      }
    } catch (e) {
      setCronLog('❌ 連線失敗：' + e.message);
    }
    setCronRunning(false);
  };

  const okCount = Object.values(statuses).filter(s=>s==='ok').length;
  const testedCount = Object.values(statuses).filter(s=>s!=='').length;

  return (
    <div>
      {/* 統計 */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
        {[
          { label:'數據源總數', val:ALL_SOURCES.length.toString(), unit:'個' },
          { label:'免費數據源', val:ALL_SOURCES.filter(s=>s.free).length.toString(), unit:'個', color:C.win },
          { label:'已測試', val:`${testedCount}/${ALL_SOURCES.length}`, color:C.navy },
          { label:'連線正常', val:`${okCount}`, unit:'個', color:okCount>0?C.win:C.muted },
        ].map(s=>(
          <div key={s.label} style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:8, padding:'12px 14px' }}>
            <div style={{ fontSize:10, color:C.muted, marginBottom:4 }}>{s.label}</div>
            <div style={{ fontSize:22, fontWeight:800, color:s.color||C.dark, fontFamily:'ui-monospace,monospace' }}>{s.val}<span style={{ fontSize:12 }}>{s.unit||''}</span></div>
          </div>
        ))}
      </div>

      {/* 使用量顯示 */}
      {(usage.odds || usage.apisports) && (
        <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:8, padding:'14px 16px', marginBottom:14 }}>
          <div style={{ fontSize:12, fontWeight:700, color:C.dark, marginBottom:10 }}>📊 API 使用量（本月/今日）</div>
          <div style={{ display:'grid', gap:10 }}>
            {usage.odds && <UsageBar label="The Odds API（本月）" used={usage.odds.used||0} total={usage.odds.total||500}/>}
            {usage.apisports && <UsageBar label="API-Sports（今日）" used={usage.apisports.used||0} total={usage.apisports.total||100}/>}
          </div>
        </div>
      )}

      {/* 手動觸發 Cron */}
      <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:8, padding:'14px 16px', marginBottom:14 }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.dark, marginBottom:10 }}>⚙️ 手動觸發 AI 分析生成</div>
        <div style={{ fontSize:11, color:C.muted, marginBottom:10 }}>
          正常情況每天早上 6 點自動執行。有緊急更新（傷病/異動）時手動觸發。
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <button onClick={runCron} disabled={cronRunning}
            style={{ background:cronRunning?C.muted:C.navy, color:C.white, border:'none', padding:'9px 20px', borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:700 }}>
            {cronRunning ? '⏳ 生成中...' : '▶ 立即生成所有分析'}
          </button>
          {cronLog && <div style={{ fontSize:12, color:cronLog.startsWith('✅')?C.win:C.loss, fontWeight:600 }}>{cronLog}</div>}
        </div>
      </div>

      {/* 操作 */}
      <div style={{ display:'flex', gap:10, marginBottom:14 }}>
        <button onClick={testAll} disabled={testingAll}
          style={{ background:testingAll?C.muted:C.navy, color:C.white, border:'none', padding:'8px 18px', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:700 }}>
          {testingAll?'⏳ 測試中...':'🔌 一鍵測試所有連線'}
        </button>
        <div style={{ fontSize:11, color:C.muted, display:'flex', alignItems:'center' }}>
          測試會消耗少量 API 額度
        </div>
      </div>

      {/* 數據源列表 */}
      <div style={{ display:'grid', gap:8 }}>
        {ALL_SOURCES.map(src => (
          <div key={src.id} style={{ background:C.white, border:`1px solid ${C.border}`, borderLeft:`4px solid ${src.free?C.win:C.navy}`, borderRadius:'0 9px 9px 0', padding:'12px 16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:3 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:C.dark }}>{src.name}</span>
                  <span style={{ fontSize:10, background:C.navy+'18', color:C.navy, padding:'1px 6px', borderRadius:3, fontWeight:600 }}>{src.cat}</span>
                  {src.free && <span style={{ fontSize:10, background:'#ECFDF5', color:C.win, padding:'1px 6px', borderRadius:3, fontWeight:600 }}>免費</span>}
                  <StatusBadge s={testing[src.id]?'testing':(statuses[src.id]||''+(src.free?'free':''))}/>
                </div>
                <div style={{ fontSize:11, color:C.muted }}>{src.desc} · {src.quota}</div>
                {src.envKey && <div style={{ fontSize:10, color:C.navy, fontFamily:'ui-monospace,monospace', marginTop:2 }}>{src.envKey}</div>}
              </div>
              <button onClick={()=>testOne(src)} disabled={testing[src.id]}
                style={{ background:'transparent', border:`1px solid ${C.border}`, color:C.navy, padding:'6px 12px', borderRadius:5, cursor:'pointer', fontSize:11, fontWeight:700, opacity:testing[src.id]?0.5:1, flexShrink:0 }}>
                {testing[src.id]?'..':'測試'}
              </button>
            </div>
            {statuses[src.id]==='error' && (
              <div style={{ marginTop:8, fontSize:11, color:C.loss, background:'#FEF2F2', padding:'6px 10px', borderRadius:5 }}>
                ⚠️ {src.envKey?`請確認 ${src.envKey} 已設定於 Vercel 環境變數`:'服務暫時無法使用'}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
