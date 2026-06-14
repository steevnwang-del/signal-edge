import { useState } from 'react';

const C = { navy:'#0F3460', white:'#FFFFFF', dark:'#111827', muted:'#6B7280', border:'#D4D8DF', borderLight:'#E9EBF0', bg:'#ECEEF2', amber:'#D97706', win:'#059669', loss:'#DC2626', panelAlt:'#F6F7FA' };

const inputStyle = { background:C.panelAlt, border:`1px solid ${C.border}`, borderRadius:6, padding:'8px 12px', fontSize:13, color:C.dark, outline:'none', width:'100%', boxSizing:'border-box' };
const Label = ({ children }) => <div style={{ fontSize:11, color:C.muted, fontWeight:700, letterSpacing:0.5, marginBottom:6, textTransform:'uppercase' }}>{children}</div>;
const Toggle = ({ val, onChange, label, desc }) => (
  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'12px 0', borderBottom:`1px solid ${C.borderLight}` }}>
    <div>
      <div style={{ fontSize:13, color:C.dark, fontWeight:600 }}>{label}</div>
      {desc && <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{desc}</div>}
    </div>
    <div onClick={() => onChange(!val)} style={{ width:40, height:22, borderRadius:11, cursor:'pointer', background:val?C.navy:C.border, position:'relative', transition:'background 0.2s', flexShrink:0, marginLeft:12 }}>
      <div style={{ position:'absolute', top:3, left:val?21:3, width:16, height:16, borderRadius:'50%', background:C.white, transition:'left 0.2s' }}/>
    </div>
  </div>
);

// 預設 Prompt 模板
const DEFAULT_PROMPTS = {
  soccer: `你是專業足球數據分析師。根據以下數據，用繁體中文生成200字以內的賽前分析報告。
以數據為基礎，客觀描述兩隊實力差距、關鍵因素。不做任何投注建議，不保證結果。

賽事：{home} vs {away}
主隊近況：{homeForm}，場均進球：{homeGoals}
客隊近況：{awayForm}，場均進球：{awayGoals}
模型預測主隊勝率：{homeWinProb}%`,

  basketball: `你是專業籃球數據分析師。根據以下數據，用繁體中文生成200字以內的賽前分析。
以數據說話，不做任何投注建議。

賽事：{home} vs {away}
主隊：近況{homeForm}，場均得分{homeOffense}，場均失分{homeDefense}
客隊：近況{awayForm}，場均得分{awayOffense}，場均失分{awayDefense}
傷病：{injuries}`,

  esports: `你是專業電競數據分析師。根據以下數據，用繁體中文生成200字以內的賽前分析。
不做任何投注建議。

賽事：{home} vs {away}
{home}近況：{homeForm}，勝率：{homeWinRate}%
{away}近況：{awayForm}，勝率：{awayWinRate}%`,
};

