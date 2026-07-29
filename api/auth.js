import {
  assertSameOrigin,
  authenticateStaff,
  checkLoginRateLimit,
  clearFailedLogins,
  clearSessionCookie,
  createSessionToken,
  getStaffSession,
  recordFailedLogin,
  sendApiError,
  setSessionCookie,
} from './_auth.js';

function sendJson(res, status, body) {
  res.status(status).json(body);
}

function getAction(req) {
  return String(req.query?.action || '').trim().toLowerCase();
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  const action = getAction(req);

  try {
    if (action === 'session' && req.method === 'GET') {
      const session = getStaffSession(req);
      if (!session) return sendJson(res, 401, { error: 'Нет активной сессии.', code: 'NO_SESSION' });
      return sendJson(res, 200, { ok: true, user: session });
    }

    if (action === 'login' && req.method === 'POST') {
      assertSameOrigin(req);
      const ip = checkLoginRateLimit(req);
      const employeeId = req.body?.employeeId;
      const password = req.body?.password;

      if (!employeeId || !password) {
        return sendJson(res, 400, { error: 'Введите логин и пароль.', code: 'MISSING_CREDENTIALS' });
      }

      const user = authenticateStaff(employeeId, password);
      if (!user) {
        recordFailedLogin(ip);
        return sendJson(res, 401, { error: 'Неверный логин, пароль или доступ сотрудника закрыт.', code: 'INVALID_CREDENTIALS' });
      }

      clearFailedLogins(ip);
      setSessionCookie(req, res, createSessionToken(user));
      return sendJson(res, 200, { ok: true, user });
    }

    if (action === 'logout' && req.method === 'POST') {
      assertSameOrigin(req);
      clearSessionCookie(req, res);
      return sendJson(res, 200, { ok: true });
    }

    res.setHeader('Allow', action === 'session' ? 'GET' : 'POST');
    return sendJson(res, 405, { error: 'Неизвестная операция или неподходящий HTTP-метод.', code: 'METHOD_NOT_ALLOWED' });
  } catch (error) {
    return sendApiError(res, error);
  }
}
