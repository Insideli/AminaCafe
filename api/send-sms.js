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

  // ✅ Ваш ключ со скриншота уже вставлен сюда!
  const API_KEY = 'kze07ea62475a65bfa5e18f2391b5b81df1f60cd0c';

  // Генерируем 4-значный код
  const code = Math.floor(1000 + Math.random() * 9000).toString();

  // Правильный URL для POST запроса
  const url = 'https://api.mobizon.kz/service/message/sendsms';

  const params = new URLSearchParams();
  params.append('apiKey', API_KEY);
  params.append('recipient', phone);
  params.append('text', `Ваш код подтверждения Amina: ${code}`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });

    const data = await response.json();

    if (data.code === 0) {
      // ✅ Возвращаем код на клиент
      return res.status(200).json({ success: true, code });
    } else {
      return res.status(500).json({ success: false, error: data.message || 'Ошибка отправки СМС' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