export default function AutoAnalysisSettings() {
  const [settings, setSettings] = useState({
    enabled: true,
    scheduleHour: 6,
    requireReview: false,
    autoOnCreate: true,
    generateForMatches: true,
    generateForPlayers: false,
    generateForTeams: true,
    prompts: DEFAULT_PROMPTS,
  });
  const [activePrompt, setActivePrompt] = useState('soccer');
  const [testResult, setTestResult] = useState('');
  const [testing, setTesting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [manualRunning, setManualRunning] = useState(false);

  const S = (k, v) => setSettings(p => ({ ...p, [k]: v }));

  // 模擬手動觸發（實際串接 Firebase 後呼叫 Cloud Function）
  const manualTrigger = async () => {
    setManualRunning(true);
    await new Promise(r => setTimeout(r, 2000));
    setManualRunning(false);
    alert('✅ 已手動觸發分析生成，約1-2分鐘後更新完成');
  };

  // 測試 Prompt
  const testPrompt = async () => {
    setTesting(true);
    const mockData = {
      soccer: '巴西 vs 摩洛哥\n主隊近況：W W D W W，場均進球：2.1\n客隊近況：W L W W D，場均進球：0.8\n模型預測主隊勝率：67%',
    };
    try {
      const r = await fetch('/api/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: settings.prompts[activePrompt].replace(/{[^}]+}/g, '（測試數據）'), type: 'match' }),
      });
      const d = await r.json();
      setTestResult(d.analysis || '測試失敗');
    } catch { setTestResult('無法連接 AI 服務'); }
    setTesting(false);
  };

  return (
    <div style={{ maxWidth:800 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>

        {/* 自動化設定 */}
        <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:10, padding:'18px 20px' }}>
          <div style={{ fontSize:14, fontWeight:700, color:C.dark, marginBottom:16 }}>🤖 自動化設定</div>
          <Toggle val={settings.enabled} onChange={v=>S('enabled',v)} label="啟用自動分析生成" desc="每天定時自動生成所有賽事分析"/>
          <Toggle val={settings.autoOnCreate} onChange={v=>S('autoOnCreate',v)} label="新賽事自動觸發" desc="Admin 新增賽事時立即生成分析"/>
          <Toggle val={settings.requireReview} onChange={v=>S('requireReview',v)} label="發布前需要審核" desc="生成後需 Admin 確認才對外顯示"/>

          <div style={{ marginTop:14 }}>
            <Label>每日生成時間（台灣時間）</Label>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <select value={settings.scheduleHour} onChange={e=>S('scheduleHour',+e.target.value)} style={{ ...inputStyle, width:'auto' }}>
                {[0,2,4,6,8,10].map(h => <option key={h} value={h}>早上 {h===0?'00':h} 點</option>)}
              </select>
              <span style={{ fontSize:12, color:C.muted }}>UTC {settings.scheduleHour-8 < 0 ? settings.scheduleHour-8+24 : settings.scheduleHour-8}:00</span>
            </div>
          </div>

          <div style={{ marginTop:14 }}>
            <Label>自動生成範圍</Label>
            {[['generateForMatches','賽事分析'],['generateForTeams','隊伍分析'],['generateForPlayers','選手分析（消耗較多額度）']].map(([k,l]) => (
              <div key={k} style={{ display:'flex', gap:8, alignItems:'center', marginBottom:6 }}>
                <input type="checkbox" checked={settings[k]} onChange={e=>S(k,e.target.checked)} style={{ width:14, height:14 }}/>
                <span style={{ fontSize:13, color:C.dark }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* API 用量預估 */}
        <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:10, padding:'18px 20px' }}>
          <div style={{ fontSize:14, fontWeight:700, color:C.dark, marginBottom:16 }}>📊 Gemini API 用量預估</div>
          {[
            { label:'今日賽事', count: 8, perDay: 8 },
            { label:'隊伍分析（週更）', count: 4, perDay: 0.6 },
            { label:'選手分析（月更）', count: 0, perDay: 0 },
          ].map(s => (
            <div key={s.label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:`1px solid ${C.borderLight}` }}>
              <span style={{ fontSize:12, color:C.muted }}>{s.label}</span>
              <span style={{ fontSize:12, fontWeight:700, color:C.dark, fontFamily:'ui-monospace,monospace' }}>{s.perDay.toFixed(1)}/天</span>
            </div>
          ))}
          <div style={{ marginTop:10, padding:'10px 12px', background:'#ECFDF5', border:'1px solid #A7F3D0', borderRadius:6 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#065F46', marginBottom:2 }}>每日預估用量：~9 次</div>
            <div style={{ fontSize:11, color:'#065F46' }}>免費額度：1,500 次/天 → 剩餘 1,491 次</div>
          </div>

          {/* 手動觸發 */}
          <div style={{ marginTop:16, borderTop:`1px solid ${C.borderLight}`, paddingTop:14 }}>
            <div style={{ fontSize:12, fontWeight:700, color:C.dark, marginBottom:8 }}>手動觸發（緊急更新）</div>
            <button onClick={manualTrigger} disabled={manualRunning} style={{ width:'100%', background:manualRunning?C.muted:C.navy, color:C.white, border:'none', padding:'9px', borderRadius:7, cursor:manualRunning?'default':'pointer', fontSize:13, fontWeight:700 }}>
              {manualRunning ? '⏳ 生成中...' : '▶ 立即重新生成所有分析'}
            </button>
            <div style={{ fontSize:10, color:C.muted, marginTop:5, textAlign:'center' }}>適用於重大傷病/異動消息後</div>
          </div>
        </div>
      </div>

      {/* Prompt 模板管理 */}
      <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:10, padding:'18px 20px', marginBottom:16 }}>
        <div style={{ fontSize:14, fontWeight:700, color:C.dark, marginBottom:16 }}>📝 Prompt 模板管理</div>
        <div style={{ display:'flex', gap:0, border:`1px solid ${C.border}`, borderRadius:6, overflow:'hidden', marginBottom:14, width:'fit-content' }}>
          {[['soccer','⚽ 足球/世界杯'],['basketball','🏀 籃球'],['esports','🎮 電競']].map(([v,l]) => (
            <button key={v} onClick={()=>setActivePrompt(v)} style={{ padding:'7px 16px', border:'none', cursor:'pointer', background:activePrompt===v?C.navy:'transparent', color:activePrompt===v?C.white:C.muted, fontSize:12, fontWeight:700, borderRight:`1px solid ${C.borderLight}` }}>{l}</button>
          ))}
        </div>

        <Label>Prompt 模板（{activePrompt}）</Label>
        <div style={{ fontSize:10, color:C.muted, marginBottom:6 }}>
          可用變數：{'{home}'} {'{away}'} {'{homeForm}'} {'{awayForm}'} {'{homeWinProb}'} 等
        </div>
        <textarea
          value={settings.prompts[activePrompt]}
          onChange={e => setSettings(p => ({ ...p, prompts: { ...p.prompts, [activePrompt]: e.target.value } }))}
          style={{ ...inputStyle, height:160, resize:'vertical', fontFamily:'ui-monospace,monospace', fontSize:12, lineHeight:1.6 }}
        />

        <div style={{ display:'flex', gap:10, marginTop:12 }}>
          <button onClick={testPrompt} disabled={testing} style={{ background:'transparent', border:`1px solid ${C.navy}`, color:C.navy, padding:'8px 16px', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:700 }}>
            {testing ? '測試中...' : '🧪 測試這個 Prompt'}
          </button>
          <button onClick={() => { setSaved(true); setTimeout(()=>setSaved(false),2000); }} style={{ background:C.win, color:C.white, border:'none', padding:'8px 20px', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:700 }}>
            {saved ? '✓ 已儲存' : '儲存設定'}
          </button>
          <button onClick={() => setSettings(p => ({...p, prompts:{...p.prompts,[activePrompt]:DEFAULT_PROMPTS[activePrompt]}}))} style={{ background:'transparent', border:`1px solid ${C.border}`, color:C.muted, padding:'8px 14px', borderRadius:6, cursor:'pointer', fontSize:12 }}>
            重置預設
          </button>
        </div>

        {testResult && (
          <div style={{ marginTop:12, padding:'12px 14px', background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:6 }}>
            <div style={{ fontSize:10, fontWeight:700, color:C.navy, marginBottom:6 }}>🤖 AI 生成結果預覽</div>
            <p style={{ fontSize:13, color:C.dark, lineHeight:1.8, margin:0 }}>{testResult}</p>
          </div>
        )}
      </div>

      {/* 生成紀錄 */}
      <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:10, padding:'18px 20px' }}>
        <div style={{ fontSize:14, fontWeight:700, color:C.dark, marginBottom:14 }}>📋 最近生成紀錄</div>
        {[
          { time:'今日 06:00', count:8, status:'success', note:'8 場賽事分析已自動生成' },
          { time:'昨日 06:00', count:6, status:'success', note:'6 場賽事分析已自動生成' },
          { time:'昨日 14:32', count:2, status:'manual', note:'手動觸發：世界杯 2 場傷病更新' },
          { time:'前日 06:00', count:9, status:'success', note:'9 場賽事分析已自動生成' },
        ].map((r,i) => (
          <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom:`1px solid ${C.borderLight}` }}>
            <div>
              <span style={{ fontSize:11, fontFamily:'ui-monospace,monospace', color:C.muted, marginRight:10 }}>{r.time}</span>
              <span style={{ fontSize:12, color:C.dark }}>{r.note}</span>
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <span style={{ fontSize:10, padding:'2px 7px', borderRadius:3, background:r.status==='success'?'#ECFDF5':r.status==='manual'?'#EFF6FF':'#FEF2F2', color:r.status==='success'?C.win:r.status==='manual'?C.navy:C.loss, fontWeight:700 }}>
                {r.status==='success'?'自動':r.status==='manual'?'手動':'失敗'}
              </span>
              <span style={{ fontSize:11, fontWeight:700, color:C.dark, fontFamily:'ui-monospace,monospace' }}>{r.count} 份</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
