import { useState } from 'react';

const C = { navy:'#0F3460', white:'#FFFFFF', dark:'#111827', muted:'#6B7280', border:'#D4D8DF', borderLight:'#E9EBF0', bg:'#ECEEF2', amber:'#D97706', win:'#059669', loss:'#DC2626', panelAlt:'#F6F7FA' };
const inputStyle = { background:C.panelAlt, border:`1px solid ${C.border}`, borderRadius:6, padding:'8px 12px', fontSize:13, color:C.dark, outline:'none', width:'100%', boxSizing:'border-box' };

const DEFAULT_PROMPTS = {
  soccer_match: {
    label:'⚽ 足球/世界杯 賽事分析',
    desc:'每場足球/世界杯賽事的賽前分析報告',
    vars:['home','away','homeForm','awayForm','homeGoals','awayGoals','homeConc','awayConc','homeWinProb','keyNote'],
    template:`你是專業足球數據分析師。根據以下數據，用繁體中文生成200字以內的賽前分析報告。
以數據為基礎，客觀描述兩隊實力差距、近期狀態、關鍵統計亮點。
不做任何輸贏保證，不提供投注建議，結尾加一句合規免責聲明。

賽事：{home} vs {away}
主隊近況（最近5場）：{homeForm}
主隊場均進球：{homeGoals}，場均失球：{homeConc}
客隊近況（最近5場）：{awayForm}
客隊場均進球：{awayGoals}，場均失球：{awayConc}
統計模型預測主隊勝率：{homeWinProb}%
補充資訊：{keyNote}

請直接輸出分析內容，不要加標題或標籤。`,
  },
  basketball_match: {
    label:'🏀 NBA 賽事分析',
    desc:'NBA賽事的賽前數據分析',
    vars:['home','away','homeForm','awayForm','homeOffense','homeDefense','awayOffense','awayDefense','injuries'],
    template:`你是專業籃球數據分析師。根據以下數據，用繁體中文生成200字以內的賽前分析。
以數據說話，描述兩隊攻守差異、關鍵球員狀態、主客場影響。
不做任何輸贏保證，不提供投注建議。

賽事：{home} vs {away}
主隊近況：{homeForm}，場均得分：{homeOffense}，場均失分：{homeDefense}
客隊近況：{awayForm}，場均得分：{awayOffense}，場均失分：{awayDefense}
傷病報告：{injuries}

請直接輸出分析內容，不要加標題。`,
  },
  esports_match: {
    label:'🎮 電競賽事分析',
    desc:'LOL/Valorant/CS2等電競賽事分析',
    vars:['home','away','game','format','homeForm','awayForm','homeWinRate','awayWinRate','keyNote'],
    template:`你是專業電競數據分析師。根據以下數據，用繁體中文生成200字以內的賽前分析。
重點分析本賽季數據差異、選手狀態、對陣歷史記錄。
不做任何輸贏保證，不提供投注建議。

遊戲：{game}，賽制：{format}
賽事：{home} vs {away}
{home}近況：{homeForm}，本賽季勝率：{homeWinRate}%
{away}近況：{awayForm}，本賽季勝率：{awayWinRate}%
重點資訊：{keyNote}

請直接輸出分析內容，不要加標題。`,
  },
  player_analysis: {
    label:'🏅 選手數據分析',
    desc:'個別選手的能力與近期表現分析',
    vars:['name','team','position','sport','stats'],
    template:`你是專業運動數據分析師。根據以下選手統計數據，用繁體中文生成150字以內的客觀分析。
描述選手相較聯盟平均的優勢與弱點，以具體數據支撐，不做主觀評語。
只基於數據事實，不做個人能力的主觀判斷。

選手：{name}
隊伍：{team}
位置：{position}
運動：{sport}
統計數據：{stats}

請直接輸出分析，不要加標題。`,
  },
  team_analysis: {
    label:'🏆 隊伍戰術分析',
    desc:'隊伍整體戰術風格與實力評估',
    vars:['name','league','form','keyPlayers','stats'],
    template:`你是專業戰術分析師。根據以下隊伍資料，用繁體中文生成200字以內的戰術分析。
包含主要戰術風格、核心球員角色、統計數據亮點、可能的弱點。
以客觀數據為基礎，不做賽果預測保證。

隊伍：{name}（{league}）
近5場戰績：{form}
核心球員：{keyPlayers}
關鍵統計：{stats}

請直接輸出分析，不要加標題。`,
  },
};

