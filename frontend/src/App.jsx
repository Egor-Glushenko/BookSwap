import { Component, useEffect } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { Header, Footer } from './components/Header';
import { HomePage } from './pages/Home';
import { CatalogPage } from './pages/Catalog';
import { ListingPage } from './pages/Listing';
import { SellerPage } from './pages/Seller';
import { AuthPage } from './pages/Auth';
import { SellPage, EditListingPage } from './pages/Sell';
import { AccountPage } from './pages/Account';
import { FavoritesPage } from './pages/Favorites';
import { ChatsPage } from './pages/Chats';
import { ModerationPage } from './pages/Moderation';
import { HowItWorksPage } from './pages/HowItWorks';
import { ForbiddenPage, NotFoundPage } from './pages/NotFound';
import { useAuth } from './shared/auth';

function SiteLayout() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">Перейти к содержимому</a>
      <Header />
      <main id="main-content" className="site-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function FullPageLoader() {
  return (
    <div className="loading-block" style={{ minHeight: '50vh' }}>
      <span className="spinner" />
      Загружаем…
    </div>
  );
}

function RequireAuth({ children }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) return <FullPageLoader />;
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}`, message: 'Войдите, чтобы открыть этот раздел' }}
      />
    );
  }
  return children;
}

function RequireStaff({ children }) {
  const { user, ready, isStaff } = useAuth();
  const location = useLocation();

  if (!ready) return <FullPageLoader />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }
  if (!isStaff) return <ForbiddenPage />;
  return children;
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) console.error('Unhandled UI error', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="container">
          <div className="not-found">
            <span className="code">!</span>
            <h1>Что-то пошло не так</h1>
            <p>Мы уже записали ошибку. Обновите страницу — обычно этого достаточно.</p>
            <div className="row" style={{ justifyContent: 'center' }}>
              <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
                Обновить страницу
              </button>
              <a className="btn btn-secondary" href="/">На главную</a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<HomePage />} />
          <Route path="catalog" element={<CatalogPage />} />
          <Route path="listing/:id" element={<ListingPage />} />
          <Route path="listing/:id/edit" element={<RequireAuth><EditListingPage /></RequireAuth>} />
          <Route path="seller/:id" element={<SellerPage />} />
          <Route path="how-it-works" element={<HowItWorksPage />} />
          <Route path="login" element={<AuthPage mode="login" />} />
          <Route path="register" element={<AuthPage mode="register" />} />
          <Route path="sell" element={<RequireAuth><SellPage /></RequireAuth>} />
          <Route path="profile" element={<RequireAuth><AccountPage /></RequireAuth>} />
          <Route path="favorites" element={<RequireAuth><FavoritesPage /></RequireAuth>} />
          <Route path="chats" element={<RequireAuth><ChatsPage /></RequireAuth>} />
          <Route path="moderation" element={<RequireStaff><ModerationPage /></RequireStaff>} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
