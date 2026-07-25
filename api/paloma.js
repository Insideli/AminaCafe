// api/paloma.js
const PALOMA_HOST = 'https://api.paloma365.com';
const POINT_ID = 1;

export default async function handler(req, res) {
  // Разрешаем CORS для всех запросов с вашего фронтенда
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Получаем параметр method (например, 'order' или 'menu')
  const { method } = req.query; 

  // БЕЗОПАСНОСТЬ: Берем ключ из настроек Vercel, а не из открытого кода
  // Если переменной нет (например, при локальном тесте), используем ваш ключ как запасной вариант
  const AUTHKEY = process.env.PALOMA_AUTHKEY || 'bd83f267a42bcdcf05e1e9de4cfcc65ccafeamina9675';

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
