import { badRequest } from './errors.js';

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

export function text(value, { field = 'Поле', min = 1, max = 500, required = true } = {}) {
  const result = clean(value);
  if (!result) {
    if (required) throw badRequest(`${field}: обязательное поле`);
    return '';
  }
  if (result.length < min) throw badRequest(`${field}: минимум ${min} символов`);
  if (result.length > max) throw badRequest(`${field}: максимум ${max} символов`);
  return result;
}

export function optionalText(value, options = {}) {
  return text(value, { required: false, ...options });
}

export function email(value) {
  const result = clean(value).toLowerCase();
  if (!result) throw badRequest('Укажите email');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(result)) throw badRequest('Введите корректный email');
  if (result.length > 254) throw badRequest('Email слишком длинный');
  return result;
}

export function password(value) {
  const result = String(value ?? '');
  if (result.length < 8) throw badRequest('Пароль должен содержать не менее 8 символов');
  if (result.length > 200) throw badRequest('Пароль слишком длинный');
  return result;
}

export function oneOf(value, allowed, field = 'Значение') {
  const result = clean(value);
  if (!allowed.includes(result)) throw badRequest(`${field}: недопустимое значение`);
  return result;
}

export function integer(value, { field = 'Значение', min, max, required = true } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw badRequest(`${field}: обязательное поле`);
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) throw badRequest(`${field}: нужно целое число`);
  if (min !== undefined && parsed < min) throw badRequest(`${field}: минимум ${min}`);
  if (max !== undefined && parsed > max) throw badRequest(`${field}: максимум ${max}`);
  return parsed;
}

export function money(value, { field = 'Цена', min = 1, max = 1_000_000, required = true } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw badRequest(`${field}: обязательное поле`);
    return null;
  }
  const parsed = Number(String(value).replace(',', '.'));
  if (!Number.isFinite(parsed)) throw badRequest(`${field}: нужно число`);
  if (parsed < min) throw badRequest(`${field}: минимум ${min}`);
  if (parsed > max) throw badRequest(`${field}: максимум ${max}`);
  return Math.round(parsed * 100) / 100;
}

export function boolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

export function uuid(value, field = 'Идентификатор') {
  const result = clean(value);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(result)) {
    throw badRequest(`${field}: неверный формат`);
  }
  return result;
}

export function id(value, field = 'Идентификатор') {
  return integer(value, { field, min: 1 });
}

export function url(value, { field = 'Ссылка', required = false } = {}) {
  const result = clean(value);
  if (!result) {
    if (required) throw badRequest(`${field}: обязательное поле`);
    return '';
  }
  if (result.length > 500) throw badRequest(`${field}: слишком длинная ссылка`);
  if (!/^https?:\/\/[^\s]+$/i.test(result) && !/^\/uploads\/[\w.-]+$/.test(result)) {
    throw badRequest(`${field}: нужна ссылка http(s) или загруженный файл`);
  }
  return result;
}

export function tags(value, { max = 6 } = {}) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => clean(item))
    .filter(Boolean)
    .slice(0, max);
}
