import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './auth';
import { chatsApi } from './api';
import { useInterval } from './hooks';

const UnreadContext = createContext(null);

export function UnreadProvider({ children }) {
  const { token } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!token) {
      setCount(0);
      return;
    }
    try {
      const result = await chatsApi.unread(token);
      setCount(result.count || 0);
    } catch {
      /* silent: badges are non-critical */
    }
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Light polling keeps the unread badge fresh without a socket connection.
  useInterval(() => {
    if (token && document.visibilityState === 'visible') refresh();
  }, token ? 30_000 : null);

  const value = useMemo(() => ({ count, refresh, reset: () => setCount(0) }), [count, refresh]);
  return <UnreadContext.Provider value={value}>{children}</UnreadContext.Provider>;
}

export function useUnread() {
  const context = useContext(UnreadContext);
  if (!context) throw new Error('useUnread must be used inside UnreadProvider');
  return context;
}
