// ── Mock Data ──────────────────────────────────────────────────────────────────
// 串接 Firebase 後，這裡的數據會被替換成真實資料庫數據
// 每個 signal 對應 Firestore signals/ collection 的一份文件

export const DATA_SOURCES = [
  { name: "Pinnacle", role: "銳盤基準", desc: "全球最精準賠率基準，職業賭徒首選", url: "pinnacle.com", type: "sharp" },
  { name: "Polymarket", role: "預測市場", desc: "去中心化預測市場，反映群眾智慧", url: "polymarket.com", type: "market" },
  { name: "Bet365", role: "軟盤比對", desc: "全球最大博彩公司，賠率偏差參考", url: "bet365.com", type: "soft" },
  { name: "Betfair Exchange", role: "交易所賠率", desc: "用戶對賭平台，最接近真實市場", url: "betfair.com", type: "exchange" },
  { name: "AI 分析引擎", role: "新聞分析", desc: "即時掃描傷病、陣容、天氣新聞，量化對賠率影響", url: "自研分析系統", type: "ai" },
  { name: "FIFA Stats API", role: "球隊數據", desc: "官方統計：控球率、xG、射門數", url: "fifa.com", type: "stats" },
];

export const SIGNALS = [
  {
    id: 1, sport: "世界杯", isWC: true,
    home: "巴西", away: "摩洛哥",
    flag: { home: "🇧🇷", away: "🇲🇦" },
    group: "C組", venue: "紐約·美洲競技場",
    time: "今日 08:00", matchTimestamp: Date.now() + 3600000,
    mode: "stable", strength: 4, accessLevel: "free",
    pick: "巴西勝或平", odds: 1.62, modelProb: 67.4, impliedProb: 61.7, ev: 9.2,
    status: "pending", tags: ["世界杯", "主力全員", "防守穩健"],
    brief: "巴西本屆全主力出陣，摩洛哥中場核心 Amrabat 傷勢存疑。",
    aiAnalysis: "巴西近7場國際賽 5勝2平，失球僅2球。摩洛哥 Amrabat 在訓練中扭傷，預計出場 50%。Polymarket 給予巴西不輸概率 74%，高於博彩隱含 61.7%，差距達 12.3%。",
    oddsData: [
      { book: "Pinnacle（銳盤基準）", odds: 1.60, implied: 62.5 },
      { book: "Bet365", odds: 1.62, implied: 61.7 },
      { book: "Betfair Exchange", odds: 1.63, implied: 61.3 },
    ],
    polymarket: { yes: 74, no: 26, volume: "US$1,240,000", trend: "快速上升" },
  },
  {
    id: 2, sport: "世界杯", isWC: true,
    home: "法國", away: "塞內加爾",
    flag: { home: "🇫🇷", away: "🇸🇳" },
    group: "I組", venue: "紐約·美洲競技場",
    time: "明日 03:00", matchTimestamp: Date.now() + 86400000,
    mode: "darkHorse", strength: 5, accessLevel: "vip",
    pick: "塞內加爾讓球勝或平", odds: 3.80, modelProb: 31.2, impliedProb: 26.3, ev: 18.6,
    status: "pending", tags: ["黑馬", "銳盤異動+14%", "Polymarket偏差"],
    brief: "法國多名主力傷缺，Polymarket 與博彩賠率出現本屆最大分歧。",
    aiAnalysis: "法國 Griezmann 膝傷未完全恢復。Pinnacle 開盤 4.20 已調整至 3.80，顯示大量銳利資金押注塞內加爾方向。",
    oddsData: [
      { book: "Pinnacle（銳盤基準）", odds: 3.80, implied: 26.3 },
      { book: "Bet365", odds: 3.90, implied: 25.6 },
    ],
    polymarket: { yes: 38, no: 62, volume: "US$892,000", trend: "急速上升" },
  },
  {
    id: 3, sport: "世界杯", isWC: true,
    home: "西班牙", away: "維德角",
    flag: { home: "🇪🇸", away: "🇨🇻" },
    group: "H組", venue: "亞特蘭大·梅賽德斯賓士球場",
    time: "昨日 01:00", matchTimestamp: Date.now() - 86400000,
    mode: "stable", strength: 5, accessLevel: "free",
    pick: "西班牙勝 (-1.5)", odds: 1.55, modelProb: 78.3, impliedProb: 64.5, ev: 21.4,
    status: "win", tags: ["世界杯", "已結算"],
    brief: "西班牙全主力出陣，控球戰術優勢明顯。",
    aiAnalysis: "西班牙 Yamal 首發，Pedri 傷癒出陣。控球率預測 68%，xG 差值 +2.1。",
    oddsData: [{ book: "Pinnacle（銳盤基準）", odds: 1.52, implied: 65.8 }],
    polymarket: { yes: 82, no: 18, volume: "US$2,180,000", trend: "已結算" },
    result: { score: "3-0", detail: "西班牙 3-0 大勝維德角，信號命中" },
  },
  {
    id: 4, sport: "NBA",
    home: "波士頓塞爾提克", away: "邁阿密熱火",
    flag: { home: "", away: "" },
    time: "今日 06:30", matchTimestamp: Date.now() + 7200000,
    mode: "stable", strength: 4, accessLevel: "free",
    pick: "塞爾提克 -3.5", odds: 1.91, modelProb: 61.2, impliedProb: 52.4, ev: 8.4,
    status: "pending", tags: ["主場優勢", "傷病異動"],
    brief: "塞爾提克本季主場勝率 71%，熱火 Butler 傷病存疑，讓分賠率相對市場低估。",
    aiAnalysis: "Butler 今早訓練缺席，影響熱火進攻效率約 12%。Polymarket 給予塞爾提克覆蓋率 63%。",
    oddsData: [
      { book: "Pinnacle（銳盤基準）", odds: 1.89, implied: 52.9 },
      { book: "Bet365", odds: 1.91, implied: 52.4 },
    ],
    polymarket: { yes: 63, no: 37, volume: "US$284,500", trend: "上升" },
  },
];

