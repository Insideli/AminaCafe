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

// 🔥 СОБИРАЕМ ЗАКАЗ ДЛЯ ПАЛОМЫ
export function buildPalomaOrder(internalOrder) {
  // 1. Проходимся по всей корзине и вытаскиваем paloma_id каждого блюда
  const goodsList = (internalOrder.cartItems || []).map(item => {
    return {
      object_id: item.paloma_id || 0, // Тот самый ID, чтобы Палома узнала блюдо!
      price: item.price,
      quantity: item.quantity
    };
  });

  // 2. Формируем правильный пакет данных
  return {
    order_id: internalOrder.id,           // Номер заказа
    table_name: internalOrder.tableName,  // Стол (например, "Стол 1 (Белый зал)")
    order_type: internalOrder.orderType,  // Тип (в зале, доставка, навынос)
    
    customer_name: internalOrder.customerName || "Гость", // Имя гостя
    customer_phone: internalOrder.phone,                  // Номер или Email гостя
    waiter_name: internalOrder.waiterName || "Сайт",      // Кто пробил (Официант или сам гость)

    pay_method: internalOrder.payMethod || "kaspi",       // Способ оплаты
    total_sum: internalOrder.total,                       // Итоговая сумма

    goods: goodsList, // 🍔 Отправляем список еды!
    
    comment: internalOrder.deliveryAddress || "Заказ с сайта" // Адрес или комментарий
  };
}
