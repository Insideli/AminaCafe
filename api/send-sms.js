// api/send-sms.js
export default async function handler(req, res) {
  // Разрешаем запросы с твоего сайта
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phone, code } = req.body;

  if (!phone || !code) {
    return res.status(400).json({ error: 'Phone and code are required' });
  }

  // Твои данные от SMSAERO
  const SMSAERO_API_KEY = 'MiYs7sVvMtxJCtWZuGBQbLRD7Cu';
  const SMSAERO_EMAIL = 'abylaikhan.799@gmail.com'; // Убедись, что этот email совпадает с тем, что в кабинете

  try {
    const response = await fetch(`https://gateway.smsaero.ru/v2/sms/send`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${SMSAERO_EMAIL}:${SMSAERO_API_KEY}`).toString('base64')}`
      },
      body: JSON.stringify({
        number: phone,
        text: `Ваш код подтверждения Amina: ${code}`,
        sign: 'SMS Aero',
        channel: 'SMS'
      })
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
