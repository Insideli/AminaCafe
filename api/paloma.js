// api/paloma.js
const PALOMA_HOST = 'https://api.paloma365.com';
const AUTHKEY = 'bd83f267a42bcdcf05e1e9de4cfcc65ccafeamina9675';
const POINT_ID = 1;

export default async function handler(req, res) {
  // Разрешаем CORS для всех запросов
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { method, endpoint } = req.query; // method = 'order' или 'menu'
  const targetUrl = `${PALOMA_HOST}/company/api/index.php?class=Tester&method=${method}&point_id=${POINT_ID}&authkey=${AUTHKEY}`;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
      body: req.method === 'POST' ? JSON.stringify(req.body) : undefined,
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
