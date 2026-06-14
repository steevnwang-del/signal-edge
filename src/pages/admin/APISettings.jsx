import { useState } from 'react';

const C = { navy:'#0F3460', white:'#FFFFFF', dark:'#111827', muted:'#6B7280', border:'#D4D8DF', borderLight:'#E9EBF0', bg:'#ECEEF2', amber:'#D97706', win:'#059669', loss:'#DC2626', panelAlt:'#F6F7FA' };

const ALL_SOURCES = [
  // 需要 Key 的
  { id:'gemini',       name:'Gemini AI',         envKey:'GEMINI_API_KEY',    free:false, category:'AI 分析',    desc:'AI 賽事/選手/隊伍分析引擎', quota:'1,500次/天', url:'aistudio.google.com', source:'gemini', action:'analyze', testParams:{ prompt:'測試', type:'general' } },
  { id:'odds',         name:'The Odds API',       envKey:'ODDS_API_KEY',      free:false, category:'賠率數據',   desc:'多平台即時賠率比對', quota:'500次/月', url:'the-odds-api.com', source:'odds', action:'getSports', testParams:{} },
  { id:'footballdata', name:'football-data.org',  envKey:'FOOTBALL_DATA_KEY', free:false, category:'足球',       desc:'足球/世界杯官方比賽數據', quota:'10次/分鐘', url:'football-data.org', source:'football', action:'getStandings', testParams:{ competition:'WC' } },
  { id:'apisports',   name:'API-Sports',          envKey:'API_SPORTS_KEY',    free:false, category:'多項運動',   desc:'足球+籃球+棒球+F1+AFL', quota:'100次/天/項目', url:'api-sports.io', source:'nba', action:'getGames', testParams:{} },
  { id:'riot',         name:'Riot Games API',     envKey:'RIOT_API_KEY',      free:false, category:'電競',       desc:'LOL 選手/天梯/英雄數據', quota:'20次/秒', url:'developer.riotgames.com', source:'esports', action:'lolPlayer', testParams:{ summonerName:'Faker', region:'kr' } },
  { id:'newsapi',      name:'News API',           envKey:'NEWS_API_KEY',      free:false, category:'新聞',       desc:'英文體育新聞聚合', quota:'100次/天', url:'newsapi.org', source:'news', action:'getNewsAPI', testParams:{ query:'sports', limit:3 } },
  // 完全免費
  { id:'polymarket',   name:'Polymarket',         envKey:null, free:true, category:'預測市場', desc:'去中心化預測市場勝率', quota:'無限制', url:'polymarket.com', source:'polymarket', action:'getSportsMarkets', testParams:{} },
  { id:'balldontlie',  name:'Ball Don\'t Lie',    envKey:null, free:true, category:'NBA',      desc:'NBA 球員/賽事統計', quota:'完全免費', url:'balldontlie.io', source:'nba', action:'getGames', testParams:{} },
  { id:'mlbstats',     name:'MLB Stats API',      envKey:null, free:true, category:'MLB',      desc:'棒球官方數據（官方）', quota:'完全免費', url:'statsapi.mlb.com', source:'mlb', action:'getSchedule', testParams:{} },
  { id:'opendota',     name:'OpenDota',           envKey:null, free:true, category:'電競',     desc:'Dota2 全部數據', quota:'50,000次/月', url:'opendota.com', source:'esports', action:'dota2Player', testParams:{ accountId:'87278757' } },
  { id:'liquipedia',   name:'Liquipedia',         envKey:null, free:true, category:'電競',     desc:'電競賽事百科', quota:'完全免費', url:'liquipedia.net', source:'esports', action:'getTeam', testParams:{ teamName:'T1', game:'leagueoflegends' } },
  { id:'rss',          name:'RSS Feeds',          envKey:null, free:true, category:'新聞',     desc:'ESPN/BBC/Dot Esports等媒體', quota:'完全免費', url:'多媒體來源', source:'news', action:'getLatest', testParams:{ limit:3 } },
  { id:'espn',         name:'ESPN unofficial',    envKey:null, free:true, category:'多項運動', desc:'NBA新聞/比分/球員狀態', quota:'完全免費', url:'site.api.espn.com', source:'nba', action:'getNews', testParams:{} },
];

const CATEGORIES = ['全部', 'AI 分析', '賠率數據', '足球', '多項運動', 'NBA', 'MLB', '電競', '新聞', '預測市場'];

