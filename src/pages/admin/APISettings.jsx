import { useState } from 'react';

const C = { navy:'#0F3460', white:'#FFFFFF', dark:'#111827', muted:'#6B7280', border:'#D4D8DF', borderLight:'#E9EBF0', bg:'#ECEEF2', amber:'#D97706', win:'#059669', loss:'#DC2626', panelAlt:'#F6F7FA' };

const API_SOURCES = [
  {
    category: '賠率數據',
    items: [
      { id:'odds', name:'The Odds API', url:'the-odds-api.com', desc:'多平台即時賠率比對', free:false, keyName:'ODDS_API_KEY', applyUrl:'https://the-odds-api.com', quota:'500次/月', priority:'high' },
      { id:'betfair', name:'Betfair Exchange', url:'betfair.com/exchange', desc:'全球最大賠率交易所，最接近真實市場', free:false, keyName:'BETFAIR_API_KEY', applyUrl:'https://developer.betfair.com', quota:'無限制', priority:'high' },
      { id:'polymarket', name:'Polymarket API', url:'polymarket.com', desc:'去中心化預測市場，反映真實社群勝率判斷', free:true, keyName:null, applyUrl:'https://polymarket.com', quota:'完全免費', priority:'high' },
      { id:'twlottery', name:'台灣運彩', url:'sportslottery.com.tw', desc:'政府合法投注，官方賠率參考（需手動輸入）', free:true, keyName:null, applyUrl:'https://www.sportslottery.com.tw', quota:'公開查詢', priority:'high' },
    ]
  },
  {
    category: '足球 / 世界杯',
    items: [
      { id:'footballdata', name:'football-data.org', url:'football-data.org', desc:'歐洲聯賽+世界杯官方比賽數據，隊伍戰績', free:false, keyName:'FOOTBALL_DATA_KEY', applyUrl:'https://www.football-data.org/client/register', quota:'10次/分鐘（免費）', priority:'high' },
      { id:'apifootball', name:'API-Football', url:'api-football.com', desc:'選手數據、陣容、傷病報告、賽程', free:false, keyName:'API_FOOTBALL_KEY', applyUrl:'https://www.api-football.com/register', quota:'100次/天（免費）', priority:'high' },
      { id:'fbref', name:'FBref 進階統計', url:'fbref.com', desc:'xG、傳球精準率等進階指標（爬取）', free:true, keyName:null, applyUrl:'https://fbref.com', quota:'公開爬取', priority:'medium' },
    ]
  },
  {
    category: 'NBA 籃球',
    items: [
      { id:'balldontlie', name:'Ball Don\'t Lie API', url:'balldontlie.io', desc:'NBA球員數據、賽事結果、場均統計', free:true, keyName:null, applyUrl:'https://www.balldontlie.io', quota:'完全免費', priority:'high' },
      { id:'nbastats', name:'NBA Stats API', url:'stats.nba.com', desc:'進階數據：PER、BPM、VORP等百分位數據', free:true, keyName:null, applyUrl:'https://stats.nba.com', quota:'完全免費（非官方）', priority:'high' },
      { id:'espn', name:'ESPN Unofficial API', url:'site.api.espn.com', desc:'比賽即時比分、球員狀態、傷病報告', free:true, keyName:null, applyUrl:'https://site.api.espn.com/apis/site/v2/sports', quota:'完全免費', priority:'medium' },
    ]
  },
  {
    category: 'MLB 棒球',
    items: [
      { id:'mlbstats', name:'MLB Stats API（官方）', url:'statsapi.mlb.com', desc:'MLB官方數據，打擊率、防禦率、賽事結果', free:true, keyName:null, applyUrl:'https://statsapi.mlb.com', quota:'完全免費（官方）', priority:'high' },
    ]
  },
  {
    category: '電競',
    items: [
      { id:'riot', name:'Riot Games API', url:'developer.riotgames.com', desc:'LOL/Valorant選手數據、天梯排名、英雄勝率', free:false, keyName:'RIOT_API_KEY', applyUrl:'https://developer.riotgames.com', quota:'20次/秒（免費）', priority:'high' },
      { id:'opendota', name:'OpenDota API', url:'opendota.com', desc:'Dota2全部數據，選手統計、比賽記錄', free:true, keyName:null, applyUrl:'https://www.opendota.com/api-keys', quota:'50,000次/月免費', priority:'medium' },
      { id:'pandascore', name:'PandaScore', url:'pandascore.co', desc:'電競多項目：LOL/CS2/Valorant/Dota2賽事數據', free:false, keyName:'PANDASCORE_KEY', applyUrl:'https://pandascore.co', quota:'100次/天（免費）', priority:'medium' },
      { id:'liquipedia', name:'Liquipedia API', url:'liquipedia.net', desc:'電競賽事百科：隊伍資料、賽程、歷史戰績', free:true, keyName:null, applyUrl:'https://liquipedia.net/api.php', quota:'完全免費', priority:'high' },
    ]
  },
  {
    category: 'AI 分析',
    items: [
      { id:'gemini', name:'Gemini 1.5 Flash', url:'aistudio.google.com', desc:'AI分析引擎，生成中文賽事/選手/隊伍分析', free:false, keyName:'GEMINI_API_KEY', applyUrl:'https://aistudio.google.com', quota:'1,500次/天（免費）', priority:'high' },
      { id:'newsapi', name:'News API', url:'newsapi.org', desc:'英文體育新聞聚合，供AI翻譯標題用', free:false, keyName:'NEWS_API_KEY', applyUrl:'https://newsapi.org/register', quota:'100次/天（免費）', priority:'medium' },
    ]
  },
];

