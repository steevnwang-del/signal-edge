import { useEffect, useState } from 'react';
import { getSettings, saveSettings } from '../../services/firestore';

const C = { navy:'#0F3460', white:'#FFFFFF', dark:'#111827', muted:'#6B7280', border:'#D4D8DF', borderLight:'#E9EBF0', bg:'#F6F7FA', amber:'#D97706', win:'#059669', loss:'#DC2626' };
const inputStyle = { background:C.bg, border:`1px solid ${C.border}`, borderRadius:6, padding:'8px 12px', fontSize:12, color:C.dark, outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'ui-monospace,monospace', lineHeight:1.6 };

// GPT 建議的完整 Prompt 模板
const PROMPTS = {
  system: {
    label:'⚙️ 系統 Prompt（所有分析共用）',
    desc:'所有 Gemini 分析的基礎限制規則',
    vars:[],
    template:`你是 SignalEdge 的運動博彩量化分析系統中的 Narrative Agent。

重要限制（必須嚴格遵守）：
1. 你不是賠率模型，不能自行創造 modelProb 或 EV
2. 所有數字必須完全來自 DATA_BLOCK，不能憑空捏造
3. 不得使用「穩」、「必中」、「保證」、「鎖單」、「必下」等字眼
4. 不得承諾獲利，不得鼓勵重注
5. EV <= 0 時必須說明沒有下注價值
6. 資料不完整（data_completeness < 0.7）必須提醒
7. 陣容未確認（lineup_confirmed = false）必須提醒等首發
8. Decision = NO BET 時必須清楚說明原因

你的任務：
將 DATA_BLOCK 中的量化結果轉換成客觀、保守、可讀的繁體中文分析（150-200字）。

必須包含：
- 模型與市場差距的主因
- 目前 EV 是否為正
- 一個主要風險
- 開賽前需要確認的條件

輸出 JSON 格式：
{
  "headline": "一句話標題，不超過24字",
  "summary": "150-200字繁體中文分析",
  "value_reason": "1-2句說明為何有（或沒有）價格差",
  "main_risk": "主要風險",
  "pre_match_check": "開賽前需確認的事項",
  "warning": "此分析只代表價格與機率比較，不保證比賽結果",
  "decision_display": "BET | LEAN | WAIT | NO BET"
}`
  },

  soccer_match: {
    label:'⚽ 足球/世界杯 賽前分析',
    desc:'每場足球賽事的 DATA_BLOCK → 分析報告',
    vars:['home_team','away_team','home_no_vig','away_no_vig','draw_no_vig','model_home','model_away','model_draw','home_xg','away_xg','ev','edge','decision','min_odds','stake','home_form','away_form','home_goals_avg','away_goals_avg','overround','key_note'],
    template:`請根據以下 DATA_BLOCK 生成足球賽前分析。嚴格使用 DATA_BLOCK 中的數字，不得自行創造。

DATA_BLOCK:
賽事：{home_team} vs {away_team}
市場去水概率：主隊 {home_no_vig}% | 平局 {draw_no_vig}% | 客隊 {away_no_vig}%（莊家水錢：{overround}%）
模型概率：主隊 {model_home}% | 平局 {model_draw}% | 客隊 {model_away}%
期望進球：{home_team} {home_xg} | {away_team} {away_xg}
主隊近況：{home_form}（場均進球 {home_goals_avg}）
客隊近況：{away_form}（場均進球 {away_goals_avg}）
EV：{ev}% | Edge：{edge}% | 決策：{decision}
最低可下注賠率：{min_odds} | 建議注碼：{stake}u
補充：{key_note}

請輸出 JSON 格式分析。`
  },

  basketball_match: {
    label:'🏀 NBA 賽前分析',
    desc:'NBA 賽事分析，考慮傷病和連戰',
    vars:['home_team','away_team','home_no_vig','away_no_vig','model_home','model_away','ev','edge','decision','home_offense','home_defense','away_offense','away_defense','injuries','back_to_back','key_note'],
    template:`請根據以下 DATA_BLOCK 生成 NBA 賽前分析。嚴格使用 DATA_BLOCK 數字，不得自行創造。

DATA_BLOCK:
賽事：{home_team} vs {away_team}
市場去水概率：主隊 {home_no_vig}% | 客隊 {away_no_vig}%
模型概率：主隊 {model_home}% | 客隊 {model_away}%
主隊進攻效率：{home_offense} | 防守效率：{home_defense}
客隊進攻效率：{away_offense} | 防守效率：{away_defense}
傷病：{injuries}
連戰：{back_to_back}
EV：{ev}% | Edge：{edge}% | 決策：{decision}
補充：{key_note}

注意：若傷病未確認，必須提醒。若有連戰疲勞，必須納入分析。
請輸出 JSON 格式分析。`
  },

  esports_match: {
    label:'🎮 電競賽前分析',
    desc:'LOL/Valorant/CS2 賽事分析',
    vars:['home_team','away_team','game','format','home_no_vig','away_no_vig','model_home','model_away','ev','edge','decision','home_form','away_form','home_win_rate','away_win_rate','patch_note','key_note'],
    template:`請根據以下 DATA_BLOCK 生成電競賽前分析。嚴格使用 DATA_BLOCK 數字，不得自行創造。

DATA_BLOCK:
遊戲：{game}，賽制：{format}
賽事：{home_team} vs {away_team}
市場去水概率：{home_team} {home_no_vig}% | {away_team} {away_no_vig}%
模型概率：{home_team} {model_home}% | {away_team} {model_away}%
{home_team}近況：{home_form}（本賽季勝率 {home_win_rate}%）
{away_team}近況：{away_form}（本賽季勝率 {away_win_rate}%）
版本說明：{patch_note}
EV：{ev}% | Edge：{edge}% | 決策：{decision}
補充：{key_note}

注意：電競版本差異影響大，若有版本更新必須納入分析。
請輸出 JSON 格式分析。`
  },

  daily_scan: {
    label:'📅 每日賽事掃描',
    desc:'掃描今日所有賽事，找出最高 EV 機會',
    vars:['matches_data'],
    template:`請掃描今日所有賽事，找出最高 EV 機會。

規則：
- 只分析 DATA_BLOCK 中有完整賠率的賽事
- 不要為了湊數推薦下注
- 最多推薦 5 場，沒有正 EV 就輸出「今日無合適下注機會」
- Edge < 2% 一律 NO BET
- 資料不完整一律 WAIT

DATA_BLOCK:
{matches_data}

請依照優先順序輸出：
1. 最高 EV 候選（附 edge、ev、decision、stake）
2. 等待盤口（值得觀察但暫不下注）
3. 明確不建議下注的原因

格式：JSON 陣列，每個元素包含 match、decision、ev、edge、reason`
  },

  player_analysis: {
    label:'🏅 選手數據分析',
    desc:'基於真實統計數據的選手能力分析',
    vars:['name','team','position','sport','stats','league_avg','percentiles','recent_form'],
    template:`請根據以下選手統計數據生成客觀分析。嚴格使用 DATA_BLOCK 數字。

DATA_BLOCK:
選手：{name}（{team}，{position}，{sport}）
統計數據：{stats}
聯盟平均：{league_avg}
百分位排名：{percentiles}
近期表現：{recent_form}

要求：
- 描述選手相較聯盟平均的優勢與弱點
- 以具體數據支撐，不做主觀評語
- 不使用「天才」「最強」等誇張語言
- 150字以內

輸出 JSON：{"summary": "", "strength": "", "weakness": "", "trend": ""}`
  },
};

