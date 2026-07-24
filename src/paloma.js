// paloma.js — интеграция с Paloma365
const PALOMA_HOST = 'https://api.paloma365.com';
const AUTHKEY = 'bd83f267a42bcdcf05e1e9de4cfcc65ccafeamina9675';
const POINT_ID = 1;

export async function fetchPalomaMenu() {
  const url = `${PALOMA_HOST}/company/api/index.php?class=Tester&method=menu&point_id=${POINT_ID}&authkey=${AUTHKEY}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Не удалось загрузить меню из Paloma');
  return response.json();
}

export async function sendOrderToPaloma(orderPayload) {
  const url = `${PALOMA_HOST}/company/api/index.php?class=Tester&method=order&point_id=${POINT_ID}&authkey=${AUTHKEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderPayload),
  });
  if (!response.ok) throw new Error('Не удалось отправить заказ в Paloma');
  return response.json();
}

export function buildPalomaOrder(internalOrder) {
  const orderItems = (internalOrder.cartItems || []).map(item => ({
    object_id: item.paloma_id || 0,
    name: item.name,
    count: item.quantity,
    price: item.price,
    modifications: [],
    complex_items: [],
  }));
  return {
    order_id: internalOrder.id,
    date: new Date().toISOString().slice(0, 19).replace('T', ' '),
    name: internalOrder.customerName || 'Гость',
    phone: internalOrder.phone || '+70000000000',
    comment: internalOrder.deliveryAddress || '',
    point_id: POINT_ID,
    total_price: internalOrder.total,
    discount_amount: 0,
    delivery_type: internalOrder.orderType === 'delivery' ? 2 : 1,
    is_cash: internalOrder.payMethod === 'cash',
    is_payed: false,
    tip_amount: 0,
    order_items: orderItems,
  };
}
