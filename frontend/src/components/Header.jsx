import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen, Heart, LayoutDashboard, Library, LogOut, Menu, MessageCircle, Moon,
  Plus, Search, ShieldCheck, Sun, UserRound, X
} from 'lucide-react';
import { useAuth } from '../shared/auth';
import { useFavorites } from '../shared/favorites';
import { useUnread } from '../shared/notifications';
import { useClickOutside, useHotkey, useLockBodyScroll, useTheme } from '../shared/hooks';
import { Avatar } from './Avatar';

const NAV_ITEMS = [
  { to: '/catalog', label: 'Каталог' },
  { to: '/how-it-works', label: 'Как это работает' }
];

export function Header() {
  const { user, isStaff, logout } = useAuth();
  const { count: unread, reset: resetUnread } = useUnread();
  const { count: favoritesCount } = useFavorites();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuRef = useRef(null);

  useClickOutside(menuRef, () => setMenuOpen(false));
  useLockBodyScroll(drawerOpen);

  useEffect(() => {
    setMenuOpen(false);
    setDrawerOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        setDrawerOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const goSearch = () => navigate('/catalog?focus=search');
  useHotkey(goSearch);

  const handleLogout = async () => {
    await logout();
    resetUnread();
    navigate('/');
  };

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" to="/" aria-label="BookSwap — на главную">
          <span className="brand-mark">
            <BookOpen size={18} />
          </span>
          <span>
            BookSwap
            <small>книжный маркет</small>
          </span>
        </Link>

        <nav className="nav-links" aria-label="Основная навигация">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`.trim()}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="header-actions">
          <button type="button" className="header-search" onClick={goSearch} aria-label="Поиск книг">
            <Search size={16} />
            <span>Поиск книг</span>
            <kbd>⌘K</kbd>
          </button>

          <button
            type="button"
            className="icon-button theme-toggle"
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
            title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user && (
            <Link className="icon-button header-messages" to="/chats" aria-label={unread ? `Сообщения, ${unread} новых` : 'Сообщения'}>
              <MessageCircle size={18} />
              {unread > 0 && <span className="badge-dot">{unread > 9 ? '9+' : unread}</span>}
            </Link>
          )}

          <Link className="btn btn-primary btn-sm header-cta" to="/sell">
            <Plus size={15} /> Разместить
          </Link>

          {user ? (
            <div className="menu-anchor" ref={menuRef}>
              <button
                type="button"
                className="user-chip"
                onClick={() => setMenuOpen((value) => !value)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                <Avatar name={user.name} src={user.avatarUrl} />
                <span className="user-chip-name">{String(user.name).split(' ')[0]}</span>
              </button>
              {menuOpen && (
                <div className="menu-panel" role="menu">
                  <div className="menu-head">
                    <strong>{user.name}</strong>
                    <span>{user.email || user.city}</span>
                  </div>
                  <Link className="menu-item" to="/profile" role="menuitem">
                    <UserRound size={15} /> Профиль и объявления
                  </Link>
                  <Link className="menu-item" to="/favorites" role="menuitem">
                    <Heart size={15} /> Избранное
                    {favoritesCount > 0 && <span className="badge soft" style={{ marginLeft: 'auto' }}>{favoritesCount}</span>}
                  </Link>
                  <Link className="menu-item" to="/chats" role="menuitem">
                    <MessageCircle size={15} /> Сообщения
                    {unread > 0 && <span className="badge rose" style={{ marginLeft: 'auto' }}>{unread}</span>}
                  </Link>
                  {isStaff && (
                    <Link className="menu-item" to="/moderation" role="menuitem">
                      <ShieldCheck size={15} /> Модерация
                    </Link>
                  )}
                  <div className="menu-sep" />
                  <button type="button" className="menu-item danger" onClick={handleLogout} role="menuitem">
                    <LogOut size={15} /> Выйти
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link className="btn btn-secondary btn-sm header-login" to="/login">Войти</Link>
          )}

          <button
            type="button"
            className="icon-button mobile-toggle"
            onClick={() => setDrawerOpen((value) => !value)}
            aria-label="Меню"
            aria-expanded={drawerOpen}
          >
            {drawerOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {drawerOpen && (
        <div className="mobile-drawer">
          <NavLink to="/catalog" className="nav-link">Каталог</NavLink>
          <NavLink to="/how-it-works" className="nav-link">Как это работает</NavLink>
          {user && <NavLink to="/favorites" className="nav-link">Избранное <span className="count">{favoritesCount}</span></NavLink>}
          {user && <NavLink to="/chats" className="nav-link">Сообщения <span className="count">{unread}</span></NavLink>}
          {isStaff && <NavLink to="/moderation" className="nav-link">Модерация</NavLink>}
          <button type="button" className="drawer-theme" onClick={toggle}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          </button>
          <div className="drawer-actions">
            <Link className="btn btn-primary btn-block" to="/sell">
              <Plus size={16} /> Разместить объявление
            </Link>
            {user ? (
              <Link className="btn btn-secondary btn-block" to="/profile">Личный кабинет</Link>
            ) : (
              <Link className="btn btn-secondary btn-block" to="/login">Войти по email</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link className="brand" to="/">
              <span className="brand-mark">
                <BookOpen size={17} />
              </span>
              <span>BookSwap</span>
            </Link>
            <p>Сервис, который помогает книгам находить новых читателей. Продавайте, обменивайтесь и отдавайте бесплатно.</p>
            <div className="row" style={{ gap: 6 }}>
              <span className="badge soft">
                <Library size={12} /> Каталог
              </span>
              <span className="badge soft">
                <LayoutDashboard size={12} /> Модерация
              </span>
            </div>
          </div>

          <div className="footer-col">
            <h4>Каталог</h4>
            <Link to="/catalog?type=Продажа">Купить книгу</Link>
            <Link to="/catalog?type=Обмен">Обменять книгу</Link>
            <Link to="/catalog?type=Бесплатно">Забрать бесплатно</Link>
            <Link to="/catalog?sort=rating">Книги с рейтингом</Link>
          </div>

          <div className="footer-col">
            <h4>Пользователям</h4>
            <Link to="/how-it-works">Как это работает</Link>
            <Link to="/sell">Разместить объявление</Link>
            <Link to="/profile">Личный кабинет</Link>
            <Link to="/how-it-works#faq">Частые вопросы</Link>
          </div>

          <div className="footer-col">
            <h4>Документы</h4>
            <a href="/privacy-policy.html" target="_blank" rel="noreferrer">Политика конфиденциальности</a>
            <a href="/terms-of-use.html" target="_blank" rel="noreferrer">Условия пользования</a>
            <a href="/sitemap.xml">Карта сайта</a>
            <a href="/api">API</a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} BookSwap. Книги обретают новую жизнь.</span>
          <span>Сделано с уважением к читателям и их полкам.</span>
        </div>
      </div>
    </footer>
  );
}
