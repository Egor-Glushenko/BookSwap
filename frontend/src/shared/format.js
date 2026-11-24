export function plural(count, one, few, many) {
  const n = Math.abs(Number(count) || 0);
  const mod100 = n % 100;
  const mod10 = n % 10;
  if (mod100 > 10 && mod100 < 20) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

export function countLabel(count, one, few, many) {
  return `${count} ${plural(count, one, few, many)}`;
}

export function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function avatarTone(seed = '') {
  const tones = ['', 'warm', 'green', 'violet'];
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) hash = (hash * 31 + seed.charCodeAt(index)) % 9973;
  return tones[hash % tones.length];
}

export function formatDate(value, options = {}) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', ...options });
}

export function formatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(value) {
  if (!value) return '';
  return `${formatDate(value)} · ${formatTime(value)}`;
}

export function chatDay(value) {
  if (!value) return '';
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86_400_000);
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  if (sameDay(date, today)) return 'Сегодня';
  if (sameDay(date, yesterday)) return 'Вчера';
  return formatDate(date, { year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric' });
}

export function formatNumber(value) {
  return new Intl.NumberFormat('ru-RU').format(Number(value) || 0);
}

export function truncate(value, max = 140) {
  const text = String(value || '').trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export function isNew(createdAt, hours = 48) {
  if (!createdAt) return false;
  return Date.now() - new Date(createdAt).getTime() < hours * 3_600_000;
}
