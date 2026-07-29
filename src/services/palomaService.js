import { palomaClient } from '../api/palomaClient.js';

function toNumber(value, fallback = 0) {
  const result = Number(value);
  return Number.isFinite(result) ? result : fallback;
}

function formatLocalDateTime(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');
  return [
    date.getFullYear(),
    '-',
    pad(date.getMonth() + 1),
    '-',
    pad(date.getDate()),
    ' ',
    pad(date.getHours()),
    ':',
    pad(date.getMinutes()),
    ':',
    pad(date.getSeconds()),
  ].join('');
}

function normalizePhone(value) {
  const raw = String(value || '').trim();
  if (!raw || raw.includes('@')) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) return '';
  return `+${digits}`;
}

function extractEmail(order) {
  const candidates = [order.email, order.phone];
  return String(candidates.find((value) => String(value || '').includes('@')) || '').trim();
}

function iconForCategory(name = '') {
  const value = name.toLowerCase();
  if (value.includes('салат')) return '🥗';
  if (value.includes('суп') || value.includes('первое')) return '🥣';
  if (value.includes('пицца')) return '🍕';
  if (value.includes('фаст') || value.includes('бургер') || value.includes('фри')) return '🍔';
  if (value.includes('напит') || value.includes('чай') || value.includes('кофе') || value.includes('сок') || value.includes('лимонад') || value.includes('смузи')) return '🧃';
  if (value.includes('бар') || value.includes('алког') || value.includes('пиво') || value.includes('вино') || value.includes('шот') || value.includes('виски') || value.includes('водка')) return '🍻';
  if (value.includes('десерт') || value.includes('сладк') || value.includes('морож')) return '🍰';
  if (value.includes('горяч') || value.includes('мясо') || value.includes('шашлык') || value.includes('птиц')) return '🥩';
  if (value.includes('закуск') || value.includes('пивн')) return '🥨';
  if (value.includes('хлеб') || value.includes('выпеч')) return '🥐';
  if (value.includes('гарнир')) return '🍟';
  if (value.includes('соус')) return '🫙';
  if (value.includes('акци')) return '🔥';
  return '🍽️';
}

export async function syncPalomaCatalog() {
  const [menuResponse, stoplistResponse] = await Promise.all([
    palomaClient.getMenu(),
    palomaClient.getStoplist().catch((error) => {
      console.warn('Стоп-лист Paloma365 временно недоступен:', error);
      return { items: [] };
    }),
  ]);

  const stoppedIds = new Set(
    (stoplistResponse?.items || []).map((item) => Number(item.object_id)).filter(Number.isFinite),
  );

  const menu = [];
  const categories = [];

  for (const group of menuResponse?.item_groups || []) {
    const categoryId = `paloma_${group.object_id}`;
    const activeItems = (group.items || []).filter(
      (item) => Number(item.mark_deleted) !== 1 && Number(item.i_useInMenu) === 1 && toNumber(item.price) > 0,
    );

    if (activeItems.length === 0) continue;

    categories.push({
      id: categoryId,
      palomaId: Number(group.object_id),
      parentId: group.parent_id ? `paloma_${group.parent_id}` : null,
      name: group.name || 'Без категории',
      icon: iconForCategory(group.name),
    });

    activeItems.forEach((item) => {
      const palomaId = Number(item.object_id);
      menu.push({
        id: String(item.object_id),
        paloma_id: palomaId,
        article: item.article || '',
        name: item.name || 'Без названия',
        price: toNumber(item.price),
        ingredients: item.description || '',
        category: categoryId,
        isStop: stoppedIds.has(palomaId),
        imgUrl: item.image || '',
        quantity: toNumber(item.quantity),
        modifierGroups: item.modifier_groups || [],
        complexGroups: item.complex_groups || [],
        palomaEditDate: item.edit_date || null,
      });
    });
  }

  return {
    menu,
    categories,
    stopCount: menu.filter((item) => item.isStop).length,
    syncedAt: new Date().toISOString(),
  };
}

export function buildPalomaOrder(internalOrder) {
  if (!internalOrder?.id) throw new Error('У внутреннего заказа отсутствует id.');

  const rawItems = Array.isArray(internalOrder.cartItems) ? internalOrder.cartItems : [];
  const missingPalomaIds = rawItems.filter(
    (item) => toNumber(item.price) > 0 && toNumber(item.quantity) > 0 && toNumber(item.paloma_id) <= 0,
  );

  if (missingPalomaIds.length > 0) {
    const names = missingPalomaIds.slice(0, 5).map((item) => item.name).join(', ');
    throw new Error(`У блюд нет ID Paloma365: ${names}. Сначала синхронизируйте меню в админке.`);
  }

  const orderItems = rawItems
    .filter((item) => toNumber(item.price) > 0 && toNumber(item.quantity) > 0)
    .map((item) => ({
      object_id: Number(item.paloma_id),
      name: String(item.name || ''),
      count: toNumber(item.quantity, 1),
      price: toNumber(item.price),
    }));

  if (orderItems.length === 0) throw new Error('В заказе нет блюд, которые можно отправить в Paloma365.');

  const discountFromItems = Math.abs(
    rawItems
      .filter((item) => toNumber(item.price) < 0)
      .reduce((sum, item) => sum + toNumber(item.price) * toNumber(item.quantity, 1), 0),
  );

  const commentParts = [
    internalOrder.tableName ? `Стол/тип: ${internalOrder.tableName}` : '',
    internalOrder.waiterName ? `Официант: ${internalOrder.waiterName}` : '',
    internalOrder.serviceFee ? `Сервисный сбор: ${internalOrder.serviceFee} ₸` : '',
    internalOrder.deliveryAddress || '',
    internalOrder.comment || '',
  ].filter(Boolean);

  const isDelivery = internalOrder.orderType === 'delivery';
  const contactPhone = normalizePhone(internalOrder.contactPhone || internalOrder.deliveryPhone || internalOrder.phone);

  return {
    order_id: String(internalOrder.id),
    date: formatLocalDateTime(),
    name: internalOrder.customerName || 'Гость',
    phone: contactPhone,
    email: extractEmail(internalOrder),
    address: isDelivery ? String(internalOrder.deliveryAddress || '') : '',
    comment: commentParts.join(' | '),
    person_amount: Math.max(1, Math.round(toNumber(internalOrder.personAmount, 1))),
    total_price: toNumber(internalOrder.total),
    discount_amount: toNumber(internalOrder.discountAmount, discountFromItems),
    exchange: 0,
    // В официальном Tester API: 1 — доставка, 0 — самовывоз.
    // Заказы в зале временно отправляются как 0, а стол указывается в comment.
    delivery_type: isDelivery ? 1 : 0,
    is_cash: internalOrder.payMethod === 'cash',
    is_payed: internalOrder.payMethod !== 'cash',
    order_items: orderItems,
  };
}

export async function submitOrderToPaloma(internalOrder) {
  const payload = buildPalomaOrder(internalOrder);
  return palomaClient.createOrder(payload);
}

export const fetchPalomaMenu = () => palomaClient.getMenu();
export const fetchPalomaStoplist = () => palomaClient.getStoplist();
export const fetchPalomaPoints = () => palomaClient.getPoints();
export const fetchPalomaOrderStatus = (orderId) => palomaClient.getOrderStatus(orderId);
export const testPalomaConnection = () => palomaClient.health();
export const sendOrderToPaloma = (payload) => palomaClient.createOrder(payload);
