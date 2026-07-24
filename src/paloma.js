// src/paloma.js
const PROXY_URL = '/api/paloma'; // путь к вашей серверной функции

export async function fetchPalomaMenu() {
  const response = await fetch(`${PROXY_URL}?method=menu`);
  if (!response.ok) throw new Error('Не удалось загрузить меню');
  return response.json();
}

export async function sendOrderToPaloma(orderPayload) {
  const response = await fetch(`${PROXY_URL}?method=order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderPayload),
  });
  if (!response.ok) throw new Error('Не удалось отправить заказ');
  return response.json();
}

export function buildPalomaOrder(internalOrder) {
  // ... (без изменений, оставляем как было)
}
