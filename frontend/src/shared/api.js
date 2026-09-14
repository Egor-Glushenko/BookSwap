const API_URL = import.meta.env.VITE_API_URL || '/api';

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  const body = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(body?.error || 'Не удалось выполнить запрос');
  return body;
}

export const authApi = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (email, password) => request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: (token) => request('/auth/me', { headers: authHeaders(token) }),
  logout: (token) => request('/auth/logout', { method: 'POST', headers: authHeaders(token) })
};

export const listingsApi = {
  list: (params = {}) => {
    const query = new URLSearchParams();
    if (params.type) query.set('type', params.type);
    if (params.query) query.set('query', params.query);
    if (params.sort) query.set('sort', params.sort);
    if (params.genre) query.set('genre', params.genre);
    if (params.condition) query.set('condition', params.condition);
    if (params.city) query.set('city', params.city);
    if (params.minPrice) query.set('minPrice', params.minPrice);
    if (params.maxPrice) query.set('maxPrice', params.maxPrice);
    const qs = query.toString();
    return request(`/listings${qs ? `?${qs}` : ''}`);
  },
  get: (id) => request(`/listings/${id}`),
  create: (token, data) => request('/listings', { method: 'POST', headers: authHeaders(token), body: JSON.stringify(data) }),
  mine: (token) => request('/listings/mine', { headers: authHeaders(token) })
};

export const favoritesApi = {
  list: (token) => request('/favorites', { headers: authHeaders(token) }),
  toggle: (token, listingId) => request(`/favorites/${listingId}`, { method: 'POST', headers: authHeaders(token) })
};

export const booksApi = {
  best: (params = {}) => {
    const query = new URLSearchParams();
    if (params.genre) query.set('genre', params.genre);
    if (params.period) query.set('period', params.period);
    const qs = query.toString();
    return request(`/books/best${qs ? `?${qs}` : ''}`);
  },
  rate: (token, listingId, value) => request(`/books/${listingId}/rating`, {
    method: 'POST', headers: authHeaders(token), body: JSON.stringify({ value })
  }),
  myRating: (token, listingId) => request(`/books/${listingId}/rating`, { headers: authHeaders(token) })
};

export const chatsApi = {
  list: (token) => request('/chats', { headers: authHeaders(token) }),
  create: (token, listingId) => request('/chats', {
    method: 'POST', headers: authHeaders(token), body: JSON.stringify({ listingId })
  }),
  messages: (token, chatId) => request(`/chats/${chatId}/messages`, { headers: authHeaders(token) }),
  send: (token, chatId, text) => request(`/chats/${chatId}/messages`, {
    method: 'POST', headers: authHeaders(token), body: JSON.stringify({ text })
  })
};

export const moderationApi = {
  categories: () => request('/moderation/categories'),
  report: (token, listingId, reason) => request('/moderation/reports', {
    method: 'POST', headers: authHeaders(token), body: JSON.stringify({ listingId, reason })
  }),
  reports: (token) => request('/moderation/reports', { headers: authHeaders(token) }),
  setReportStatus: (token, id, status) => request(`/moderation/reports/${id}`, {
    method: 'PATCH', headers: authHeaders(token), body: JSON.stringify({ status })
  }),
  removeListing: (token, id) => request(`/moderation/listings/${id}`, {
    method: 'DELETE', headers: authHeaders(token)
  }),
  users: (token) => request('/moderation/users', { headers: authHeaders(token) }),
  blockUser: (token, id, isBlocked) => request(`/moderation/users/${id}/block`, {
    method: 'PATCH', headers: authHeaders(token), body: JSON.stringify({ isBlocked })
  }),
  setUserRole: (token, id, role) => request(`/moderation/users/${id}/role`, {
    method: 'PATCH', headers: authHeaders(token), body: JSON.stringify({ role })
  }),
  createCategory: (token, name) => request('/moderation/categories', {
    method: 'POST', headers: authHeaders(token), body: JSON.stringify({ name })
  }),
  deleteCategory: (token, id) => request(`/moderation/categories/${id}`, {
    method: 'DELETE', headers: authHeaders(token)
  }),
  reviews: (sellerId) => request(`/moderation/reviews/${sellerId}`),
  createReview: (token, data) => request('/moderation/reviews', {
    method: 'POST', headers: authHeaders(token), body: JSON.stringify(data)
  })
};
