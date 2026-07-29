import {
  createHmac,
  pbkdf2Sync,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

const COOKIE_NAME = 'amina_staff_session';
const SESSION_TTL_SECONDS = 8 * 60 * 60;
const DEFAULT_ITERATIONS = 210000;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 8;
const loginAttempts = globalThis.__aminaLoginAttempts || new Map();
globalThis.__aminaLoginAttempts = loginAttempts;

function base64UrlEncode(value) {
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(String(value), 'utf8');
  return buffer.toString('base64url');
}

function base64UrlDecode(value) {
  return Buffer.from(String(value), 'base64url');
}

function getSessionSecret() {
  const secret = process.env.AMINA_SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) {
    const error = new Error('На сервере не задан безопасный AMINA_SESSION_SECRET.');
    error.status = 500;
    error.code = 'SESSION_SECRET_NOT_CONFIGURED';
    throw error;
  }
  return secret;
}

function parseCookieHeader(header = '') {
  return String(header)
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((result, part) => {
      const index = part.indexOf('=');
      if (index <= 0) return result;
      const key = decodeURIComponent(part.slice(0, index));
      const value = decodeURIComponent(part.slice(index + 1));
      result[key] = value;
      return result;
    }, {});
}

function getRequestHost(req) {
  return String(req.headers['x-forwarded-host'] || req.headers.host || '').toLowerCase();
}

export function assertSameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return;

  let originHost = '';
  try {
    originHost = new URL(origin).host.toLowerCase();
  } catch {
    const error = new Error('Некорректный Origin запроса.');
    error.status = 403;
    error.code = 'INVALID_ORIGIN';
    throw error;
  }

  if (!originHost || originHost !== getRequestHost(req)) {
    const error = new Error('Запрос отклонён: источник не совпадает с сайтом AminaCafe.');
    error.status = 403;
    error.code = 'ORIGIN_MISMATCH';
    throw error;
  }
}

function getClientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.socket?.remoteAddress || 'unknown';
}

function pruneLoginAttempts(now = Date.now()) {
  for (const [key, value] of loginAttempts.entries()) {
    if (!value || now - value.startedAt > LOGIN_WINDOW_MS) loginAttempts.delete(key);
  }
}

export function checkLoginRateLimit(req) {
  const now = Date.now();
  pruneLoginAttempts(now);
  const ip = getClientIp(req);
  const item = loginAttempts.get(ip);
  if (item && item.count >= LOGIN_MAX_ATTEMPTS && now - item.startedAt <= LOGIN_WINDOW_MS) {
    const error = new Error('Слишком много попыток входа. Попробуйте позже.');
    error.status = 429;
    error.code = 'TOO_MANY_LOGIN_ATTEMPTS';
    throw error;
  }
  return ip;
}

export function recordFailedLogin(ip) {
  const now = Date.now();
  const item = loginAttempts.get(ip);
  if (!item || now - item.startedAt > LOGIN_WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, startedAt: now });
  } else {
    loginAttempts.set(ip, { ...item, count: item.count + 1 });
  }
}

export function clearFailedLogins(ip) {
  loginAttempts.delete(ip);
}

function parseStaffAccounts() {
  const raw = process.env.STAFF_ACCOUNTS_JSON?.trim();
  if (!raw) {
    const error = new Error('На сервере не задан STAFF_ACCOUNTS_JSON.');
    error.status = 500;
    error.code = 'STAFF_ACCOUNTS_NOT_CONFIGURED';
    throw error;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const error = new Error('STAFF_ACCOUNTS_JSON содержит некорректный JSON.');
    error.status = 500;
    error.code = 'INVALID_STAFF_ACCOUNTS_JSON';
    throw error;
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    const error = new Error('STAFF_ACCOUNTS_JSON должен быть JSON-объектом.');
    error.status = 500;
    error.code = 'INVALID_STAFF_ACCOUNTS_FORMAT';
    throw error;
  }

  return parsed;
}

function normalizeEmployeeId(value) {
  return String(value || '').trim();
}

