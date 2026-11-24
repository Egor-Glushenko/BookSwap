import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authApi } from './api';

const STORAGE_KEY = 'bookswap-session';
const AuthContext = createContext(null);

function readStoredSession() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token && parsed?.user ? parsed : null;
  } catch {
    return null;
  }
}

function persist(session) {
  try {
    if (session) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage can be disabled */
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readStoredSession);
  const [ready, setReady] = useState(false);

  // Revalidate the stored token once per page load so blocked or deleted
  // accounts do not keep a stale session.
  useEffect(() => {
    if (!session?.token) {
      setReady(true);
      return undefined;
    }
    let active = true;
    authApi.me(session.token)
      .then(({ user }) => {
        if (!active) return;
        const next = { ...session, user };
        persist(next);
        setSession(next);
      })
      .catch((error) => {
        if (!active) return;
        if (error.status === 401 || error.status === 403) {
          persist(null);
          setSession(null);
        }
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onUnauthorized = () => {
      persist(null);
      setSession(null);
    };
    window.addEventListener('bookswap:unauthorized', onUnauthorized);
    return () => window.removeEventListener('bookswap:unauthorized', onUnauthorized);
  }, []);

  const applySession = useCallback((next) => {
    persist(next);
    setSession(next);
    return next.user;
  }, []);

  const login = useCallback(async (email, password) => {
    const result = await authApi.login(email, password);
    return applySession({ token: result.token, user: result.user });
  }, [applySession]);

  const register = useCallback(async (payload) => {
    const result = await authApi.register(payload);
    return applySession({ token: result.token, user: result.user });
  }, [applySession]);

  const logout = useCallback(async () => {
    try {
      if (session?.token) await authApi.logout(session.token);
    } catch {
      /* the token is dropped locally anyway */
    }
    persist(null);
    setSession(null);
  }, [session?.token]);

  const updateUser = useCallback((user) => {
    setSession((current) => {
      if (!current) return current;
      const next = { ...current, user: { ...current.user, ...user } };
      persist(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({
    user: session?.user || null,
    token: session?.token || null,
    isAuthenticated: Boolean(session?.token),
    isStaff: ['moderator', 'admin'].includes(session?.user?.role),
    ready,
    login,
    register,
    logout,
    updateUser
  }), [session, ready, login, register, logout, updateUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

/** Returns true when signed in, otherwise sends the visitor to /login. */
export function useAuthGuard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback((message) => {
    if (user) return true;
    navigate('/login', {
      state: {
        from: `${location.pathname}${location.search}`,
        message: message || 'Войдите, чтобы продолжить'
      }
    });
    return false;
  }, [user, navigate, location.pathname, location.search]);
}
