import cors from 'cors';
import express from 'express';

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const listings = [
  { id: 1, type: 'Продажа', title: 'Вино из одуванчиков', author: 'Рэй Брэдбери', price: 350, city: 'Москва', rating: 4.9 },
  { id: 2, type: 'Обмен', title: 'Норвежский лес', author: 'Харуки Мураками', price: null, city: 'Санкт-Петербург', rating: 4.8 },
  { id: 3, type: 'Бесплатно', title: 'Краткая история времени', author: 'Стивен Хокинг', price: 0, city: 'Казань', rating: 4.7 }
];

const ratings = new Map();
const favorites = new Set();
const chats = [{ id: 1, listingId: 1, participant: 'Анна В.', unread: 2, lastMessage: 'Могу забрать завтра, если удобно' }];

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'bookswap-api' }));
app.get('/api/listings', (req, res) => {
  const type = req.query.type;
  const query = String(req.query.query || '').toLowerCase();
  const result = listings.filter((listing) => (!type || type === 'Все' || listing.type === type) && `${listing.title} ${listing.author}`.toLowerCase().includes(query));
  res.json({ data: result, total: result.length });
});
app.post('/api/listings', (req, res) => res.status(201).json({ data: { id: Date.now(), ...req.body, status: 'На модерации' } }));
app.get('/api/books/best', (req, res) => {
  const genre = req.query.genre;
  const period = req.query.period || 'all';
  const data = listings.filter((book) => !genre || book.genre === genre).map((book) => ({ ...book, period, reviews: book.rating === 4.9 ? 1248 : 984 }));
  res.json({ data, total: data.length });
});
app.post('/api/auth/login', (req, res) => {
  const email = String(req.body.email || '').trim();
  const password = String(req.body.password || '');
  if (!email || !password) return res.status(400).json({ error: 'Email и пароль обязательны' });
  res.json({ user: { id: 1, email, name: req.body.name || 'Александра', city: 'Москва', role: 'user', rating: 4.9, deals: 24 }, token: 'demo-session-token' });
});
app.post('/api/books/:id/rating', (req, res) => {
  const value = Math.min(5, Math.max(1, Number(req.body.value)));
  ratings.set(Number(req.params.id), value);
  res.json({ bookId: Number(req.params.id), value, saved: true });
});
app.get('/api/favorites', (_req, res) => res.json({ data: [...favorites] }));
app.post('/api/favorites/:listingId', (req, res) => {
  const listingId = Number(req.params.listingId);
  favorites.has(listingId) ? favorites.delete(listingId) : favorites.add(listingId);
  res.json({ listingId, favorite: favorites.has(listingId) });
});
app.get('/api/chats', (_req, res) => res.json({ data: chats }));
app.post('/api/chats', (req, res) => {
  const chat = { id: Date.now(), listingId: req.body.listingId, participant: req.body.participant || 'Новый пользователь', unread: 0, lastMessage: '' };
  chats.unshift(chat);
  res.status(201).json({ data: chat });
});
app.post('/api/chats/:id/messages', (req, res) => {
  const text = String(req.body.text || '').trim();
  if (!text || text.length > 2000) return res.status(400).json({ error: 'Сообщение должно быть от 1 до 2000 символов' });
  const chat = chats.find((item) => item.id === Number(req.params.id));
  if (chat) chat.lastMessage = text;
  res.status(201).json({ data: { id: Date.now(), chatId: Number(req.params.id), text, status: 'sent', createdAt: new Date().toISOString() } });
});

app.listen(port, () => console.log(`BookSwap API listening on http://localhost:${port}`));
