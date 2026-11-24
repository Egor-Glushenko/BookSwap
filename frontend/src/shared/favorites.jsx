import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './auth';
import { favoritesApi } from './api';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { token } = useAuth();
  const [ids, setIds] = useState([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async (signal) => {
    if (!token) {
      setIds([]);
      return;
    }
    setLoading(true);
    try {
      const result = await favoritesApi.list(token, signal);
      setIds(result.ids || []);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const controller = new AbortController();
    reload(controller.signal).catch((error) => {
      if (error.name !== 'AbortError') setIds([]);
    });
    return () => controller.abort();
  }, [reload]);

  const toggle = useCallback(async (listingId) => {
    if (!token) return null;
    const result = await favoritesApi.toggle(token, listingId);
    setIds((current) => (result.favorite ? [...current, listingId] : current.filter((id) => id !== listingId)));
    return result.favorite;
  }, [token]);

  const value = useMemo(() => ({
    ids,
    isFavorite: (id) => ids.includes(id),
    toggle,
    reload,
    loading,
    count: ids.length
  }), [ids, toggle, reload, loading]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites must be used inside FavoritesProvider');
  return context;
}
