/**
 * Polymarket 預測市場（完全免費）
 * actions: getMarkets, getByKeyword, getSportsMarkets
 */
const BASE = 'https://gamma-api.polymarket.com';

export default {
  async getSportsMarkets({ limit = 20 }, env) {
    const r = await fetch(`${BASE}/markets?limit=${limit}&active=true&closed=false&tag_slug=sports`);
    const data = await r.json();
    return { markets: data || [] };
  },

  async getByKeyword({ keyword, limit = 5 }, env) {
    const r = await fetch(`${BASE}/markets?limit=${limit}&active=true&_c=${encodeURIComponent(keyword)}`);
    const data = await r.json();
    return { markets: (data||[]).map(m => ({
      id: m.id, title: m.question,
      yesProb: m.outcomePrices ? parseFloat(m.outcomePrices[0])*100 : null,
      noProb:  m.outcomePrices ? parseFloat(m.outcomePrices[1])*100 : null,
      volume: m.volume, url: `https://polymarket.com/event/${m.slug}`,
    })) };
  },
};