const Label = ({ children }) => (
  <div style={{ fontSize:10, color:C.muted, fontWeight:700, letterSpacing:0.5, marginBottom:6, textTransform:'uppercase' }}>{children}</div>
);

export default function PromptSettings() {
  const [prompts, setPrompts] = useState(PROMPTS);
  const [active, setActive] = useState('system');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState('');
  const [saved, setSaved] = useState(false);


  useEffect(() => {
    (async () => {
      try {
        const settings = await getSettings();
        if (settings?.promptTemplates) {
          setPrompts(prev => {
            const next = { ...prev };
            Object.entries(settings.promptTemplates || {}).forEach(([key, template]) => {
              if (next[key]) next[key] = { ...next[key], template };
            });
            return next;
          });
        }
      } catch (e) { console.warn('[PromptSettings] load skipped:', e.message); }
    })();
  }, []);

  const saveAllPrompts = async () => {
    const promptTemplates = Object.fromEntries(Object.entries(prompts).map(([key, val]) => [key, val.template]));
    const promptMeta = { updatedAt: new Date().toISOString(), version: `prompt-${Date.now()}` };
    const ok = await saveSettings({ promptTemplates, promptMeta });
    setSaved(true);
    setTimeout(()=>setSaved(false),2000);
    if (!ok) alert('⚠️ 前端已暫存，但 Firestore 儲存失敗，請確認 rules / owner 權限。');
  };

  const current = prompts[active];

  const testPrompt = async () => {
    setTesting(true);
    setTestResult('');
    const mockData = {
      home_team:'巴西 🇧🇷', away_team:'摩洛哥 🇲🇦',
      home_no_vig:'54.2', away_no_vig:'18.1', draw_no_vig:'27.7',
      model_home:'57.8', model_away:'16.2', model_draw:'26.0',
      home_xg:'1.82', away_xg:'0.71', overround:'8.3',
      home_form:'W W D W W', away_form:'W L W W D',
      home_goals_avg:'2.1', away_goals_avg:'0.8',
      ev:'+7.1', edge:'+3.6', decision:'BET',
      min_odds:'1.54', stake:'0.5',
      key_note:'摩洛哥主力後衛傷況存疑',
    };
    let filled = current.template;
    Object.entries(mockData).forEach(([k,v]) => {
      filled = filled.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    });
    try {
      const r = await fetch('/api/gateway', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ source:'aiProvider', action:'analyze', params:{ prompt:filled, type:'general' } }),
      });
      const d = await r.json();
      setTestResult(d.result?.analysis || '測試失敗');
    } catch (e) {
      setTestResult('無法連接 AI：' + e.message);
    }
    setTesting(false);
  };

  return (
    <div>
      <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:12, color:C.navy, lineHeight:1.7 }}>
        <strong>Prompt 設計原則（來自 GPT 建議）：</strong><br/>
        後台儲存後，cron / Admin 產生分析會讀取 settings/site.promptTemplates。Gemini/Groq 只負責文字敘述，不負責計算 EV 或勝率。
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:16 }}>
        {/* 左側選單 */}
        <div>
          <Label>分析類型</Label>
          {Object.entries(prompts).map(([key, p]) => (
            <button key={key} onClick={()=>{ setActive(key); setTestResult(''); }}
              style={{ display:'block', width:'100%', textAlign:'left', padding:'10px 12px', marginBottom:4, border:`1.5px solid ${active===key?C.navy:C.border}`, borderRadius:7, cursor:'pointer', background:active===key?C.navy:C.white, color:active===key?C.white:C.dark, fontSize:12, fontWeight:active===key?700:400 }}>
              {p.label}
            </button>
          ))}
        </div>

        {/* 右側 */}
        <div>
          <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:10, padding:'18px 20px' }}>
            <div style={{ fontSize:14, fontWeight:700, color:C.dark, marginBottom:4 }}>{current.label}</div>
            <div style={{ fontSize:12, color:C.muted, marginBottom:14 }}>{current.desc}</div>

            {current.vars.length > 0 && (
              <div style={{ marginBottom:12 }}>
                <Label>DATA_BLOCK 變數（點擊複製）</Label>
                <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                  {current.vars.map(v => (
                    <button key={v} onClick={()=>navigator.clipboard?.writeText(`{${v}}`)}
                      style={{ fontSize:10, fontFamily:'ui-monospace,monospace', background:C.bg, border:`1px solid ${C.border}`, borderRadius:4, padding:'2px 8px', cursor:'pointer', color:C.navy, fontWeight:600 }}>
                      {'{'+v+'}'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Label>Prompt 模板</Label>
            <textarea
              value={current.template}
              onChange={e => setPrompts(p => ({ ...p, [active]:{ ...p[active], template:e.target.value } }))}
              style={{ ...inputStyle, height:260, resize:'vertical' }}/>

            <div style={{ display:'flex', gap:10, marginTop:12, flexWrap:'wrap' }}>
              <button onClick={testPrompt} disabled={testing || active==='system'}
                style={{ background:testing?C.muted:C.navy, color:'#fff', border:'none', padding:'9px 18px', borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:700, opacity:testing||active==='system'?0.7:1 }}>
                {testing ? '⏳ 測試中...' : '🧪 測試（使用Mock數據）'}
              </button>
              <button onClick={saveAllPrompts}
                style={{ background:saved?C.win:C.amber, color:'#fff', border:'none', padding:'9px 18px', borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:700 }}>
                {saved ? '✓ 已儲存到 Firestore' : '💾 儲存全部 Prompt'}
              </button>
              <button onClick={()=>setPrompts(p=>({...p,[active]:{...p[active],template:PROMPTS[active].template}}))}
                style={{ background:'transparent', border:`1px solid ${C.border}`, color:C.muted, padding:'9px 14px', borderRadius:6, cursor:'pointer', fontSize:12 }}>
                重置
              </button>
            </div>

            {testResult && (
              <div style={{ marginTop:14, border:`1px solid ${C.border}`, borderRadius:8, overflow:'hidden' }}>
                <div style={{ padding:'8px 14px', background:C.bg, borderBottom:`1px solid ${C.border}`, fontSize:11, fontWeight:700, color:C.navy }}>🤖 AI 回覆預覽</div>
                <div style={{ padding:'14px 16px' }}>
                  <pre style={{ fontSize:12, color:C.dark, lineHeight:1.7, margin:0, whiteSpace:'pre-wrap', fontFamily:'ui-monospace,monospace' }}>{testResult}</pre>
                </div>
              </div>
            )}
          </div>

          {/* 數據流說明 */}
          <div style={{ marginTop:14, background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:8, padding:'12px 16px', fontSize:12, color:'#92400E', lineHeight:1.7 }}>
            <strong>正確的數據流（GPT 建議架構）：</strong><br/>
            後端計算（EV/Edge/No-vig）→ 填入 DATA_BLOCK → 套用 Firestore Prompt → 丟給 Gemini/Groq → 產生成品分析<br/>
            <strong>前台只讀已產生的分析結果，不應每次開頁都呼叫 AI。</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