const StatusDot = ({ status }) => {
  const config = {
    ok:      { color:C.win,  bg:'#ECFDF5', label:'● 連線正常' },
    error:   { color:C.loss, bg:'#FEF2F2', label:'● 連線失敗' },
    testing: { color:C.amber,bg:'#FFFBEB', label:'● 測試中...' },
    free:    { color:C.win,  bg:'#ECFDF5', label:'● 免費直接使用' },
    pending: { color:C.muted,bg:C.panelAlt,label:'● 未測試' },
    nokey:   { color:C.loss, bg:'#FEF2F2', label:'● Key 未設定' },
  }[status] || { color:C.muted, bg:C.panelAlt, label:'● 未知' };
  return <span style={{ fontSize:11, fontWeight:700, color:config.color, background:config.bg, padding:'3px 9px', borderRadius:4 }}>{config.label}</span>;
};

export default function APISettings() {
  const [statuses, setStatuses] = useState({});
  const [testing, setTesting] = useState({});
  const [filter, setFilter] = useState('全部');
  const [testAll, setTestAll] = useState(false);

  const filtered = ALL_SOURCES.filter(s => filter === '全部' || s.category === filter);

  const testOne = async (src) => {
    if (src.free) return;
    setTesting(p => ({ ...p, [src.id]: true }));
    setStatuses(p => ({ ...p, [src.id]: 'testing' }));
    try {
      const r = await fetch('/api/gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: src.source, action: src.action, params: src.testParams }),
      });
      const data = await r.json();
      setStatuses(p => ({ ...p, [src.id]: data.success ? 'ok' : 'error' }));
    } catch {
      setStatuses(p => ({ ...p, [src.id]: 'error' }));
    }
    setTesting(p => ({ ...p, [src.id]: false }));
  };

  const testAllAPIs = async () => {
    setTestAll(true);
    for (const src of ALL_SOURCES.filter(s => !s.free)) {
      await testOne(src);
      await new Promise(r => setTimeout(r, 800));
    }
    setTestAll(false);
  };

  const configuredCount = ALL_SOURCES.filter(s => !s.free).length;
  const freeCount = ALL_SOURCES.filter(s => s.free).length;
  const okCount = Object.values(statuses).filter(s => s === 'ok').length;

  return (
    <div>
      {/* 統計卡 */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
        {[
          { label:'需要 Key 的數據源', val:`${configuredCount}`, unit:'個', color:C.navy },
          { label:'完全免費數據源', val:`${freeCount}`, unit:'個', color:C.win },
          { label:'總數據源', val:`${ALL_SOURCES.length}`, unit:'個' },
          { label:'連線測試通過', val:`${okCount}`, unit:`/${configuredCount}`, color:okCount===configuredCount?C.win:C.amber },
        ].map(s => (
          <div key={s.label} style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:8, padding:'12px 14px' }}>
            <div style={{ fontSize:10, color:C.muted, marginBottom:4 }}>{s.label}</div>
            <div style={{ fontSize:22, fontWeight:800, color:s.color||C.dark, fontFamily:'ui-monospace,monospace' }}>{s.val}<span style={{ fontSize:12 }}>{s.unit}</span></div>
          </div>
        ))}
      </div>

      {/* 警告 */}
      <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:8, padding:'10px 14px', marginBottom:14, fontSize:12, color:'#92400E' }}>
        ⚠️ API Key 只能在 <strong>Vercel → Settings → Environment Variables</strong> 設定，不要在這裡貼真實 key。這裡只做連線狀態測試。
      </div>

      {/* 操作列 */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <button onClick={testAllAPIs} disabled={testAll} style={{ background:testAll?C.muted:C.navy, color:C.white, border:'none', padding:'9px 18px', borderRadius:7, cursor:'pointer', fontSize:13, fontWeight:700 }}>
          {testAll ? '⏳ 測試中...' : '🔌 一鍵測試所有連線'}
        </button>
        <div style={{ display:'flex', border:`1px solid ${C.border}`, borderRadius:7, overflow:'hidden', background:C.white }}>
          {CATEGORIES.slice(0,6).map(cat => (
            <button key={cat} onClick={()=>setFilter(cat)} style={{ padding:'7px 12px', border:'none', cursor:'pointer', background:filter===cat?C.navy:'transparent', color:filter===cat?C.white:C.muted, fontSize:11, fontWeight:600, borderRight:`1px solid ${C.borderLight}` }}>{cat}</button>
          ))}
        </div>
      </div>

      {/* 數據源列表 */}
      <div style={{ display:'grid', gap:8 }}>
        {filtered.map(src => {
          const status = src.free ? 'free' : (statuses[src.id] || 'pending');
          return (
            <div key={src.id} style={{ background:C.white, border:`1px solid ${C.border}`, borderLeft:`4px solid ${src.free?C.win:C.navy}`, borderRadius:'0 9px 9px 0', padding:'14px 18px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                <div style={{ flex:1, minWidth:200 }}>
                  <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:4, flexWrap:'wrap' }}>
                    <span style={{ fontSize:14, fontWeight:700, color:C.dark }}>{src.name}</span>
                    <span style={{ fontSize:10, fontWeight:700, background:C.navy+'18', color:C.navy, padding:'1px 7px', borderRadius:3 }}>{src.category}</span>
                    {src.free && <span style={{ fontSize:10, fontWeight:700, background:'#ECFDF5', color:C.win, padding:'1px 7px', borderRadius:3 }}>免費無需Key</span>}
                    <StatusDot status={status}/>
                  </div>
                  <div style={{ fontSize:12, color:C.muted, marginBottom:3 }}>{src.desc}</div>
                  <div style={{ display:'flex', gap:14, fontSize:11, color:C.muted }}>
                    <span>🔗 {src.url}</span>
                    <span>📊 {src.quota}</span>
                    {src.envKey && <span style={{ fontFamily:'ui-monospace,monospace', color:C.navy }}>{src.envKey}</span>}
                  </div>
                </div>
                {!src.free && (
                  <button onClick={()=>testOne(src)} disabled={testing[src.id]}
                    style={{ background:'transparent', border:`1px solid ${C.navy}`, color:C.navy, padding:'7px 14px', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:700, flexShrink:0, opacity:testing[src.id]?0.6:1 }}>
                    {testing[src.id] ? '測試中...' : '測試連線'}
                  </button>
                )}
              </div>

              {/* 連線失敗提示 */}
              {status === 'error' && (
                <div style={{ marginTop:10, padding:'8px 12px', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:5, fontSize:11, color:C.loss }}>
                  ⚠️ 連線失敗 — 請確認 {src.envKey} 已正確設定於 Vercel 環境變數，並且 Redeploy 過
                </div>
              )}

              {/* 連線成功顯示 */}
              {status === 'ok' && (
                <div style={{ marginTop:10, padding:'8px 12px', background:'#ECFDF5', border:'1px solid #A7F3D0', borderRadius:5, fontSize:11, color:C.win }}>
                  ✅ 連線正常，數據可正常讀取
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 數據流狀態 */}
      <div style={{ marginTop:20, background:C.white, border:`1px solid ${C.border}`, borderRadius:10, padding:'16px 18px' }}>
        <div style={{ fontSize:13, fontWeight:700, color:C.dark, marginBottom:12 }}>📊 數據流狀態</div>
        {[
          { label:'Vercel Cron（每日自動分析）', status:'需設定 vercel.json', color:C.amber },
          { label:'Gemini AI 分析生成', status:'等待 Cron 觸發', color:C.amber },
          { label:'賠率數據更新', status:'Key 已設定，等待調用', color:C.amber },
          { label:'足球/世界杯數據', status:'Key 已設定，等待調用', color:C.amber },
          { label:'籃球/棒球數據', status:'Key 已設定，等待調用', color:C.amber },
          { label:'LOL 電競數據', status:'Key 已設定（24h過期）', color:C.amber },
          { label:'新聞 RSS 聚合', status:'免費，隨時可用', color:C.win },
        ].map(row => (
          <div key={row.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:`1px solid ${C.borderLight}` }}>
            <span style={{ fontSize:12, color:C.dark }}>{row.label}</span>
            <span style={{ fontSize:11, fontWeight:700, color:row.color }}>{row.status}</span>
          </div>
        ))}
        <div style={{ marginTop:12, padding:'10px 12px', background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:6, fontSize:12, color:C.navy }}>
          💡 要讓真實數據進來：先上傳 v8 的 <code>api/gateway.js</code> 和 <code>lib/sources/</code> 資料夾到 GitHub，然後點「一鍵測試所有連線」確認。
        </div>
      </div>
    </div>
  );
}
