const DEFAULT = {
  marqueeEnabled: true,
  marqueeText: '🏆 2026世界杯分析進行中｜今日已發出3個分析報告｜本月模型命中率 68.4%｜使用邀請碼 VIP2026 立即升級',
  marqueeSpeed: 'normal',
  announcementEnabled: true,
  announcementText: '世界杯特別活動：6月份新加入用戶首月VIP免費！',
  announcementType: 'info',
  ads: [],
};

export default function SiteMarquee({ settings = {} }) {
  const s = { ...DEFAULT, ...settings };
  const speed = s.marqueeSpeed==='fast'?15:s.marqueeSpeed==='slow'?40:25;
  const AC = { info:{ bg:'#EFF6FF', color:'#1D4ED8', border:'#BFDBFE' }, warning:{ bg:'#FFFBEB', color:'#92400E', border:'#FDE68A' }, success:{ bg:'#ECFDF5', color:'#065F46', border:'#A7F3D0' } };
  const ac = AC[s.announcementType] || AC.info;

  return (
    <>
      {s.marqueeEnabled && s.marqueeText && (
        <div style={{ background:'#0F3460', color:'#fff', padding:'5px 0', overflow:'hidden', fontSize:12 }}>
          <div style={{ whiteSpace:'nowrap', display:'inline-block', animation:`mq ${speed}s linear infinite` }}>
            &nbsp;&nbsp;&nbsp;{s.marqueeText}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{s.marqueeText}&nbsp;&nbsp;&nbsp;
          </div>
          <style>{`@keyframes mq{from{transform:translateX(100vw)}to{transform:translateX(-100%)}}`}</style>
        </div>
      )}
      {s.announcementEnabled && s.announcementText && (
        <div style={{ background:ac.bg, borderBottom:`1px solid ${ac.border}`, padding:'7px 20px', fontSize:13, color:ac.color, fontWeight:600, textAlign:'center' }}>
          📢 {s.announcementText}
        </div>
      )}
      {s.ads?.filter(a=>a.enabled&&a.text).map((ad,i) => (
        <div key={i} onClick={()=>ad.url&&window.open(ad.url,'_blank')}
          style={{ background:'#FFFBEB', borderBottom:'1px solid #FDE68A', padding:'6px 20px', fontSize:12, color:'#92400E', textAlign:'center', cursor:ad.url?'pointer':'default' }}>
          📢 {ad.text}{ad.url&&<span style={{ marginLeft:8, textDecoration:'underline' }}>了解更多 →</span>}
        </div>
      ))}
    </>
  );
}
