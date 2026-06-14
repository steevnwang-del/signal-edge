// 百分位雷達圖 - 每個軸 = 聯盟百分位數 (0=最差, 100=最好)
export default function RadarChart({ stats = [], color = '#0F3460', size = 90, showLabels = true }) {
  const cx = size, cy = size, maxR = size * 0.68;
  const n = stats.length || 6;
  const startA = -Math.PI / 2;
  const pt = (i, r) => {
    const a = startA + (i / n) * 2 * Math.PI;
    return [cx + r * maxR * Math.cos(a), cy + r * maxR * Math.sin(a)];
  };
  const poly = (r) => stats.map((_, i) => pt(i, r).join(',')).join(' ');
  const dataPoly = stats.map((s, i) => pt(i, (s.value || 0) / 100).join(',')).join(' ');

  return (
    <svg width={size * 2} height={size * 2} viewBox={`0 0 ${size * 2} ${size * 2}`} style={{ display: 'block' }}>
      {/* League average reference line at 50% */}
      <polygon points={poly(0.5)} fill="none" stroke="#E9EBF0" strokeWidth="1.5" strokeDasharray="4,3"/>
      {[0.25, 0.75, 1].map(r => (
        <polygon key={r} points={poly(r)} fill="none" stroke="#E9EBF0" strokeWidth="0.8"/>
      ))}
      {stats.map((_, i) => { const [x,y]=pt(i,1); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#D4D8DF" strokeWidth="0.8"/>; })}
      <polygon points={dataPoly} fill={color} fillOpacity="0.22" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
      {stats.map((s, i) => { const [x,y]=pt(i,(s.value||0)/100); return <circle key={i} cx={x} cy={y} r="3.5" fill={color}/>; })}
      {showLabels && stats.map((s, i) => {
        const [lx,ly] = pt(i, 1.35);
        return <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="8.5" fill="#6B7280" fontWeight="700" fontFamily="system-ui,sans-serif">{s.label}</text>;
      })}
      {/* 50% label */}
      <text x={cx} y={cy - maxR * 0.5 - 4} textAnchor="middle" fontSize="7" fill="#9CA3AF">聯盟均值</text>
    </svg>
  );
}
