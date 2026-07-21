export default async function handler(req, res) {
  // Разрешаем запросы с вашего сайта
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

  // 🔥 ВСТАВЬТЕ СЮДА ВАШ API-КЛЮЧ ИЗ MOBIZON (kz_...)
  const API_KEY = 'kze07ea62475a65bfa5e18f2391b5b81df1f60cd0c9cfd5d8720e5113d164c56d43d97';

  // Генерируем код
  const code = Math.floor(1000 + Math.random() * 9000).toString();

  // Правильный URL Mobizon
  const url = 'https://api.mobizon.kz/service/message/sendsms';

  // Формируем тело запроса в правильном формате (x-www-form-urlencoded)
  const params = new URLSearchParams();
  params.append('apiKey', API_KEY);
  params.append('recipient', phone);
  params.append('text', `Ваш код подтверждения: ${code}`);

  try {
    // Отправляем POST запрос
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });

    const data = await response.json();

    // Если код ответа 0, значит СМС отправлена успешно
    if (data.code === 0) {
      return res.status(200).json({ success: true, code });
    } else {
      // Если ошибка, возвращаем текст ошибки от Mobizon
      return res.status(500).json({ success: false, error: data.message || 'Ошибка отправки СМС от провайдера' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
