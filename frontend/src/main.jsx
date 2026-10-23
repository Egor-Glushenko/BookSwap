import React, { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowUpRight, Bell, BookMarked, BookOpen, Check, ChevronDown, Flag,
  Heart, ImagePlus, LogOut, MapPin, Menu, MessageCircle, MoreHorizontal,
  Paperclip, Plus, Search, Send, ShieldCheck, Smile, Sparkles, Star, Trash2, UserRound, Users, X
} from 'lucide-react';
import './styles.css';
import './shared/auth.css';
import './shared/responsive.css';
import { authApi, booksApi, chatsApi, favoritesApi, listingsApi, moderationApi } from './shared/api';

function BookArtwork({ tone = 'blue', title }) {
  return <div className={`book-art ${tone}`}><span>BOOK</span><strong>{title.split(' ').slice(0, 2).join(' ')}</strong><i>BookSwap edition</i></div>;
}

function Modal({ children, onClose }) {
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal" onMouseDown={(e) => e.stopPropagation()}>{children}<button className="icon-button modal-close" onClick={onClose}><X size={18} /></button></div></div>;
}

function Stars({ value, interactive = false, onChange }) {
  return <div className={`stars ${interactive ? 'interactive' : ''}`} aria-label={`Оценка ${value} из 5`}>{[1, 2, 3, 4, 5].map((star) => <button key={star} onClick={() => interactive && onChange?.(star)}><Star size={interactive ? 21 : 14} fill={star <= value ? 'currentColor' : 'none'} /></button>)}</div>;
}

function AuthModal({ onClose, onLogin }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const canSubmit = email.trim() && password.trim() && (mode === 'login' || (privacyAccepted && termsAccepted));
  const submit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    setError(''); setIsSubmitting(true);
    try { await onLogin({ email, password, mode }); }
    catch (requestError) { setError(requestError.message); setIsSubmitting(false); }
  };
  return <Modal onClose={onClose}><form className="auth-view" onSubmit={submit}><div className="auth-mark"><BookOpen size={21} /></div><span className="section-kicker">BOOKSWAP ACCOUNT</span><h2>{mode === 'login' ? <>Ваши книги.<br /><em>В одном месте.</em></> : <>Создайте<br /><em>свой книжный дом.</em></>}</h2><p>{mode === 'login' ? 'Войдите по email или специальному логину для служебного аккаунта.' : 'Регистрация занимает минуту — только email и пароль.'}</p><div className="auth-fields"><label className="auth-input"><UserRound size={16} /><input value={email} onChange={(event) => setEmail(event.target.value)} placeholder={mode === 'login' ? 'Email или специальный логин' : 'Email'} type={mode === 'login' ? 'text' : 'email'} autoFocus /></label><label className="auth-input"><span className="password-symbol">•••</span><input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Пароль" type="password" /></label></div>{mode === 'register' && <div className="consent-list"><label><input type="checkbox" checked={privacyAccepted} onChange={(event) => setPrivacyAccepted(event.target.checked)} /><span>Я принимаю <a href="/privacy-policy.html" target="_blank" rel="noreferrer">политику конфиденциальности</a></span></label><label><input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} /><span>Я принимаю <a href="/terms-of-use.html" target="_blank" rel="noreferrer">условия пользования</a></span></label></div>}{error && <p className="auth-error" role="alert">{error}</p>}<button className="button primary full" disabled={!canSubmit || isSubmitting}>{isSubmitting ? 'Проверяем…' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}</button><button type="button" className="auth-switch" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>{mode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}</button><small>{mode === 'login' ? 'Администратор и модератор входят только по специальной паре логин/пароль.' : 'Обычная регистрация всегда создаёт аккаунт пользователя.'}</small></form></Modal>;
}

