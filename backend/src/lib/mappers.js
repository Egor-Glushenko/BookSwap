export function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    city: row.city,
    role: row.role,
    rating: Number(row.rating),
    deals: row.deals,
    isBlocked: Boolean(row.is_blocked),
    createdAt: row.created_at
  };
}

export function formatRelativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)} мин. назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч. назад`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Вчера';
  return `${days} дн. назад`;
}

export function mapListing(row, seller, ratingStats) {
  const priceLabel = row.type === 'Продажа'
    ? `${Math.round(Number(row.price))} ₽`
    : row.type === 'Обмен' ? 'Обмен' : 'Даром';

  return {
    id: row.id,
    type: row.type,
    title: row.title,
    author: row.author,
    genre: row.genre || '',
    condition: row.condition,
    price: priceLabel,
    priceValue: row.price ? Number(row.price) : null,
    city: row.city,
    district: row.district || '',
    rating: ratingStats?.avg ? Number(ratingStats.avg).toFixed(1) : '0.0',
    reviews: ratingStats?.count || 0,
    year: row.year ? String(row.year) : '',
    publisher: row.publisher || '',
    isbn: row.isbn || '',
    views: row.views || 0,
    time: formatRelativeTime(row.created_at),
    tone: row.tone || 'blue',
    seller: seller?.name || 'Пользователь',
    sellerId: row.seller_id,
    sellerRating: seller ? Number(seller.rating) : 0,
    sellerDeals: seller?.deals || 0,
    description: row.description || '',
    exchangeWant: row.exchange_want || '',
    status: row.status,
    pickup: row.pickup,
    delivery: row.delivery,
    createdAt: row.created_at
  };
}

export function mapChat(row) {
  return {
    id: row.id,
    listingId: row.listing_id,
    participant: row.participant_name || 'Пользователь',
    listingTitle: row.listing_title || '',
    unread: row.unread || 0,
    lastMessage: row.last_message || '',
    lastMessageAt: row.last_message_at
  };
}

export function mapMessage(row) {
  return {
    id: row.id,
    chatId: row.chat_id,
    senderId: row.sender_id,
    text: row.text,
    readAt: row.read_at,
    createdAt: row.created_at
  };
}
