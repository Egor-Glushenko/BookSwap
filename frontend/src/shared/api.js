const RAW_API_URL = import.meta.env.VITE_API_URL || '/api';

export const API_URL = RAW_API_URL.replace(/\/+$/, '');

// When the API lives on another origin (Vercel frontend + Render API) uploaded
// files are returned as relative /uploads/... paths and must be prefixed.
export const API_ORIGIN = /^https?:\/\//i.test(API_URL) ? new URL(API_URL).origin : '';

export function mediaUrl(path) {
  if (!path) return '';
  if (/^(https?:)?\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) return path;
  return `${API_ORIGIN}${path}`;
}

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

async function request(path, { method = 'GET', body, token, signal, formData, headers = {} } = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      signal,
      headers: {
        ...(formData ? {} : body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers
      },
      body: formData || (body !== undefined ? JSON.stringify(body) : undefined)
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('Нет связи с сервером. Проверьте подключение к интернету.', 0);
  }

  const text = response.status === 204 ? '' : await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { error: text };
    }
  }

  if (!response.ok) {
    if (response.status === 401 && token) {
      window.dispatchEvent(new CustomEvent('bookswap:unauthorized'));
    }
    throw new ApiError(payload?.error || `Запрос не выполнен (${response.status})`, response.status, payload);
  }
  return payload;
}

const query = (params) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === 'all') return;
    search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
};

export const authApi = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  me: (token, signal) => request('/auth/me', { token, signal }),
  updateProfile: (token, payload) => request('/auth/me', { method: 'PATCH', token, body: payload }),
  logout: (token) => request('/auth/logout', { method: 'POST', token })
};

export const usersApi = {
  profile: (id, signal) => request(`/users/${id}`, { signal })
};

export const listingsApi = {
  list: (params = {}, signal) => request(`/listings${query(params)}`, { signal }),
  filters: (signal) => request('/listings/filters', { signal }),
  get: (id, signal) => request(`/listings/${id}`, { signal }),
  similar: (id, signal) => request(`/listings/${id}/similar`, { signal }),
  mine: (token, status = 'all', signal) => request(`/listings/mine${query({ status })}`, { token, signal }),
  create: (token, data) => request('/listings', { method: 'POST', token, body: data }),
  update: (token, id, data) => request(`/listings/${id}`, { method: 'PATCH', token, body: data }),
  setStatus: (token, id, status) => request(`/listings/${id}/status`, { method: 'PATCH', token, body: { status } }),
  remove: (token, id) => request(`/listings/${id}`, { method: 'DELETE', token })
};

export const favoritesApi = {
  list: (token, signal) => request('/favorites', { token, signal }),
  toggle: (token, listingId) => request(`/favorites/${listingId}`, { method: 'POST', token })
};

export const booksApi = {
  best: (params = {}, signal) => request(`/books/best${query(params)}`, { signal }),
  ratings: (listingId, signal) => request(`/books/${listingId}/ratings`, { signal }),
  rate: (token, listingId, value, review) => request(`/books/${listingId}/rating`, {
    method: 'POST',
    token,
    body: { value, review }
  }),
  myRating: (token, listingId, signal) => request(`/books/${listingId}/rating`, { token, signal })
};

export const chatsApi = {
  list: (token, signal) => request('/chats', { token, signal }),
  unread: (token, signal) => request('/chats/unread-count', { token, signal }),
  create: (token, listingId) => request('/chats', { method: 'POST', token, body: { listingId } }),
  messages: (token, chatId, { after = 0 } = {}) => request(`/chats/${chatId}/messages${query({ after })}`, { token }),
  send: (token, chatId, text) => request(`/chats/${chatId}/messages`, { method: 'POST', token, body: { text } })
};

export const moderationApi = {
  categories: (signal) => request('/moderation/categories', { signal }),
  stats: (token, signal) => request('/moderation/stats', { token, signal }),
  reports: (token, status = 'all', signal) => request(`/moderation/reports${query({ status })}`, { token, signal }),
  setReportStatus: (token, id, status) => request(`/moderation/reports/${id}`, {
    method: 'PATCH',
    token,
    body: { status }
  }),
  listings: (token, status = 'all', signal) => request(`/moderation/listings${query({ status })}`, { token, signal }),
  removeListing: (token, id) => request(`/moderation/listings/${id}`, { method: 'DELETE', token }),
  users: (token, signal) => request('/moderation/users', { token, signal }),
  blockUser: (token, id, isBlocked) => request(`/moderation/users/${id}/block`, {
    method: 'PATCH',
    token,
    body: { isBlocked }
  }),
  setUserRole: (token, id, role) => request(`/moderation/users/${id}/role`, {
    method: 'PATCH',
    token,
    body: { role }
  }),
  createCategory: (token, name) => request('/moderation/categories', { method: 'POST', token, body: { name } }),
  deleteCategory: (token, id) => request(`/moderation/categories/${id}`, { method: 'DELETE', token }),
  reviews: (sellerId, signal) => request(`/moderation/reviews/${sellerId}`, { signal }),
  report: (token, listingId, reason) => request('/moderation/reports', {
    method: 'POST',
    token,
    body: { listingId, reason }
  }),
  createReview: (token, payload) => request('/moderation/reviews', { method: 'POST', token, body: payload })
};

export const uploadsApi = {
  image: (token, file) => {
    const formData = new FormData();
    formData.append('image', file);
    return request('/uploads/image', { method: 'POST', token, formData });
  }
};
