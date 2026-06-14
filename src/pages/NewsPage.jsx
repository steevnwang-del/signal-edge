import { useState, useEffect } from 'react';
import AIBox from '../components/AIBox';

const C = { navy:'#0F3460', white:'#FFFFFF', dark:'#111827', muted:'#6B7280', border:'#D4D8DF', bg:'#ECEEF2', amber:'#D97706', win:'#059669', panelAlt:'#F6F7FA' };

// Mock 英文新聞 - 實際串接 RSS/NewsAPI 後替換
const EN_NEWS = [
  { id:1, source:'ESPN', sport:'NBA', title:'Celtics crush Heat in Game 5, advance to conference finals', time:'2h ago', url:'#',
    snippet:'The Boston Celtics dominated the Miami Heat 108-84 in Game 5, with Jayson Tatum scoring 32 points and 9 rebounds. Jaylen Brown added 24 points as Boston advanced to the Eastern Conference Finals for the third straight year.' },
  { id:2, source:'The Athletic', sport:'世界杯', title:'Brazil name final World Cup squad: Neymar out, Vinicius leads attack', time:'4h ago', url:'#',
    snippet:'Brazil have announced their final 26-man squad for the 2026 World Cup. Neymar is absent after failing to recover from his knee injury. Vinicius Jr will lead the attack alongside Rodrygo and Raphinha. Endrick also makes the cut as a wildcard selection.' },
  { id:3, source:'Dot Esports', sport:'LOL', title:'T1 defeats Gen.G 3-1 to claim LCK Spring title', time:'6h ago', url:'#',
    snippet:"T1 swept Gen.G in the LCK Spring Finals, winning 3-1. Faker picked up his 12th domestic title, continuing his legendary career. Gumayusi was named MVP of the series with an average KDA of 8.4 across the series." },
  { id:4, source:'MLB.com', sport:'MLB', title:"Ohtani hits two-run homer as Dodgers extend win streak to 8 games", time:'8h ago', url:'#',
    snippet:"Shohei Ohtani went 3-for-4 with a two-run home run, his 28th of the season, as the Los Angeles Dodgers defeated the New York Yankees 7-3. The Dodgers have now won 8 consecutive games and hold the best record in baseball at 52-22." },
];

const SportBadge = ({ sport }) => {
  const colors = { NBA:'#C9082A', 世界杯:'#1B5E20', LOL:'#C89B3C', MLB:'#002D72' };
  const c = colors[sport] || C.navy;
  return <span style={{ background:c+'18', color:c, fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:3 }}>{sport}</span>;
};

export default function NewsPage() {
  const [filter, setFilter] = useState('全部');
  const [translating, setTranslating] = useState({});
  const [translated, setTranslated] = useState({});

  const sports = ['全部','NBA','世界杯','LOL','MLB'];
  const filtered = EN_NEWS.filter(n => filter === '全部' || n.sport === filter);

  const translate = async (news) => {
    if (translated[news.id] || translating[news.id]) return;
    setTranslating(p => ({ ...p, [news.id]: true }));
    try {
      const r = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `標題：${news.title}\n內容：${news.snippet}`, type: 'news' }),
      });
      const d = await r.json();
      setTranslated(p => ({ ...p, [news.id]: d.analysis }));
    } catch { setTranslated(p => ({ ...p, [news.id]: '翻譯失敗，請稍後再試' })); }
    setTranslating(p => ({ ...p, [news.id]: false }));
  };

  return (
    <div style={{ background:C.bg, minHeight:'100vh' }}>
      <div style={{ maxWidth:1000, margin:'0 auto', padding:'28px 20px' }}>
        <div style={{ marginBottom:22 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:1.5, color:C.amber, marginBottom:6, textTransform:'uppercase' }}>新聞中心</div>
          <h2 style={{ fontSize:26, fontWeight:900, color:C.dark, margin:'0 0 6px' }}>英文媒體 → AI 中文摘要</h2>
          <p style={{ color:C.muted, fontSize:13, margin:0 }}>整合 ESPN、The Athletic、Dot Esports 等英文平台，AI 即時翻譯整理</p>
        </div>

        <div style={{ display:'flex', border:`1px solid ${C.border}`, borderRadius:8, overflow:'hidden', background:C.white, marginBottom:20, width:'fit-content' }}>
          {sports.map(s => (
            <button key={s} onClick={()=>setFilter(s)} style={{ padding:'8px 18px', border:'none', cursor:'pointer', background:filter===s?C.navy:'transparent', color:filter===s?C.white:C.muted, fontSize:12, fontWeight:700, borderRight:`1px solid #E9EBF0` }}>{s}</button>
          ))}
        </div>

        <div style={{ display:'grid', gap:14 }}>
          {filtered.map(news => (
            <div key={news.id} style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
              <div style={{ padding:'16px 18px' }}>
                <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:10, flexWrap:'wrap' }}>
                  <SportBadge sport={news.sport}/>
                  <span style={{ fontSize:11, fontWeight:700, color:C.muted, background:C.panelAlt, padding:'2px 8px', borderRadius:3 }}>{news.source}</span>
                  <span style={{ fontSize:11, color:C.muted }}>{news.time}</span>
                </div>
                <h3 style={{ fontSize:14, fontWeight:700, color:C.dark, margin:'0 0 8px', lineHeight:1.4 }}>{news.title}</h3>
                <p style={{ fontSize:12, color:C.muted, margin:'0 0 12px', lineHeight:1.6 }}>{news.snippet}</p>

                {!translated[news.id] && (
                  <button onClick={()=>translate(news)} disabled={translating[news.id]}
                    style={{ background:'transparent', border:`1px solid ${C.navy}`, color:C.navy, padding:'6px 14px', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:700, opacity:translating[news.id]?0.6:1 }}>
                    {translating[news.id] ? 'AI 翻譯中...' : '🤖 AI 中文摘要'}
                  </button>
                )}

                {translated[news.id] && (
                  <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:6, padding:'12px 14px', marginTop:8 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:C.navy, marginBottom:6, letterSpacing:0.5 }}>🤖 AI 中文摘要</div>
                    <p style={{ fontSize:13, color:C.dark, lineHeight:1.8, margin:0 }}>{translated[news.id]}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:16, padding:'12px 16px', background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:8, fontSize:12, color:C.navy }}>
          📰 新聞來源：ESPN、The Athletic、Dot Esports、MLB.com · AI 翻譯僅供參考，版權屬原始媒體所有
        </div>
      </div>
    </div>
  );
}
