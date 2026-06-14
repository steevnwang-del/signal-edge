import { useState } from 'react';

const C = { navy:'#0F3460', white:'#FFFFFF', dark:'#111827', muted:'#6B7280', border:'#D4D8DF', borderLight:'#E9EBF0', bg:'#ECEEF2', amber:'#D97706', panelAlt:'#F6F7FA' };

// 新聞只顯示翻譯後的標題 + 點擊跳轉原文
const EN_NEWS = [
  { id:1, source:'ESPN', sport:'NBA', url:'https://www.espn.com',
    title:'Celtics crush Heat in Game 5, advance to conference finals',
    titleZH:'塞爾提克 Game 5 大勝熱火，挺進東區決賽', time:'2h ago', flag:'🏀' },
  { id:2, source:'The Athletic', sport:'世界杯', url:'https://theathletic.com',
    title:'Brazil name final World Cup squad: Neymar out, Vinicius leads attack',
    titleZH:'巴西世界杯最終名單出爐：內馬爾缺席，維尼修斯領銜進攻線', time:'4h ago', flag:'⚽' },
  { id:3, source:'Dot Esports', sport:'LOL', url:'https://dotesports.com',
    title:'T1 defeats Gen.G 3-1 to claim LCK Spring title',
    titleZH:'T1 以 3-1 擊敗 Gen.G 奪得 LCK 春季冠軍，Faker 再添一冠', time:'6h ago', flag:'🎮' },
  { id:4, source:'MLB.com', sport:'MLB', url:'https://www.mlb.com',
    title:"Ohtani hits two-run homer as Dodgers extend win streak to 8 games",
    titleZH:'大谷翔平轟出兩分砲，道奇連勝延伸至 8 場', time:'8h ago', flag:'⚾' },
  { id:5, source:'Guardian', sport:'世界杯', url:'https://www.theguardian.com/football',
    title:'France injury crisis deepens ahead of World Cup opener against Senegal',
    titleZH:'法國世界杯首戰前傷病危機加深，多名主力狀態存疑', time:'10h ago', flag:'⚽' },
  { id:6, source:'Valorant.gg', sport:'Valorant', url:'https://valorantgg.com',
    title:"Sentinels edge NRG in overtime thriller to lead VCT Americas standings",
    titleZH:'哨兵延長賽驚險擊敗 NRG，登上 VCT 美洲區積分榜首', time:'12h ago', flag:'🎮' },
];

const SPORT_C = { NBA:'#C9082A', 世界杯:'#1B5E20', LOL:'#C89B3C', MLB:'#002D72', Valorant:'#FF4655' };

export default function NewsPage() {
  const [filter, setFilter] = useState('全部');
  const sports = ['全部','世界杯','NBA','MLB','LOL','Valorant'];
  const filtered = EN_NEWS.filter(n => filter === '全部' || n.sport === filter);

  return (
    <div style={{ background:C.bg, minHeight:'100vh' }}>
      <div style={{ maxWidth:1000, margin:'0 auto', padding:'28px 20px' }}>
        <div style={{ marginBottom:22 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:1.5, color:C.amber, marginBottom:6, textTransform:'uppercase' }}>國際新聞</div>
          <h2 style={{ fontSize:26, fontWeight:900, color:C.dark, margin:'0 0 6px' }}>海外媒體速覽</h2>
          <p style={{ color:C.muted, fontSize:13, margin:0 }}>整合 ESPN、The Athletic、Dot Esports 等媒體 · 標題中文化 · 點擊查看原文</p>
        </div>

        <div style={{ display:'flex', border:`1px solid ${C.border}`, borderRadius:8, overflow:'hidden', background:C.white, marginBottom:20, width:'fit-content' }}>
          {sports.map(s => (
            <button key={s} onClick={()=>setFilter(s)} style={{ padding:'7px 16px', border:'none', cursor:'pointer', background:filter===s?C.navy:'transparent', color:filter===s?C.white:C.muted, fontSize:12, fontWeight:700, borderRight:`1px solid ${C.borderLight}` }}>{s}</button>
          ))}
        </div>

        <div style={{ display:'grid', gap:10 }}>
          {filtered.map(news => {
            const sc = SPORT_C[news.sport] || C.navy;
            return (
              <a key={news.id} href={news.url} target="_blank" rel="noopener noreferrer"
                style={{ textDecoration:'none', display:'block', background:C.white, border:`1px solid ${C.border}`, borderLeft:`4px solid ${sc}`, borderRadius:'0 9px 9px 0', padding:'14px 16px', transition:'box-shadow 0.15s' }}
                onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 16px rgba(15,52,96,0.08)'}
                onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
                <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8, flexWrap:'wrap' }}>
                  <span style={{ fontSize:14 }}>{news.flag}</span>
                  <span style={{ background:sc+'18', color:sc, fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:3 }}>{news.sport}</span>
                  <span style={{ fontSize:10, fontWeight:700, color:C.muted, background:C.panelAlt, padding:'2px 7px', borderRadius:3 }}>{news.source}</span>
                  <span style={{ fontSize:10, color:C.muted }}>{news.time}</span>
                  <span style={{ marginLeft:'auto', fontSize:10, color:C.navy }}>查看原文 →</span>
                </div>
                {/* 中文標題（主要） */}
                <div style={{ fontSize:15, fontWeight:700, color:C.dark, marginBottom:4, lineHeight:1.4 }}>{news.titleZH}</div>
                {/* 英文原標題（次要） */}
                <div style={{ fontSize:11, color:C.muted, lineHeight:1.4 }}>{news.title}</div>
              </a>
            );
          })}
        </div>

        <div style={{ marginTop:16, padding:'12px 16px', background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:8, fontSize:12, color:C.navy }}>
          📰 標題由系統整理，版權屬原始媒體所有 · 點擊後在新頁面開啟原文 · 建議使用瀏覽器翻譯功能閱讀全文
        </div>
      </div>
    </div>
  );
}
