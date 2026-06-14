// 依照運動類型呼叫對應的免費API
export default async function handler(req, res) {
  const { name, sport } = req.query;
  if (!name) return res.status(400).json({ error: 'Missing player name' });

  try {
    let playerData = null;

    if (sport === 'NBA') {
      const r = await fetch(`https://api.balldontlie.io/v1/players?search=${encodeURIComponent(name)}&per_page=5`);
      const data = await r.json();
      playerData = data.data?.[0] || null;
    }

    if (sport === 'MLB') {
      const r = await fetch(`https://statsapi.mlb.com/api/v1/people/search?names=${encodeURIComponent(name)}&sportId=1`);
      const data = await r.json();
      playerData = data.people?.[0] || null;
    }

    if (sport === 'LOL' || sport === 'Esports') {
      const r = await fetch(`https://liquipedia.net/leagueoflegends/api.php?action=opensearch&search=${encodeURIComponent(name)}&limit=5&format=json&origin=*`);
      const data = await r.json();
      playerData = { name: data[1]?.[0], url: data[3]?.[0] };
    }

    res.json({ playerData, sport });
  } catch (err) {
    res.status(500).json({ error: '選手搜尋暫時無法使用' });
  }
}