function LandingPage({ onLogin }) {
  return <div className="landing-page"><header className="landing-nav"><a className="logo" href="#landing-top"><span className="logo-mark"><BookOpen size={17} /></span>BookSwap</a><nav><a href="#how-it-works">Как это работает</a><a href="#community">Сообщество</a><a href="/privacy-policy.html" target="_blank" rel="noreferrer">Документы</a></nav><button className="login-button" onClick={onLogin}>Войти</button></header><main id="landing-top"><section className="landing-hero"><div className="landing-copy"><span className="eyebrow"><span className="pulse" /> Книжное сообщество</span><h1>Передавайте<br /><em>истории дальше.</em></h1><p>BookSwap помогает найти нового читателя для каждой книги — продать, обменять или отдать её бесплатно.</p><button className="button primary" onClick={onLogin}>Войти по email <ArrowUpRight size={17} /></button></div><div className="landing-visual"><div className="landing-glow" /><div className="landing-books"><div className="landing-book back"><BookArtwork tone="orange" title="Ваша книга" /></div><div className="landing-book main"><BookArtwork tone="blue" title="BookSwap" /><div className="landing-book-caption"><span>КНИЖНЫЙ МАРКЕТ</span><strong>BookSwap</strong><small>Продажа · Обмен · Бесплатно</small></div></div><div className="landing-book front"><BookArtwork tone="yellow" title="Новая жизнь" /></div></div><div className="landing-note"><span className="check"><Check size={13} /></span><div><strong>Новая встреча</strong><small>Книги находят своих людей</small></div></div></div></section><section className="landing-features" id="how-it-works"><div><span className="feature-index">01</span><strong>Найдите</strong><p>Ищите книги по названию, автору, жанру и городу.</p></div><div><span className="feature-index">02</span><strong>Договоритесь</strong><p>Общайтесь с владельцем в спокойном встроенном чате.</p></div><div><span className="feature-index">03</span><strong>Передайте</strong><p>Продайте, обменяйте или подарите книгу новому читателю.</p></div></section><section className="landing-community" id="community"><div><span className="section-kicker">СООБЩЕСТВО</span><h2>Меньше вещей.<br /><em>Больше историй.</em></h2></div><p>Мы верим, что хорошая книга не должна пылиться на полке. У неё всегда есть следующий читатель.</p></section></main><footer className="landing-footer"><span>© 2024 BookSwap</span><span>Книги обретают новую жизнь.</span><div><a href="/privacy-policy.html" target="_blank" rel="noreferrer">Политика конфиденциальности</a><a href="/terms-of-use.html" target="_blank" rel="noreferrer">Условия пользования</a></div></footer></div>;
}

function CookieBanner({ onAccept }) {
  return <aside className="cookie-banner"><div className="cookie-copy"><strong>Мы используем cookie</strong><p>Они помогают запомнить ваши настройки и сделать BookSwap удобнее. Подробнее — в <a href="/privacy-policy.html" target="_blank" rel="noreferrer">политике конфиденциальности</a>.</p></div><button className="button primary small" onClick={onAccept}>Понятно</button></aside>;
}

const GENRES = ['Фантастика и фэнтези', 'Бизнес и экономика', 'Классика', 'Научпоп', 'Современная проза', 'Детские книги', 'Учебная литература'];

