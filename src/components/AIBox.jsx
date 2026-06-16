import { useEffect, useState } from 'react';
import { getAIAnalysis } from '../services/aiAnalysis';

export default function AIBox({ prompt, type = 'general', title = 'AI 分析', autoLoad = false }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = async () => {
    if (loaded || loading) return;
    setLoading(true);
    const result = await getAIAnalysis(prompt, type);
    setText(result);
    setLoading(false);
    setLoaded(true);
  };

  // autoLoad on first render / when prompt changes
  useEffect(() => {
    if (autoLoad) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad, prompt, type]);

  const C = { navy: '#0F3460', muted: '#6B7280', border: '#D4D8DF', bg: '#F6F7FA' };

  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', background: C.bg, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.border}` }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.navy }}>🤖 {title}</span>
        <span style={{ fontSize: 10, color: C.muted, background: '#EFF6FF', padding: '2px 8px', borderRadius: 3 }}>AI 分析引擎</span>
      </div>
      <div style={{ padding: '14px 16px', minHeight: 60 }}>
        {!loaded && !loading && (
          <button onClick={load} style={{ background: C.navy, color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
            生成 AI 分析
          </button>
        )}
        {loading && (
          <div style={{ color: C.muted, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-block', width: 14, height: 14, border: `2px solid ${C.navy}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
            AI 分析中...
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}
        {loaded && (
          <p style={{ fontSize: 13, color: '#1F2937', lineHeight: 1.8, margin: 0 }}>{text}</p>
        )}
      </div>
    </div>
  );
}