const PRIORITY_LABELS = { high:'核心', medium:'建議', low:'選配' };
const PRIORITY_COLORS = { high: C.win, medium: C.amber, low: C.muted };

export default function APISettings() {
  const [keys, setKeys] = useState({
    ODDS_API_KEY: '5ba08b6badbdf966df73eac3e2030dfa',
    GEMINI_API_KEY: '已設定（Vercel環境變數）',
  });
  const [show, setShow] = useState({});
  const [saved, setSaved] = useState({});

  const saveKey = (keyName, val) => {
    setKeys(p => ({ ...p, [keyName]: val }));
    setSaved(p => ({ ...p, [keyName]: true }));
    setTimeout(() => setSaved(p => ({ ...p, [keyName]: false })), 2000);
  };

  const configured = Object.keys(keys).filter(k => keys[k]).length;
  const freeCount = API_SOURCES.flatMap(c=>c.items).filter(i=>i.free).length;
  const totalCount = API_SOURCES.flatMap(c=>c.items).length;

  return (
    <div>
      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
        {[
          { label:'已設定 API', val:`${configured}`, unit:`/${API_SOURCES.flatMap(c=>c.items).filter(i=>!i.free).length}`, color:C.win },
          { label:'完全免費數據源', val:freeCount.toString(), unit:'個', color:C.amber },
          { label:'總數據源', val:totalCount.toString(), unit:'個' },
          { label:'每日 AI 額度', val:'1,500', unit:'次', color:C.navy },
        ].map(s => (
          <div key={s.label} style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:8, padding:'12px 14px' }}>
            <div style={{ fontSize:10, color:C.muted, marginBottom:4 }}>{s.label}</div>
            <div style={{ fontSize:20, fontWeight:800, color:s.color||C.dark, fontFamily:'ui-monospace,monospace' }}>{s.val}<span style={{ fontSize:12, fontWeight:600 }}>{s.unit}</span></div>
          </div>
        ))}
      </div>

      <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:12, color:C.navy }}>
        ⚠️ API Key 請在 <strong>Vercel → Settings → Environment Variables</strong> 設定，不要在這裡儲存真實 key。這裡的輸入框只用於測試連線狀態。
      </div>

      {API_SOURCES.map(cat => (
        <div key={cat.category} style={{ marginBottom:20 }}>
          <div style={{ fontSize:12, fontWeight:700, color:C.dark, marginBottom:10, letterSpacing:0.5, display:'flex', alignItems:'center', gap:8 }}>
            {cat.category}
            <span style={{ fontSize:10, color:C.muted, fontWeight:400 }}>{cat.items.length} 個數據源</span>
          </div>
          <div style={{ display:'grid', gap:8 }}>
            {cat.items.map(api => {
              const hasKey = api.free || !!keys[api.keyName];
              return (
                <div key={api.id} style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:9, padding:'14px 18px' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:14, flexWrap:'wrap' }}>
                    <div style={{ flex:1, minWidth:200 }}>
                      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:4, flexWrap:'wrap' }}>
                        <span style={{ fontSize:14, fontWeight:700, color:C.dark }}>{api.name}</span>
                        <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:3, background:PRIORITY_COLORS[api.priority]+'18', color:PRIORITY_COLORS[api.priority] }}>{PRIORITY_LABELS[api.priority]}</span>
                        {api.free
                          ? <span style={{ fontSize:10, fontWeight:700, color:C.win, background:'#ECFDF5', padding:'2px 7px', borderRadius:3 }}>● 免費無需Key</span>
                          : <span style={{ fontSize:10, fontWeight:700, color:hasKey?C.win:C.loss, background:hasKey?'#ECFDF5':'#FEF2F2', padding:'2px 7px', borderRadius:3 }}>{hasKey?'● 已設定':'● 未設定'}</span>
                        }
                      </div>
                      <div style={{ fontSize:12, color:C.muted, marginBottom:4 }}>{api.desc}</div>
                      <div style={{ display:'flex', gap:12, fontSize:11, color:C.muted }}>
                        <span>🔗 {api.url}</span>
                        <span>📊 {api.quota}</span>
                      </div>
                    </div>

                    <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
                      {!api.free && (
                        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                          <input
                            type={show[api.keyName]?'text':'password'}
                            placeholder={`${api.keyName}...`}
                            value={keys[api.keyName]||''}
                            onChange={e=>setKeys(p=>({...p,[api.keyName]:e.target.value}))}
                            style={{ padding:'6px 10px', border:`1px solid ${C.border}`, borderRadius:5, fontSize:12, width:200, fontFamily:'ui-monospace,monospace', color:C.dark, background:C.white }}
                          />
                          <button onClick={()=>setShow(p=>({...p,[api.keyName]:!p[api.keyName]}))}
                            style={{ background:'transparent', border:`1px solid ${C.border}`, borderRadius:5, padding:'6px 8px', cursor:'pointer', fontSize:11, color:C.muted }}>
                            {show[api.keyName]?'🙈':'👁'}
                          </button>
                          <button onClick={()=>saveKey(api.keyName, keys[api.keyName])}
                            style={{ background:saved[api.keyName]?C.win:C.navy, color:C.white, border:'none', borderRadius:5, padding:'6px 12px', cursor:'pointer', fontSize:11, fontWeight:700 }}>
                            {saved[api.keyName]?'✓':'儲存'}
                          </button>
                        </div>
                      )}
                      <a href={api.applyUrl} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize:11, color:C.navy, background:'#EFF6FF', border:'1px solid #BFDBFE', padding:'6px 12px', borderRadius:5, textDecoration:'none', fontWeight:600, whiteSpace:'nowrap' }}>
                        申請 →
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
