const codeStore = new Map();

export default async function handler(req, res) {
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

  const storedCode = codeStore.get(phone);

  if (storedCode === code) {
    codeStore.delete(phone);
    return res.status(200).json({ success: true });
  } else {
    return res.status(400).json({ success: false, error: 'Invalid code' });
  }
}