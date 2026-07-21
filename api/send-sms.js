export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  // 🔥 ВСТАВЬТЕ СЮДА ВАШ API-КЛЮЧ ИЗ MOBIZON
  const API_KEY = 'ВАШ_API_КЛЮЧ_ИЗ_MOBIZON';

  const code = Math.floor(1000 + Math.random() * 9000).toString();

  const mobizonUrl = `https://api.mobizon.kz/service/message/sendsms?apiKey=${API_KEY}&recipient=${phone}&text=Ваш%20код%20подтверждения%3A%20${code}`;

  try {
    const response = await fetch(mobizonUrl);
    const data = await response.json();

    if (data.code === 0) {
      return res.status(200).json({ success: true, code });
    } else {
      return res.status(500).json({ success: false, error: data.message || 'SMS sending failed' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}