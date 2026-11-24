export const LISTING_TYPES = ['Продажа', 'Обмен', 'Бесплатно'];

export const CONDITIONS = ['Новое', 'Отличное', 'Хорошее', 'Удовлетворительное'];

export const GENRES = [
  'Фантастика и фэнтези',
  'Бизнес и экономика',
  'Классика',
  'Научпоп',
  'Современная проза',
  'Детские книги',
  'Учебная литература',
  'Поэзия',
  'Биографии и мемуары',
  'Искусство и дизайн'
];

export const TONES = ['blue', 'orange', 'green', 'pink', 'yellow', 'violet'];

export const SORT_OPTIONS = [
  { value: 'new', label: 'Сначала новые' },
  { value: 'price_asc', label: 'Цена: по возрастанию' },
  { value: 'price_desc', label: 'Цена: по убыванию' },
  { value: 'rating', label: 'По рейтингу книги' },
  { value: 'popular', label: 'По популярности' }
];

export const REPORT_REASONS = [
  'Объявление выглядит как мошенничество',
  'Книга уже продана или недоступна',
  'Фото и описание не соответствуют книге',
  'Дубликат другого объявления',
  'Запрещённый контент',
  'Другое'
];

export const REVIEW_STATUS_LABELS = {
  new: 'Новая',
  reviewing: 'В работе',
  resolved: 'Решена',
  rejected: 'Отклонена'
};

export const LISTING_STATUS_LABELS = {
  active: 'Активно',
  moderation: 'На проверке',
  archived: 'Снято',
  sold: 'Передано'
};

export const SITE_NAME = 'BookSwap';

export const SITE_TAGLINE = 'Книги находят своих людей';

export const DEFAULT_DESCRIPTION =
  'BookSwap — маркетплейс книг: купить, обменять или забрать бесплатно. Живой каталог с фильтрами, рейтингами книг и продавцов, встроенным чатом и безопасной модерацией.';
