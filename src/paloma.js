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

// 🔥 СОБИРАЕМ ЗАКАЗ СТРОГО ПО ДОКУМЕНТАЦИИ PALOMA365
export function buildPalomaOrder(internalOrder) {
  // 1. Формируем список товаров (в Паломе он называется order_items)
  const itemsList = (internalOrder.cartItems || []).map(item => {
    return {
      object_id: item.paloma_id || 0, // ID блюда из базы
      name: item.name,                // Название
      count: item.quantity,           // Количество (в Паломе это count!)
      price: item.price,              // Цена
      modifications: [],              // Обязательные пустые массивы по документации
      complex_items: []
    };
  });

  // Палома требует дату в строгом формате: YYYY-MM-DD HH:mm:ss
  const now = new Date();
  const formattedDate = now.getFullYear() + '-' + 
    String(now.getMonth() + 1).padStart(2, '0') + '-' + 
    String(now.getDate()).padStart(2, '0') + ' ' + 
    String(now.getHours()).padStart(2, '0') + ':' + 
    String(now.getMinutes()).padStart(2, '0') + ':' + 
    String(now.getSeconds()).padStart(2, '0');

  // Определяем тип доставки (1 - доставка, 2 - навынос/в зале)
  const deliveryType = internalOrder.orderType === 'delivery' ? 1 : 2;

  // 2. Формируем финальный пакет данных
  return {
    order_id: internalOrder.id.toString(), // Уникальный ID заказа
    date: formattedDate,                   // Дата заказа
    name: internalOrder.customerName || "Гость", // Имя клиента
    phone: internalOrder.phone || "+70000000000", // Телефон
    comment: internalOrder.deliveryAddress || internalOrder.tableName, // Куда нести
    
    point_id: 1,                           // ID вашей точки
    total_price: internalOrder.total,      // Итоговая сумма (total_price!)
    discount_amount: 0,
    delivery_type: deliveryType,           
    
    is_cash: internalOrder.payMethod === 'cash',   // Оплата наличными?
    is_payed: internalOrder.payMethod === 'kaspi', // Уже оплачено каспи?
    tip_amount: 0,
    
    order_items: itemsList                 // Список еды (order_items!)
  };
}