function verifyHash(password, account) {
  const iterations = Number(account.iterations || DEFAULT_ITERATIONS);
  if (!account.salt || !account.hash || !Number.isInteger(iterations) || iterations < 100000) {
    return false;
  }

  let expected;
  try {
    expected = Buffer.from(String(account.hash), 'base64');
  } catch {
    return false;
  }
  if (expected.length !== 32) return false;

  const actual = pbkdf2Sync(
    String(password || ''),
    Buffer.from(String(account.salt), 'base64'),
    iterations,
    expected.length,
    'sha256',
  );

  return timingSafeEqual(actual, expected);
}

export function authenticateStaff(employeeId, password) {
  const accounts = parseStaffAccounts();
  const id = normalizeEmployeeId(employeeId);
  const account = accounts[id];

  // Выполняем PBKDF2 даже для неизвестного логина, чтобы ответы по времени были похожими.
  if (!account) {
    pbkdf2Sync(String(password || ''), Buffer.alloc(16, 7), DEFAULT_ITERATIONS, 32, 'sha256');
    return null;
  }

  if (!verifyHash(password, account)) return null;
  if (account.active === false) return null;

  return {
    phone: id,
    employeeId: id,
    role: String(account.role || 'waiter'),
    name: String(account.name || 'Сотрудник'),
    station: account.station || null,
    isSenior: Boolean(account.isSenior),
  };
}

function signPayload(payload) {
  return createHmac('sha256', getSessionSecret()).update(payload).digest('base64url');
}

export function createSessionToken(user) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    ...user,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
    nonce: randomBytes(8).toString('hex'),
  };
  const encoded = base64UrlEncode(JSON.stringify(payload));
  return `${encoded}.${signPayload(encoded)}`;
}

export function verifySessionToken(token) {
  const [encoded, signature] = String(token || '').split('.');
  if (!encoded || !signature) return null;

  const expected = Buffer.from(signPayload(encoded));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  let payload;
  try {
    payload = JSON.parse(base64UrlDecode(encoded).toString('utf8'));
  } catch {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp <= now || !payload.phone || !payload.role) return null;

  return {
    phone: String(payload.phone),
    employeeId: String(payload.employeeId || payload.phone),
    role: String(payload.role),
    name: String(payload.name || 'Сотрудник'),
    station: payload.station || null,
    isSenior: Boolean(payload.isSenior),
    exp: payload.exp,
  };
}

export function getStaffSession(req) {
  const cookies = parseCookieHeader(req.headers.cookie || '');
  return verifySessionToken(cookies[COOKIE_NAME]);
}

export function requireStaffSession(req) {
  const session = getStaffSession(req);
  if (!session) {
    const error = new Error('Сессия сотрудника отсутствует или истекла. Войдите снова.');
    error.status = 401;
    error.code = 'STAFF_AUTH_REQUIRED';
    throw error;
  }

  const account = parseStaffAccounts()[session.phone];
  if (!account || account.active === false || String(account.role || '') !== session.role) {
    const error = new Error('Аккаунт сотрудника отключён или его роль изменилась. Войдите снова.');
    error.status = 401;
    error.code = 'STAFF_ACCOUNT_CHANGED';
    throw error;
  }

  return session;
}

export function requireRole(session, allowedRoles) {
  if (!allowedRoles.includes(session.role)) {
    const error = new Error('У вашей роли нет доступа к этой операции.');
    error.status = 403;
    error.code = 'ROLE_FORBIDDEN';
    throw error;
  }
}

function shouldUseSecureCookie(req) {
  const proto = String(req.headers['x-forwarded-proto'] || '').toLowerCase();
  return proto === 'https' || process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
}

export function setSessionCookie(req, res, token) {
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SESSION_TTL_SECONDS}`,
  ];
  if (shouldUseSecureCookie(req)) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearSessionCookie(req, res) {
  const parts = [
    `${COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ];
  if (shouldUseSecureCookie(req)) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function sendApiError(res, error) {
  const status = Number(error?.status) || 500;
  res.status(status).json({
    error: status >= 500 ? error.message || 'Внутренняя ошибка сервера.' : error.message,
    code: error?.code || 'API_ERROR',
  });
}