export const PLATFORM_STATS = {
  totalSignals: 247, winRate: 68.4,
  stableWinRate: 72.1, darkHorseWinRate: 58.3,
  monthSignals: 31, monthWins: 22, avgEV: 6.2,
};

export const MOCK_USERS = [
  { id: "U001", name: "王小明", email: "wang@gmail.com", phone: "0912-345-678", line: "@wangxm", role: "vip", joined: "2024-10-05", lastActive: "今日", sport: "足球", consent: true, source: "代理EDGE-A2841" },
  { id: "U002", name: "陳美華", email: "chen@gmail.com", phone: "0923-456-789", line: "@chenMH", role: "free", joined: "2024-11-12", lastActive: "2天前", sport: "NBA", consent: true, source: "自然流量" },
  { id: "U003", name: "李志豪", email: "lee@yahoo.com.tw", phone: "0934-567-890", line: "@leezh", role: "vip", joined: "2025-01-08", lastActive: "今日", sport: "MLB", consent: false, source: "代理EDGE-A2841" },
  { id: "U004", name: "張雅婷", email: "chang@outlook.com", phone: "0945-678-901", line: "@changyt", role: "agent", joined: "2024-09-20", lastActive: "今日", sport: "足球", consent: true, source: "邀請碼VIP001" },
];

export const AGENT_DATA = {
  refCode: "EDGE-A2841", downline: 23, activeDownline: 18,
  monthCommission: 4320, totalCommission: 18650,
  commissions: [
    { date: "06/12", user: "用戶 #1847", type: "VIP訂閱", amount: 240, level: "直屬" },
    { date: "06/11", user: "用戶 #2031", type: "VIP訂閱", amount: 240, level: "直屬" },
    { date: "06/10", user: "用戶 #0944", type: "VIP訂閱", amount: 120, level: "二級" },
  ],
};

export const AUTO_RESULTS = {
  1: { status: "win", result: { score: "2-0", detail: "巴西 2-0 勝摩洛哥，信號命中 ✓" } },
  2: { status: "win", result: { score: "2-1", detail: "塞內加爾 2-1 爆冷法國，黑馬命中 ✓" } },
  4: { status: "win", result: { score: "108-97", detail: "塞爾提克 108-97 勝熱火，讓分覆蓋 ✓" } },
};
