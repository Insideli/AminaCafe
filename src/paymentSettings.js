export const DEFAULT_PAYMENT_SETTINGS = {
  active: false,
  bank: 'Kaspi',
  recipient: '',
  cardNumber: '',
  phone: '',
  cashierName: '',
  instructionsRu:
    'Переведите точную сумму и нажмите «Я оплатил». Кассир проверит поступление.',
  instructionsKz:
    'Нақты соманы аударып, «Мен төледім» түймесін басыңыз. Кассир төлемді тексереді.',
  updatedAt: null,
  updatedBy: null,
};

export const normalizePaymentSettings = (value) => ({
  ...DEFAULT_PAYMENT_SETTINGS,
  ...(value && typeof value === 'object' ? value : {}),
});

export const getPaymentTarget = (value) => {
  const settings = normalizePaymentSettings(value);

  return String(
    settings.cardNumber || settings.phone || ''
  ).trim();
};

export const getPaymentTargetLabel = (value) => {
  const settings = normalizePaymentSettings(value);

  return settings.cardNumber
    ? 'Номер карты'
    : 'Номер телефона';
};

export const formatPaymentTarget = (value) => {
  const text = String(value || '').trim();
  const digits = text.replace(/\D/g, '');

  if (digits.length === 16) {
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  }

  return text;
};
