const PALOMA_PROXY_URL = '/api/paloma';

export class PalomaApiError extends Error {
  constructor(message, { status = 0, code = '', details = null } = {}) {
    super(message);
    this.name = 'PalomaApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function requestPaloma(action, { method = 'GET', body, query = {} } = {}) {
  const params = new URLSearchParams({ action });
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  });

  let response;
  try {
    response = await fetch(`${PALOMA_PROXY_URL}?${params.toString()}`, {
      method,
      credentials: 'same-origin',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    throw new PalomaApiError('Нет соединения с сервером AminaCafe.', {
      code: 'NETWORK_ERROR',
      details: error,
    });
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Сервер всегда должен возвращать JSON, но оставляем понятную ошибку на случай сбоя Vercel.
  }

  if (!response.ok) {
    throw new PalomaApiError(data?.error || 'Ошибка обмена с Paloma365.', {
      status: response.status,
      code: data?.code || 'PALOMA_REQUEST_FAILED',
      details: data?.paloma || data,
    });
  }

  return data;
}

export const palomaClient = {
  health: () => requestPaloma('health'),
  getPoints: () => requestPaloma('points'),
  getMenu: () => requestPaloma('menu'),
  getStoplist: () => requestPaloma('stoplist'),
  createOrder: (payload) => requestPaloma('order', { method: 'POST', body: payload }),
  getOrderStatus: (orderId) => requestPaloma('status', { query: { order_id: orderId } }),
};