export default function PromptSettings() {
  const [prompts, setPrompts] = useState(DEFAULT_PROMPTS);
  const [active, setActive] = useState('soccer_match');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState('');
  const [saved, setSaved] = useState(false);

  const current = prompts[active];

  const testPrompt = async () => {
    setTesting(true);
    setTestResult('');
    const mockFill = {
      home:'巴西 🇧🇷', away:'摩洛哥 🇲🇦',
      homeForm:'W W D W W', awayForm:'W L W W D',
      homeGoals:'2.1', awayGoals:'0.8',
      homeConc:'0.7', awayConc:'1.2',
      homeWinProb:'67', keyNote:'摩洛哥主力後衛傷缺',
      homeOffense:'118', homeDefense:'108', awayOffense:'112', awayDefense:'114',
      injuries:'無重大傷病', name:'Faker', team:'T1', position:'中單', sport:'LOL',
      game:'LOL', format:'BO5', homeWinRate:'72', awayWinRate:'68',
      league:'LCK', form:'W W W W W', keyPlayers:'Faker、Zeus、Gumayusi',
      stats:'場均KDA 6.8，傷害 18200，補兵 312',
    };
    let filledPrompt = current.template;
    Object.entries(mockFill).forEach(([k,v]) => {
      filledPrompt = filledPrompt.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    });

    try {
      const r = await fetch('/api/analyze', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ prompt: filledPrompt, type:'general' }),
      });
      const d = await r.json();
      setTestResult(d.analysis || '測試失敗');
    } catch { setTestResult('無法連接 AI 服務，請確認 GEMINI_API_KEY 已設定於 Vercel 環境變數'); }
    setTesting(false);
  };

  const savePrompts = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    // 實際串接後存到 Firestore: db.collection('settings').doc('prompts').set(prompts)
  };

  return (
    <div>
      <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:12, color:C.navy, lineHeight:1.7 }}>
        <strong>Prompt 設定說明：</strong><br/>
        1. 選擇要設定的分析類型（足球/籃球/電競/選手/隊伍）<br/>
        2. 修改 Prompt 模板，用 {'{變數名}'} 代表動態填入的數據<br/>
        3. 點「測試 AI 生成」確認效果<br/>
        4. 儲存後，Vercel Cron 每天自動用這些 Prompt 生成分析
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:16 }}>
        {/* 左側選單 */}
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:C.muted, letterSpacing:0.5, marginBottom:8 }}>分析類型</div>
          {Object.entries(prompts).map(([key, p]) => (
            <button key={key} onClick={()=>{ setActive(key); setTestResult(''); }}
              style={{ display:'block', width:'100%', textAlign:'left', padding:'10px 12px', marginBottom:4, border:`1.5px solid ${active===key?C.navy:C.border}`, borderRadius:7, cursor:'pointer', background:active===key?C.navy:C.white, color:active===key?C.white:C.dark, fontSize:12, fontWeight:active===key?700:400 }}>
              {p.label}
            </button>
          ))}
        </div>

        {/* 右側編輯區 */}
        <div>
          <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:10, padding:'18px 20px' }}>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:14, fontWeight:700, color:C.dark, marginBottom:4 }}>{current.label}</div>
              <div style={{ fontSize:12, color:C.muted }}>{current.desc}</div>
            </div>

            {/* 可用變數 */}
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:10, fontWeight:700, color:C.muted, letterSpacing:0.5, marginBottom:6 }}>可用變數（點擊複製）</div>
              <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                {current.vars.map(v => (
                  <button key={v} onClick={()=>navigator.clipboard?.writeText(`{${v}}`)}
                    style={{ fontSize:10, fontFamily:'ui-monospace,monospace', background:C.panelAlt, border:`1px solid ${C.border}`, borderRadius:4, padding:'2px 8px', cursor:'pointer', color:C.navy, fontWeight:600 }}>
                    {'{'+v+'}'}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt 編輯器 */}
            <div style={{ fontSize:11, fontWeight:700, color:C.muted, letterSpacing:0.5, marginBottom:6 }}>PROMPT 模板</div>
            <textarea
              value={current.template}
              onChange={e => setPrompts(p => ({ ...p, [active]:{ ...p[active], template:e.target.value } }))}
              style={{ ...inputStyle, height:240, resize:'vertical', fontFamily:'ui-monospace,monospace', fontSize:12, lineHeight:1.7 }}
            />

            {/* 操作按鈕 */}
            <div style={{ display:'flex', gap:10, marginTop:12, flexWrap:'wrap' }}>
              <button onClick={testPrompt} disabled={testing}
                style={{ background:C.navy, color:C.white, border:'none', padding:'9px 18px', borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:700, opacity:testing?0.7:1 }}>
                {testing ? '⏳ AI 生成中...' : '🧪 測試 AI 生成'}
              </button>
              <button onClick={savePrompts}
                style={{ background:saved?C.win:C.amber, color:C.white, border:'none', padding:'9px 18px', borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:700 }}>
                {saved ? '✓ 已儲存' : '💾 儲存設定'}
              </button>
              <button onClick={()=>setPrompts(p=>({...p,[active]:{...p[active],template:DEFAULT_PROMPTS[active].template}}))}
                style={{ background:'transparent', border:`1px solid ${C.border}`, color:C.muted, padding:'9px 14px', borderRadius:6, cursor:'pointer', fontSize:12 }}>
                重置預設
              </button>
            </div>

            {/* AI 測試結果 */}
            {(testing || testResult) && (
              <div style={{ marginTop:14, border:`1px solid ${C.border}`, borderRadius:8, overflow:'hidden' }}>
                <div style={{ padding:'8px 14px', background:C.panelAlt, borderBottom:`1px solid ${C.border}`, fontSize:11, fontWeight:700, color:C.navy }}>🤖 AI 生成結果預覽</div>
                <div style={{ padding:'14px 16px', minHeight:60 }}>
                  {testing ? (
                    <div style={{ color:C.muted, fontSize:13, display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ display:'inline-block', width:14, height:14, border:`2px solid ${C.navy}`, borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
                      AI 分析生成中...
                      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                    </div>
                  ) : (
                    <p style={{ fontSize:13, color:C.dark, lineHeight:1.8, margin:0 }}>{testResult}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 說明：Cron 如何使用這些 Prompt */}
          <div style={{ marginTop:14, background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:8, padding:'12px 16px', fontSize:12, color:'#92400E' }}>
            <strong>⚙️ 自動化流程說明：</strong><br/>
            每天早上 6 點，Vercel Cron 自動：<br/>
            1. 讀取今日賽事資料（從 The Odds API + Sports APIs）<br/>
            2. 將變數填入這裡的 Prompt 模板<br/>
            3. 呼叫 Gemini API 生成中文分析<br/>
            4. 存入 Firestore → 用戶打開網站直接看到 → 0 秒延遲
          </div>
        </div>
      </div>
    </div>
  );
}
