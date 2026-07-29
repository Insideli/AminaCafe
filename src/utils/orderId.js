export function createOrderId(prefix = 'ORD') {
  const timePart = Date.now().toString(36).toUpperCase();
  const randomPart = crypto.getRandomValues(new Uint32Array(1))[0].toString(36).slice(-5).toUpperCase();
  return `${prefix}-${timePart}-${randomPart}`;
}
