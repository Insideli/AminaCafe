import { assertSameOrigin, requireRole, requireStaffSession, sendApiError } from './_auth.js';

const DEFAULT_PALOMA_HOST = 'https://api.paloma365.com';
const ALLOWED_ACTIONS = new Set(['points', 'menu', 'stoplist', 'order', 'status', 'health']);
const ACTION_METHODS = {
  points: 'GET',
  menu: 'GET',
  stoplist: 'GET',
  status: 'GET',
  order: 'POST',
  health: 'GET',
};

const ACTION_ROLES = {
  points: ['admin', 'developer'],
  menu: ['admin', 'developer'],
  stoplist: ['admin', 'developer'],
  health: ['admin', 'developer'],
  order: ['admin', 'developer', 'waiter', 'cashier'],
  status: ['admin', 'developer', 'waiter', 'cashier'],
};

function sendJson(res, status, body) {
  res.status(status).json(body);
}

function getAction(req) {
  const raw = req.query?.action || req.query?.method || '';
  return String(raw).trim().toLowerCase();
}

function requireEnvironment() {
  const authkey = process.env.PALOMA_AUTHKEY?.trim();
  const pointId = Number(process.env.PALOMA_POINT_ID || 0);
  const host = (process.env.PALOMA_HOST || DEFAULT_PALOMA_HOST).replace(/\/$/, '');
  const defaultPhone = process.env.PALOMA_DEFAULT_PHONE?.trim() || '';
  const defaultEmail = process.env.PALOMA_DEFAULT_EMAIL?.trim() || 'no-reply@example.com';
  const defaultAddress = process.env.PALOMA_DEFAULT_ADDRESS?.trim() || 'Кафе Амина — самовывоз';
  const defaultLongitude = process.env.PALOMA_COORDINATE_LONG?.trim() || '0';
  const defaultLatitude = process.env.PALOMA_COORDINATE_LAT?.trim() || '0';

  if (!authkey) {
    const error = new Error('На сервере не задан PALOMA_AUTHKEY.');
    error.code = 'PALOMA_NOT_CONFIGURED';
    throw error;
  }

  return {
    authkey,
    pointId,
    host,
    defaultPhone,
    defaultEmail,
    defaultAddress,
    defaultLongitude,
    defaultLatitude,
  };
}

function validateOrder(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'Тело заказа должно быть JSON-объектом.';
  }

  const orderId = String(body.order_id || '').trim();
  if (!orderId || orderId.length > 100) return 'Некорректный order_id.';

  if (!Array.isArray(body.order_items) || body.order_items.length === 0) {
    return 'В заказе отсутствуют order_items.';
  }
  if (body.order_items.length > 100) return 'В одном заказе не может быть больше 100 позиций.';

  for (const item of body.order_items) {
    const objectId = Number(item?.object_id);
    const count = Number(item?.count);
    const price = Number(item?.price);
    if (!Number.isInteger(objectId) || objectId <= 0) return 'У позиции некорректный object_id.';
    if (!Number.isFinite(count) || count <= 0 || count > 100) return 'У позиции некорректное количество.';
    if (!Number.isFinite(price) || price < 0 || price > 10000000) return 'У позиции некорректная цена.';
  }

  const requiredTextFields = [
    'date',
    'name',
    'phone',
    'email',
    'address',
    'coordinate_long',
    'coordinate_lat',
  ];

  for (const field of requiredTextFields) {
    if (!String(body[field] ?? '').trim()) {
      return `Обязательное поле ${field} пустое.`;
    }
  }

  const total = Number(body.total_price);
  if (!Number.isFinite(total) || total < 0 || total > 100000000) {
    return 'Некорректное значение total_price.';
  }

  if (String(body.comment || '').length > 1500) return 'Комментарий к заказу слишком длинный.';
  return null;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(204).end();
  }

  const action = getAction(req);
  if (!ALLOWED_ACTIONS.has(action)) {
    return sendJson(res, 400, {
      error: 'Неизвестная операция Paloma365.',
      allowedActions: [...ALLOWED_ACTIONS],
    });
  }

  const expectedMethod = ACTION_METHODS[action];
  if (req.method !== expectedMethod) {
    res.setHeader('Allow', expectedMethod);
    return sendJson(res, 405, { error: `Для операции ${action} нужен метод ${expectedMethod}.` });
  }

  try {
    if (req.method === 'POST') assertSameOrigin(req);
    const session = requireStaffSession(req);
    requireRole(session, ACTION_ROLES[action]);

    const {
      authkey,
      pointId,
      host,
      defaultPhone,
      defaultEmail,
      defaultAddress,
      defaultLongitude,
      defaultLatitude,
    } = requireEnvironment();
    const palomaMethod = action === 'health' ? 'points' : action;

    if (['order', 'stoplist'].includes(palomaMethod) && !pointId) {
      return sendJson(res, 500, {
        error: 'На сервере не задан корректный PALOMA_POINT_ID.',
        code: 'PALOMA_POINT_NOT_CONFIGURED',
      });
    }

    let outboundBody = req.body;
    if (palomaMethod === 'order') {
      const auditComment = `Отправил: ${session.name} (${session.phone})`;

      outboundBody = {
        ...req.body,
        phone: String(req.body?.phone || defaultPhone || '').trim(),
        email: String(req.body?.email || defaultEmail).trim(),
        address: String(req.body?.address || defaultAddress).trim(),
        coordinate_long: String(req.body?.coordinate_long || defaultLongitude).trim(),
        coordinate_lat: String(req.body?.coordinate_lat || defaultLatitude).trim(),
        comment: [
          String(req.body?.comment || '').trim(),
          auditComment,
        ].filter(Boolean).join(' | '),
      };

      if (!outboundBody.phone) {
        return sendJson(res, 500, {
          error: 'Задайте PALOMA_DEFAULT_PHONE в Vercel в формате +7XXXXXXXXXX.',
          code: 'PALOMA_DEFAULT_PHONE_NOT_CONFIGURED',
        });
      }

      const validationError = validateOrder(outboundBody);
      if (validationError) return sendJson(res, 400, { error: validationError });
    }

    const params = new URLSearchParams({
      class: 'Tester',
      method: palomaMethod,
      authkey,
    });

    if (['order', 'stoplist'].includes(palomaMethod)) {
      params.set('point_id', String(pointId));
    }

    if (palomaMethod === 'status') {
      const orderId = String(req.query?.order_id || '').trim();
      if (!orderId) return sendJson(res, 400, { error: 'Для проверки статуса нужен order_id.' });
      params.set('order_id', orderId);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    let response;
    try {
      response = await fetch(`${host}/company/api/?${params.toString()}`, {
        method: expectedMethod,
        headers: expectedMethod === 'POST' ? { Accept: 'application/json' } : undefined,
        body: expectedMethod === 'POST'
          ? Buffer.from(JSON.stringify(outboundBody), 'utf8')
          : undefined,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const raw = await response.text();
    let data;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = { raw: raw.slice(0, 2000) };
    }

    if (!response.ok) {
      return sendJson(res, response.status, {
        error: 'Paloma365 вернула ошибку.',
        paloma: data,
      });
    }

    return sendJson(res, 200, action === 'health' ? { ok: true, points: data } : data);
  } catch (error) {
    if (error?.name === 'AbortError') {
      error.status = 504;
      error.code = 'PALOMA_TIMEOUT';
      error.message = 'Paloma365 не ответила за 12 секунд.';
    }
    return sendApiError(res, error);
  }
}
