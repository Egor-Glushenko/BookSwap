const priceFormatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

const plural = (count, one, few, many) => {
  const mod100 = Math.abs(count) % 100;
  const mod10 = mod100 % 10;
  if (mod100 > 10 && mod100 < 20) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
};

export function pluralize(count, one, few, many) {
  return `${count} ${plural(count, one, few, many)}`;
}

export function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'только что';
  if (minutes < 60) return `${pluralize(minutes, 'минуту', 'минуты', 'минут')} назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${pluralize(hours, 'час', 'часа', 'часов')} назад`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'вчера';
  if (days < 30) return `${pluralize(days, 'день', 'дня', 'дней')} назад`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${pluralize(months, 'месяц', 'месяца', 'месяцев')} назад`;
  return `${pluralize(Math.floor(months / 12), 'год', 'года', 'лет')} назад`;
}

export function formatPrice(type, price) {
  const value = price === null || price === undefined ? null : Number(price);
  if (type === 'Обмен') return 'Обмен';
  if (type === 'Бесплатно') return 'Даром';
  if (value === null || Number.isNaN(value) || value <= 0) return 'Цена не указана';
  return `${priceFormatter.format(value)} ₽`;
}

export function mapUser(row, { includeEmail = false } = {}) {
  if (!row) return null;
  return {
    id: row.id,
    ...(includeEmail ? { email: row.email } : {}),
    name: row.name,
    city: row.city,
    role: row.role,
    rating: Number(row.rating || 0),
    deals: Number(row.deals || 0),
    bio: row.bio || '',
    avatarUrl: row.avatar_url || null,
    isBlocked: Boolean(row.is_blocked),
    createdAt: row.created_at
  };
}

export function mapListing(row) {
  if (!row) return null;
  const images = Array.isArray(row.images) ? row.images.filter(Boolean) : [];
  const ratingCount = Number(row.rating_count || 0);
  const average = Number(row.avg_rating || 0);

  return {
    id: row.id,
    type: row.type,
    title: row.title,
    author: row.author,
    genre: row.genre || '',
    condition: row.condition,
    price: formatPrice(row.type, row.price),
    priceValue: row.price === null || row.price === undefined ? null : Number(row.price),
    city: row.city,
    district: row.district || '',
    rating: average ? average.toFixed(1) : '0.0',
    reviews: ratingCount,
    year: row.year ? String(row.year) : '',
    publisher: row.publisher || '',
    isbn: row.isbn || '',
    views: Number(row.views || 0),
    time: formatRelativeTime(row.created_at),
    tone: row.tone || 'blue',
    images,
    coverUrl: images[0] || null,
    seller: row.seller_name || 'Пользователь',
    sellerId: row.seller_id,
    sellerRating: Number(row.seller_rating || 0),
    sellerDeals: Number(row.seller_deals || 0),
    sellerAvatar: row.seller_avatar || null,
    sellerSince: row.seller_created_at || null,
    description: row.description || '',
    exchangeWant: row.exchange_want || '',
    status: row.status,
    pickup: Boolean(row.pickup),
    delivery: Boolean(row.delivery),
    createdAt: row.created_at,
    updatedAt: row.updated_at || row.created_at
  };
}

export function mapRating(row) {
  if (!row) return null;
  return {
    id: row.id,
    listingId: row.listing_id,
    userId: row.user_id,
    author: row.author_name || 'Читатель',
    authorAvatar: row.author_avatar || null,
    value: Number(row.value),
    review: row.review || '',
    createdAt: row.created_at,
    time: formatRelativeTime(row.created_at)
  };
}

export function mapSellerReview(row) {
  if (!row) return null;
  return {
    id: row.id,
    sellerId: row.seller_id,
    listingId: row.listing_id,
    listingTitle: row.listing_title || '',
    author: row.author_name || 'Пользователь',
    authorAvatar: row.author_avatar || null,
    rating: Number(row.rating),
    text: row.text || '',
    createdAt: row.created_at,
    time: formatRelativeTime(row.created_at)
  };
}

export function mapChat(row) {
  if (!row) return null;
  return {
    id: row.id,
    listingId: row.listing_id,
    listingTitle: row.listing_title || '',
    participantId: row.participant_id,
    participant: row.participant_name || 'Пользователь',
    participantAvatar: row.participant_avatar || null,
    unread: Number(row.unread || 0),
    lastMessage: row.last_message || '',
    lastMessageAt: row.last_message_at || row.created_at,
    createdAt: row.created_at
  };
}

export function mapMessage(row) {
  if (!row) return null;
  return {
    id: row.id,
    chatId: row.chat_id,
    senderId: row.sender_id,
    text: row.text,
    readAt: row.read_at,
    createdAt: row.created_at
  };
}

export function mapReport(row) {
  if (!row) return null;
  return {
    id: row.id,
    listingId: row.listing_id,
    listingTitle: row.listing_title || '',
    reason: row.reason,
    status: row.status,
    reporter: row.reporter_name || 'Пользователь',
    sellerId: row.seller_id || null,
    sellerName: row.seller_name || '',
    createdAt: row.created_at,
    time: formatRelativeTime(row.created_at)
  };
}

export function mapCategory(row) {
  return { id: row.id, name: row.name };
}

export function mapListingCollection(rows) {
  return rows.map(mapListing);
}