function CreateListingModal({ onClose, onDone }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: '', author: '', genre: '', year: '', publisher: '', isbn: '',
    type: 'Продажа', price: '', exchangeWant: '', condition: 'Хорошее',
    description: '', city: '', district: '', pickup: true, delivery: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const steps = ['Книга', 'Условия', 'Фото', 'Публикация'];
  const set = (key, value) => { setForm((current) => ({ ...current, [key]: value })); setError(''); };
  const publish = async () => {
    setError('');
    setSubmitting(true);
    try { await onDone(form); }
    catch (requestError) { setError(requestError.message || 'Не удалось опубликовать объявление'); }
    finally { setSubmitting(false); }
  };
  return <Modal onClose={onClose}><div className="form-view listing-form"><div className="modal-title"><div><span className="section-kicker">НОВОЕ ОБЪЯВЛЕНИЕ</span><h2>Поделитесь книгой</h2></div><span className="step-count">{step} / 4</span></div><div className="stepper">{steps.map((item, index) => <span className={index + 1 <= step ? 'active' : ''} key={item}><i>{index + 1}</i>{item}</span>)}</div>{step === 1 && <><label>Название книги<input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Например, Мастер и Маргарита" autoFocus /></label><label>Автор<input value={form.author} onChange={(e) => set('author', e.target.value)} placeholder="Имя автора" /></label><div className="form-two"><label>Жанр<select value={form.genre} onChange={(e) => set('genre', e.target.value)}><option value="">Выберите жанр</option>{GENRES.map((g) => <option key={g}>{g}</option>)}</select></label><label>Год издания<input value={form.year} onChange={(e) => set('year', e.target.value)} placeholder="2024" /></label></div><div className="form-two"><label>Издательство<input value={form.publisher} onChange={(e) => set('publisher', e.target.value)} placeholder="Необязательно" /></label><label>ISBN<input value={form.isbn} onChange={(e) => set('isbn', e.target.value)} placeholder="978-5-..." /></label></div></>}{step === 2 && <><div className="choice-label">Тип объявления</div><div className="listing-types">{['Продажа', 'Обмен', 'Бесплатно'].map((item) => <button type="button" className={form.type === item ? 'selected' : ''} onClick={() => set('type', item)} key={item}><strong>{item}</strong><span>{item === 'Продажа' ? 'Укажите цену' : item === 'Обмен' ? 'Что хотите взамен' : 'Подарите книгу'}</span></button>)}</div>{form.type === 'Продажа' && <label>Цена<input value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="350" type="number" min="1" /></label>}{form.type === 'Обмен' && <label>Хочу получить взамен<input value={form.exchangeWant} onChange={(e) => set('exchangeWant', e.target.value)} placeholder="Например, современную прозу" /></label>}<label>Состояние<select value={form.condition} onChange={(e) => set('condition', e.target.value)}><option>Новое</option><option>Отличное</option><option>Хорошее</option><option>Удовлетворительное</option></select></label><label>Описание<textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Расскажите о книге и её состоянии" maxLength="2000" /></label></>}{step === 3 && <><div className="upload-box upload-large"><ImagePlus size={24} /><strong>Фото можно добавить позже</strong><span>Загрузка изображений будет доступна в следующей версии</span></div><div className="form-two"><label>Город *<input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Москва" /></label><label>Район / метро<input value={form.district} onChange={(e) => set('district', e.target.value)} placeholder="Необязательно" /></label></div><label className="check-row"><input type="checkbox" checked={form.pickup} onChange={(e) => set('pickup', e.target.checked)} /> Самовывоз</label><label className="check-row"><input type="checkbox" checked={form.delivery} onChange={(e) => set('delivery', e.target.checked)} /> Готов отправить доставкой</label></>}{step === 4 && <div className="publish-preview"><BookArtwork tone="blue" title={form.title || 'Ваша книга'} /><div><span className="section-kicker">ПРЕДПРОСМОТР</span><h3>{form.title || 'Без названия'}</h3><p>{form.author || 'Автор не указан'} · {form.type}{form.type === 'Продажа' && form.price ? ` · ${form.price} ₽` : ''}</p><span className="moderation-note"><ShieldCheck size={15} /> Объявление будет опубликовано сразу</span></div></div>}{error && <p className="auth-error" role="alert">{error}</p>}<div className="form-actions">{step > 1 && <button type="button" className="button outline" onClick={() => setStep(step - 1)}>Назад</button>}<button type="button" className="button primary" disabled={submitting} onClick={() => { if (step === 3 && !form.city.trim()) { setError('Укажите город'); return; } if (step < 4) { setError(''); setStep(step + 1); } else publish(); }}>{submitting ? 'Публикуем…' : step < 4 ? 'Продолжить' : 'Опубликовать'} <ArrowUpRight size={16} /></button></div></div></Modal>;
}

function BookCard({ book, onOpen, onFavorite, favorite }) {
  return <article className="book-card" onClick={() => onOpen(book)}>
    <div className="card-image-wrap"><BookArtwork tone={book.tone} title={book.title} /><button className={`heart-button ${favorite ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onFavorite(book.id); }}><Heart size={18} fill={favorite ? 'currentColor' : 'none'} /></button><span className={`listing-tag ${book.type === 'Обмен' ? 'swap' : book.type === 'Бесплатно' ? 'free' : ''}`}>{book.type}</span></div>
    <div className="card-body"><div className="card-heading"><div><h3>{book.title}</h3><p>{book.author}</p></div><strong className="card-price">{book.price}</strong></div><div className="book-facts"><span>{book.genre}</span><span>{book.condition}</span></div><div className="card-footer"><span className="rating"><Star size={14} fill="currentColor" /> {book.rating}</span><span><MapPin size={13} /> {book.city}</span><span>{book.views} просмотров</span></div></div>
  </article>;
}

function App() {
  const [tab, setTab] = useState('Все');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('Сначала новые');
  const [filters, setFilters] = useState({ genre: '', condition: '', city: '', minPrice: '', maxPrice: '' });
  const [books, setBooks] = useState([]);
  const [bestBooks, setBestBooks] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [modal, setModal] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [userRating, setUserRating] = useState(0);
  const [savedSearch, setSavedSearch] = useState(false);
  const [session, setSession] = useState(() => JSON.parse(window.localStorage.getItem('bookswap-session') || 'null'));
  const [cookieAccepted, setCookieAccepted] = useState(() => window.localStorage.getItem('bookswap-cookie-consent') === 'accepted');
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [reports, setReports] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');

  const notify = (message) => { setToast(message); window.setTimeout(() => setToast(''), 2400); };
  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  const loadListings = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listingsApi.list({ type: tab === 'Все' ? undefined : tab, query, sort, ...filters });
      setBooks(result.data);
    } catch (error) {
      notify(error.message);
    } finally {
      setLoading(false);
    }
  }, [tab, query, sort, filters]);

  const requireSession = (message = 'Войдите, чтобы продолжить') => {
    if (session) return true;
    notify(message);
    setModal('auth');
    return false;
  };

  const loadUserData = useCallback(async (token) => {
    try {
      const [favResult, chatResult, mineResult] = await Promise.all([
        favoritesApi.list(token),
        chatsApi.list(token),
        listingsApi.mine(token)
      ]);
      setFavorites(favResult.data);
      setChats(chatResult.data);
      setMyListings(mineResult.data);
    } catch (error) {
      notify(error.message);
    }
  }, []);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  useEffect(() => {
    booksApi.best().then((result) => setBestBooks(result.data)).catch((error) => notify(error.message));
  }, []);

  useEffect(() => {
    if (session) loadUserData(session.token);
    else {
      setFavorites([]);
      setChats([]);
      setMyListings([]);
    }
  }, [session, loadUserData]);

  const openBook = async (book) => {
    setSelectedBook(book);
    setUserRating(0);
    if (session) {
      try {
        const result = await booksApi.myRating(session.token, book.id);
        if (result.value) setUserRating(Number(result.value));
      } catch { /* ignore */ }
    }
  };

  const toggleFavorite = async (id) => {
    if (!requireSession('Войдите, чтобы добавлять книги в избранное')) return;
    try {
      const result = await favoritesApi.toggle(session.token, id);
      setFavorites((current) => result.favorite
        ? [...current, id]
        : current.filter((item) => item !== id));
      notify(result.favorite ? 'Добавлено в избранное' : 'Удалено из избранного');
    } catch (error) {
      notify(error.message);
    }
  };

  const handleAuth = async ({ email, password, mode }) => {
    const result = mode === 'register'
      ? await authApi.register(email, password)
      : await authApi.login(email, password);
    const nextSession = { token: result.token, user: result.user };
    window.localStorage.setItem('bookswap-session', JSON.stringify(nextSession));
    setSession(nextSession);
    setModal(null);
    notify(mode === 'register' ? 'Аккаунт создан. Добро пожаловать!' : 'Вы вошли в BookSwap');
  };

  const handleLogout = async () => {
    try { await authApi.logout(session.token); } catch { /* ignore */ }
    window.localStorage.removeItem('bookswap-session');
    setSession(null);
    setModal(null);
    notify('Вы вышли из аккаунта');
  };

  const handleCreateListing = async (form) => {
    if (!requireSession('Войдите, чтобы разместить объявление')) return;
    await listingsApi.create(session.token, form);
    setModal(null);
    await loadListings();
    await loadUserData(session.token);
    notify('Объявление опубликовано');
  };

  const handleRate = async (value) => {
    if (!selectedBook || !requireSession('Войдите, чтобы оценивать книги')) return;
    try {
      const result = await booksApi.rate(session.token, selectedBook.id, value);
      setUserRating(value);
      setSelectedBook((current) => current ? { ...current, rating: result.avg, reviews: result.count } : current);
      setBooks((current) => current.map((book) => book.id === selectedBook.id ? { ...book, rating: result.avg, reviews: result.count } : book));
      notify(`Ваша оценка: ${value} из 5`);
    } catch (error) {
      notify(error.message);
    }
  };

  const openChat = async (listingId) => {
    if (!requireSession('Войдите, чтобы написать продавцу')) return;
    try {
      const result = await chatsApi.create(session.token, listingId);
      const chatResult = await chatsApi.list(session.token);
      setChats(chatResult.data);
      setActiveChatId(result.data.id);
      const msgResult = await chatsApi.messages(session.token, result.data.id);
      setMessages(msgResult.data);
      setModal('chat');
    } catch (error) {
      notify(error.message);
    }
  };

  const selectChat = async (chatId) => {
    setActiveChatId(chatId);
    try {
      const msgResult = await chatsApi.messages(session.token, chatId);
      setMessages(msgResult.data);
      const chatResult = await chatsApi.list(session.token);
      setChats(chatResult.data);
    } catch (error) {
      notify(error.message);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !activeChatId) return;
    try {
      const result = await chatsApi.send(session.token, activeChatId, messageText.trim());
      setMessages((current) => [...current, result.data]);
      setMessageText('');
      const chatResult = await chatsApi.list(session.token);
      setChats(chatResult.data);
    } catch (error) {
      notify(error.message);
    }
  };

  const reportSelectedBook = async () => {
    if (!selectedBook || !requireSession('Войдите, чтобы отправить жалобу')) return;
    const reason = window.prompt('Причина жалобы');
    if (!reason?.trim()) return;
    try {
      await moderationApi.report(session.token, selectedBook.id, reason.trim());
      notify('Жалоба отправлена модератору');
    } catch (error) {
      notify(error.message);
    }
  };

  const reviewSeller = async () => {
    if (!selectedBook || !requireSession('Войдите, чтобы оставить отзыв о сделке')) return;
    const rating = Number(window.prompt('Оценка продавца от 1 до 5'));
    if (!rating) return;
    const text = window.prompt('Короткий отзыв') || '';
    try {
      await moderationApi.createReview(session.token, { sellerId: selectedBook.sellerId, listingId: selectedBook.id, rating, text });
      notify('Отзыв о сделке сохранён');
    } catch (error) {
      notify(error.message);
    }
  };

  const loadModeration = async () => {
    if (!session || !['moderator', 'admin'].includes(session.user.role)) return;
    try {
      const [reportResult, categoryResult, usersResult] = await Promise.all([
        moderationApi.reports(session.token),
        moderationApi.categories(),
        session.user.role === 'admin' ? moderationApi.users(session.token) : Promise.resolve({ data: [] })
      ]);
      setReports(reportResult.data);
      setCategories(categoryResult.data);
      setAdminUsers(usersResult.data);
    } catch (error) {
      notify(error.message);
    }
  };

  const openModeration = async () => {
    setModal('moderation');
    await loadModeration();
  };

  const changeReportStatus = async (id, status) => {
    try {
      await moderationApi.setReportStatus(session.token, id, status);
      await loadModeration();
      notify('Статус жалобы обновлён');
    } catch (error) {
      notify(error.message);
    }
  };

  const deleteListingAsModerator = async (id) => {
    try {
      await moderationApi.removeListing(session.token, id);
      await loadListings();
      await loadModeration();
      notify('Объявление удалено из ленты');
    } catch (error) {
      notify(error.message);
    }
  };

  const blockUser = async (id, isBlocked) => {
    try {
      await moderationApi.blockUser(session.token, id, isBlocked);
      await loadModeration();
      notify(isBlocked ? 'Пользователь заблокирован' : 'Пользователь разблокирован');
    } catch (error) {
      notify(error.message);
    }
  };

  const changeUserRole = async (id, role) => {
    try {
      await moderationApi.setUserRole(session.token, id, role);
      await loadModeration();
      notify('Роль пользователя обновлена');
    } catch (error) {
      notify(error.message);
    }
  };

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      await moderationApi.createCategory(session.token, newCategory.trim());
      setNewCategory('');
      await loadModeration();
      notify('Категория сохранена');
    } catch (error) {
      notify(error.message);
    }
  };

  const removeCategory = async (id) => {
    try {
      await moderationApi.deleteCategory(session.token, id);
      await loadModeration();
      notify('Категория удалена');
    } catch (error) {
      notify(error.message);
    }
  };

  const unreadCount = chats.reduce((sum, chat) => sum + (chat.unread || 0), 0);
  const activeChat = chats.find((chat) => chat.id === activeChatId);
  const tabCounts = {
    'Все': books.length,
    'Продажа': books.filter((b) => b.type === 'Продажа').length,
    'Обмен': books.filter((b) => b.type === 'Обмен').length,
    'Бесплатно': books.filter((b) => b.type === 'Бесплатно').length
  };
  const featuredBook = books[0];

  return <div className="app-shell">
    <header className="topbar"><a className="logo" href="#top"><span className="logo-mark"><BookOpen size={17} /></span>BookSwap</a><nav className="main-nav"><a className="active" href="#market">Маркет</a><a href="#best">Лучшие книги</a>{session && <a href="#messages" onClick={(e) => { e.preventDefault(); setModal('chat'); }}>Сообщения{unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}</a>}</nav><div className="top-actions"><button className="search-trigger" onClick={() => document.querySelector('.search-input')?.focus()}><Search size={17} /><span>Поиск книг</span><kbd>⌘ K</kbd></button>{session && <button className="notification-button" onClick={() => notify('Новых уведомлений нет')}><Bell size={17} />{unreadCount > 0 && <i />}</button>}{session ? <button className="avatar" onClick={() => setModal('profile')}>{session.user.name[0].toUpperCase()}</button> : <button className="login-button" onClick={() => setModal('auth')}>Войти</button>}<button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)}><Menu size={20} /></button></div>{menuOpen && <div className="mobile-nav"><a href="#market">Маркет</a><a href="#best">Лучшие книги</a>{session ? <a href="#messages" onClick={() => setModal('chat')}>Сообщения</a> : <a href="#login" onClick={(e) => { e.preventDefault(); setModal('auth'); }}>Войти</a>}</div>}</header>

    <main id="top"><section className="hero"><div className="hero-copy"><div className="eyebrow"><span className="pulse" /> Сообщество читателей</div><h1>Книги находят<br /><em>своих людей.</em></h1><p>Покупайте, обменивайтесь и отдавайте книги тем, кому они нужны. Гости могут смотреть каталог, а сделки доступны после входа.</p><div className="hero-actions"><button className="button primary" onClick={() => document.querySelector('.search-input')?.focus()}>Найти книгу <ArrowUpRight size={17} /></button><button className="button text-button" onClick={() => session ? setModal('create') : setModal('auth')}><Plus size={17} /> Разместить объявление</button></div></div><div className="hero-visual"><div className="hero-orb orb-one" /><div className="hero-orb orb-two" />{featuredBook ? <div className="hero-book-card"><BookArtwork tone={featuredBook.tone} title={featuredBook.title} /><div className="hero-book-meta"><span className="mini-label">ПОСЛЕДНЕЕ ОБЪЯВЛЕНИЕ</span><strong>{featuredBook.title}</strong><span>{featuredBook.author} · {featuredBook.price}</span></div><button className="circle-arrow" onClick={() => openBook(featuredBook)}><ArrowUpRight size={19} /></button></div> : <div className="hero-book-card"><BookArtwork tone="blue" title="BookSwap" /><div className="hero-book-meta"><span className="mini-label">КАТАЛОГ ПУСТ</span><strong>Разместите первое объявление</strong><span>JWT-сессия потребуется при публикации</span></div><button className="circle-arrow" onClick={() => session ? setModal('create') : setModal('auth')}><Plus size={19} /></button></div>}<div className="floating-note"><span className="check"><Check size={13} /></span><div><strong>{books.length} объявлений</strong><small>в каталоге BookSwap</small></div></div></div></section>

    <section className="market-section" id="market"><div className="section-head"><div><span className="section-kicker">ОБЪЯВЛЕНИЯ</span><h2>Найдите следующую историю</h2></div><button className="button small outline" onClick={() => setModal('filters')}>Все фильтры <ChevronDown size={15} /></button></div><div className="toolbar"><div className="tabs">{['Все', 'Продажа', 'Обмен', 'Бесплатно'].map((item) => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}<span>{tabCounts[item] ?? 0}</span></button>)}</div><div className="sort-select"><span>Сортировка:</span><select value={sort} onChange={(e) => setSort(e.target.value)}><option>Сначала новые</option><option>По рейтингу</option><option>По цене</option></select><ChevronDown size={14} /></div></div><div className="search-row"><div className="search-box"><Search size={18} /><input className="search-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Название, автор или жанр" /><span className="search-shortcut">⌘ K</span></div><button className="location-filter"><MapPin size={16} /> {session?.user.city || 'Все города'} <ChevronDown size={14} /></button><button className="filter-icon" onClick={() => setModal('filters')}><MoreHorizontal size={19} /></button></div>{loading ? <div className="empty-state"><Search size={32} /><h3>Загружаем объявления…</h3></div> : <div className="book-grid">{books.map((book) => <BookCard key={book.id} book={book} onOpen={openBook} onFavorite={toggleFavorite} favorite={favorites.includes(book.id)} />)}</div>}{!loading && books.length === 0 && <div className="empty-state"><Search size={32} /><h3>Ничего не нашли</h3><p>Попробуйте изменить запрос или разместите первое объявление.</p><button className="button primary" onClick={() => session ? setModal('create') : setModal('auth')}><Plus size={16} /> Разместить объявление</button></div>}</section>

    <section className="best-section" id="best"><div className="best-copy"><span className="section-kicker">ВЫБОР СООБЩЕСТВА</span><h2>Книги,<br /><em>которые любят.</em></h2><p>Рейтинг строится на честных оценках читателей, которые действительно держали книгу в руках.</p><div className="best-filters"><button className="active">Все жанры</button><button>За всё время <ChevronDown size={13} /></button></div></div><div className="rank-list">{bestBooks.length === 0 ? <div className="empty-state"><Star size={32} /><h3>Пока нет оценённых книг</h3><p>Оцените книги, чтобы они попали в топ.</p></div> : bestBooks.slice(0, 10).map((book, index) => <button className="rank-item" key={`${book.title}-${book.author}`} onClick={() => { const match = books.find((b) => b.id === book.id); if (match) openBook(match); }}><span className="rank-number">{String(index + 1).padStart(2, '0')}</span><BookArtwork tone={book.tone} title={book.title} /><span className="rank-title"><strong>{book.title}</strong><small>{book.author}</small></span><span className="rank-rating"><Star size={14} fill="currentColor" /> {book.rating}<small>{book.reviews} оценок</small></span><ArrowUpRight size={17} /></button>)}<div className="best-extra"><span><BookMarked size={16} /> Сейчас читают</span><span><UserRound size={16} /> Популярные авторы</span><span><Sparkles size={16} /> Новинки каталога</span></div></div></section>

    <section className="trust-row"><div><Sparkles size={20} /><strong>Сделано для людей</strong><span>Без лишнего шума и сложных сценариев.</span></div><div><MessageCircle size={20} /><strong>Живое общение</strong><span>Договоритесь о сделке в удобном чате.</span></div><div><Star size={20} /><strong>Честные оценки</strong><span>Рейтинг книг и продавцов отдельно.</span></div></section>
    <footer><a className="logo" href="#top"><span className="logo-mark"><BookOpen size={15} /></span>BookSwap</a><span>Книги обретают новую жизнь.</span><span>© 2024 BookSwap</span></footer></main>

    {selectedBook && <Modal onClose={() => setSelectedBook(null)}><div className="detail-view"><div className="detail-gallery"><BookArtwork tone={selectedBook.tone} title={selectedBook.title} /><span className="gallery-count">Обложка</span></div><div className="detail-content"><div className="detail-topline"><span className="listing-tag">{selectedBook.type}</span><button className={`heart-button ${favorites.includes(selectedBook.id) ? 'active' : ''}`} onClick={() => toggleFavorite(selectedBook.id)}><Heart size={18} fill={favorites.includes(selectedBook.id) ? 'currentColor' : 'none'} /></button></div><h2>{selectedBook.title}</h2><p className="detail-author">{selectedBook.author}</p><div className="detail-rating"><span><Star size={17} fill="currentColor" /> {selectedBook.rating}</span><span>{selectedBook.reviews} оценок</span><span>{selectedBook.genre}</span></div><div className="book-rating-box"><div><strong>Оцените книгу</strong><small>{session ? 'Ваша оценка сохранится сразу' : 'Доступно после входа'}</small></div><Stars value={userRating} interactive onChange={handleRate} /></div><p className="detail-description">{selectedBook.description || 'Описание не указано.'}</p>{selectedBook.exchangeWant && <p className="detail-description"><strong>Хочу взамен:</strong> {selectedBook.exchangeWant}</p>}<div className="detail-specs"><span>Издательство<strong>{selectedBook.publisher || '—'}</strong></span><span>Год издания<strong>{selectedBook.year || '—'}</strong></span><span>ISBN<strong>{selectedBook.isbn || '—'}</strong></span><span>Состояние<strong>{selectedBook.condition}</strong></span><span>Город<strong>{selectedBook.city}</strong></span><span>Просмотры<strong>{selectedBook.views}</strong></span></div><div className="seller"><div className="seller-avatar">{selectedBook.seller[0]}</div><div><strong>{selectedBook.seller}</strong><span>Рейтинг продавца {selectedBook.sellerRating} · {selectedBook.sellerDeals} сделок</span></div></div><div className="detail-actions">{selectedBook.sellerId !== session?.user.id && <button className="button primary" onClick={() => { setSelectedBook(null); openChat(selectedBook.id); }}>Написать продавцу <MessageCircle size={16} /></button>}<button className="button outline" onClick={() => toggleFavorite(selectedBook.id)}>{favorites.includes(selectedBook.id) ? 'В избранном' : 'В избранное'}</button></div>{selectedBook.sellerId !== session?.user.id && <button className="report-button" onClick={reviewSeller}><Star size={13} /> Оставить отзыв о сделке</button>}<button className="report-button" onClick={reportSelectedBook}><Flag size={13} /> Пожаловаться на объявление</button></div></div></Modal>}
    {modal === 'auth' && <AuthModal onClose={() => setModal(null)} onLogin={handleAuth} />}
    {modal === 'chat' && <Modal onClose={() => setModal(null)}><div className="chat-view"><div className="modal-title"><div><span className="section-kicker">СООБЩЕНИЯ</span><h2>Ваши чаты</h2></div></div>{chats.length === 0 ? <div className="empty-state"><MessageCircle size={32} /><h3>Нет сообщений</h3><p>Напишите продавцу с карточки объявления.</p></div> : <><div className="chat-list">{chats.map((chat) => <button className={`chat-item ${activeChatId === chat.id ? 'active' : ''}`} key={chat.id} onClick={() => selectChat(chat.id)}><div className="chat-avatar">{chat.participant[0]}</div><div><strong>{chat.participant}</strong><span>{chat.listingTitle}</span><small>{chat.lastMessage || 'Нет сообщений'}</small></div>{chat.unread > 0 ? <b>{chat.unread}</b> : null}</button>)}</div>{activeChat && <div className="chat-messages">{messages.map((msg) => <div className={`chat-message ${msg.senderId === session.user.id ? 'own' : ''}`} key={msg.id}><p>{msg.text}</p><time>{new Date(msg.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</time></div>)}</div>}<div className="message-compose"><button className="composer-tool"><Paperclip size={16} /></button><input maxLength="2000" value={messageText} onChange={(e) => setMessageText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder="Написать сообщение..." /><button className="composer-tool"><Smile size={16} /></button><button className="circle-arrow" onClick={sendMessage}><Send size={16} /></button></div><small className="message-limit">До 2000 символов</small></>}</div></Modal>}
    {modal === 'create' && <CreateListingModal onClose={() => setModal(null)} onDone={handleCreateListing} />}
    {modal === 'profile' && session && <Modal onClose={() => setModal(null)}><div className="profile-view"><div className="profile-header"><div className="profile-avatar">{session.user.name[0].toUpperCase()}</div><div><h2>{session.user.name}</h2><p><MapPin size={14} /> {session.user.city} · с {new Date(session.user.createdAt).getFullYear()}</p></div><button className="icon-button" onClick={handleLogout} title="Выйти"><LogOut size={18} /></button></div><div className="profile-stats"><span><strong>{session.user.rating || 0}</strong>рейтинг</span><span><strong>{session.user.deals || 0}</strong>сделки</span><span><strong>{favorites.length}</strong>избранных</span></div><div className="profile-section"><span className="section-kicker">МОИ КНИГИ</span><h3>Активные объявления ({myListings.length})</h3>{myListings.length === 0 ? <p>У вас пока нет объявлений.</p> : <div className="mini-books">{myListings.map((book) => <button key={book.id} onClick={() => { setModal(null); openBook(book); }}><BookArtwork tone={book.tone} title={book.title} /><span>{book.title}</span></button>)}</div>}</div>{['moderator', 'admin'].includes(session.user.role) && <div className="profile-section"><span className="section-kicker">УПРАВЛЕНИЕ</span><h3>{session.user.role === 'admin' ? 'Панель администратора' : 'Панель модератора'}</h3><button className="button outline full" onClick={openModeration}><ShieldCheck size={16} /> Открыть управление</button></div>}</div></Modal>}
    {modal === 'moderation' && session && <Modal onClose={() => setModal(null)}><div className="moderation-view"><div className="modal-title"><div><span className="section-kicker">РОЛЬ: {session.user.role.toUpperCase()}</span><h2>Управление платформой</h2></div></div><section><h3>Жалобы</h3>{reports.length === 0 ? <p className="muted">Новых жалоб нет.</p> : reports.map((report) => <div className="admin-row" key={report.id}><div><strong>{report.listing_title || 'Объявление удалено'}</strong><span>{report.reason} · {report.reporter_name} · продавец: {report.seller_name || 'не указан'} · {report.status}</span></div><button className="icon-button" onClick={() => deleteListingAsModerator(report.listing_id)} title="Удалить объявление"><Trash2 size={16} /></button>{report.seller_id && <button className="button small outline" onClick={() => blockUser(report.seller_id, true)}>Блокировать продавца</button>}<button className="button small outline" onClick={() => changeReportStatus(report.id, 'resolved')}>Решено</button></div>)}</section><section><h3>Категории</h3><div className="admin-compose"><input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Новая категория" /><button className="button primary small" onClick={addCategory}>Добавить</button></div><div className="category-list">{categories.map((category) => <button key={category.id} onClick={() => removeCategory(category.id)} title="Удалить категорию">{category.name}<X size={13} /></button>)}</div></section>{session.user.role === 'admin' && <section><h3>Пользователи и модераторы</h3>{adminUsers.map((item) => <div className="admin-row" key={item.id}><div><strong>{item.name}</strong><span>{item.email} · {item.role}{item.isBlocked ? ' · заблокирован' : ''}</span></div><button className="button small outline" onClick={() => blockUser(item.id, !item.isBlocked)}>{item.isBlocked ? 'Разблокировать' : 'Блокировать'}</button><select value={item.role} onChange={(e) => changeUserRole(item.id, e.target.value)}><option value="user">user</option><option value="moderator">moderator</option><option value="admin">admin</option></select></div>)}</section>}</div></Modal>}
    {modal === 'filters' && <Modal onClose={() => setModal(null)}><div className="form-view"><div className="modal-title"><div><span className="section-kicker">ФИЛЬТРЫ</span><h2>Настройте поиск</h2></div></div><label>Жанр<select value={filters.genre} onChange={(e) => setFilter('genre', e.target.value)}><option value="">Все жанры</option>{GENRES.map((g) => <option key={g}>{g}</option>)}</select></label><label>Состояние<select value={filters.condition} onChange={(e) => setFilter('condition', e.target.value)}><option value="">Любое состояние</option><option>Новое</option><option>Отличное</option><option>Хорошее</option><option>Удовлетворительное</option></select></label><label>Город<input value={filters.city} onChange={(e) => setFilter('city', e.target.value)} placeholder="Любой город" /></label><div className="form-two"><label>Цена от<input value={filters.minPrice} onChange={(e) => setFilter('minPrice', e.target.value)} placeholder="0 ₽" type="number" min="0" /></label><label>Цена до<input value={filters.maxPrice} onChange={(e) => setFilter('maxPrice', e.target.value)} placeholder="10 000 ₽" type="number" min="0" /></label></div><button className={`save-search ${savedSearch ? 'saved' : ''}`} onClick={() => setSavedSearch(!savedSearch)}><Bell size={14} /> {savedSearch ? 'Поиск сохранён' : 'Сохранить этот поиск'}</button><button className="button outline full" onClick={() => { setFilters({ genre: '', condition: '', city: '', minPrice: '', maxPrice: '' }); notify('Фильтры сброшены'); }}>Сбросить фильтры</button><button className="button primary full" onClick={() => { setModal(null); loadListings(); notify('Фильтры применены'); }}>Показать книги</button></div></Modal>}
    {!cookieAccepted && <CookieBanner onAccept={() => { window.localStorage.setItem('bookswap-cookie-consent', 'accepted'); setCookieAccepted(true); }} />}
    {toast && <div className="toast"><Check size={16} /> {toast}</div>}
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
