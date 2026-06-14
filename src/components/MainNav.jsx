import { useState } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';

const C = { navy:'#0F3460', white:'#FFFFFF', muted:'rgba(255,255,255,0.55)', border:'rgba(255,255,255,0.15)' };
const ROLE_LABELS = { guest:'訪客', free:'免費', vip:'VIP', agent:'代理', admin:'管理' };

const NAV_LINKS = [
  { id:'dashboard', label:'📊 賽事分析', roles:['free','vip','agent','admin'] },
  { id:'players',   label:'🏅 選手', roles:['free','vip','agent','admin','guest'] },
  { id:'teams',     label:'🏆 隊伍', roles:['free','vip','agent','admin','guest'] },
  { id:'calendar',  label:'📅 賽程', roles:['free','vip','agent','admin','guest'] },
  { id:'news',      label:'📰 新聞', roles:['free','vip','agent','admin'] },
  { id:'community', label:'👥 社群', roles:['free','vip','agent','admin'] },
  { id:'agent',     label:'💼 代理', roles:['agent'] },
  { id:'admin',     label:'⚙️ 後台', roles:['admin'] },
];

export default function MainNav({ page, role, setPage, setRole }) {
  const isMobile = useIsMobile();
  const [showMenu, setShowMenu] = useState(false);

  const links = NAV_LINKS.filter(l => l.roles.includes(role));
  const switchRole = (r) => {
    setRole(r); setShowMenu(false);
    const def = { guest:'landing', admin:'admin', agent:'agent' };
    setPage(def[r] || 'dashboard');
  };

  return (
    <>
      <nav style={{ background:C.navy, padding:`0 ${isMobile?'14px':'24px'}`, display:'flex', alignItems:'center', height:52, position:'sticky', top:0, zIndex:100, gap:8 }}>
        <div onClick={()=>setPage(role==='guest'?'landing':'dashboard')} style={{ fontWeight:900, fontSize:17, letterSpacing:-0.5, color:'#fff', cursor:'pointer', marginRight:8, flexShrink:0 }}>
          SIGNAL<span style={{ fontWeight:300, opacity:0.6 }}>EDGE</span>
        </div>

        {!isMobile && links.slice(0,5).map(l => (
          <button key={l.id} onClick={()=>setPage(l.id)} style={{ background:page===l.id?'rgba(255,255,255,0.15)':'transparent', border:'none', color:page===l.id?'#fff':C.muted, padding:'6px 12px', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:600, whiteSpace:'nowrap' }}>{l.label}</button>
        ))}

        <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
          {!isMobile && (
            <span style={{ fontSize:10, color:'rgba(255,255,255,0.35)', background:'rgba(255,255,255,0.08)', padding:'3px 8px', borderRadius:4 }}>
              [{ROLE_LABELS[role]}]
            </span>
          )}
          {isMobile && (
            <button onClick={()=>setShowMenu(!showMenu)} style={{ background:'rgba(255,255,255,0.12)', border:`1px solid ${C.border}`, color:'#fff', padding:'5px 10px', borderRadius:5, cursor:'pointer', fontSize:11, fontWeight:700 }}>
              {ROLE_LABELS[role]} ☰
            </button>
          )}
          {!isMobile && Object.keys(ROLE_LABELS).map(r => (
            <button key={r} onClick={()=>switchRole(r)} style={{ background:role===r?'rgba(255,255,255,0.2)':'transparent', border:`1px solid ${role===r?'rgba(255,255,255,0.4)':C.border}`, color:role===r?'#fff':'rgba(255,255,255,0.45)', padding:'3px 9px', borderRadius:4, cursor:'pointer', fontSize:10, fontWeight:600 }}>
              {ROLE_LABELS[r]}
            </button>
          ))}
        </div>
      </nav>

      {isMobile && showMenu && (
        <div style={{ position:'fixed', top:52, right:0, zIndex:200, background:C.navy, minWidth:180, boxShadow:'0 8px 24px rgba(0,0,0,0.3)', borderRadius:'0 0 0 12px' }}>
          {links.map(l => (
            <button key={l.id} onClick={()=>{setPage(l.id);setShowMenu(false);}} style={{ display:'block', width:'100%', textAlign:'left', background:page===l.id?'rgba(255,255,255,0.15)':'transparent', border:'none', borderBottom:'1px solid rgba(255,255,255,0.08)', color:page===l.id?'#fff':C.muted, padding:'11px 18px', cursor:'pointer', fontSize:13, fontWeight:page===l.id?700:400 }}>{l.label}</button>
          ))}
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.1)', padding:'8px 0' }}>
            {Object.entries(ROLE_LABELS).map(([r,l]) => (
              <button key={r} onClick={()=>switchRole(r)} style={{ display:'block', width:'100%', textAlign:'left', background:role===r?'rgba(255,255,255,0.12)':'transparent', border:'none', color:role===r?'#fff':'rgba(255,255,255,0.45)', padding:'8px 18px', cursor:'pointer', fontSize:11, fontWeight:role===r?700:400 }}>切換：{l}</button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
