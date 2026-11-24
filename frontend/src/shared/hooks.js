import { useCallback, useEffect, useRef, useState } from 'react';

export function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/**
 * Tiny data-fetching hook: keeps previous data while loading, supports abort
 * and exposes a manual reload for optimistic updates.
 */
export function useFetch(fetcher, deps = [], { enabled = true } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: enabled });
  const [nonce, setNonce] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (!enabled) {
      setState({ data: null, error: null, loading: false });
      return undefined;
    }
    const controller = new AbortController();
    let active = true;
    setState((current) => ({ ...current, loading: true, error: null }));

    Promise.resolve(fetcherRef.current(controller.signal))
      .then((data) => {
        if (active) setState({ data, error: null, loading: false });
      })
      .catch((error) => {
        if (!active || error.name === 'AbortError') return;
        setState((current) => ({ ...current, error: error.message || 'Не удалось загрузить данные', loading: false }));
      });

    return () => {
      active = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled, nonce]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);
  const setData = useCallback((updater) => {
    setState((current) => ({
      ...current,
      data: typeof updater === 'function' ? updater(current.data) : updater
    }));
  }, []);

  return { ...state, reload, setData };
}

export function useInterval(callback, delay) {
  const saved = useRef(callback);
  saved.current = callback;
  useEffect(() => {
    if (delay === null || delay === undefined) return undefined;
    const id = setInterval(() => saved.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

export function useClickOutside(ref, handler) {
  useEffect(() => {
    if (!handler) return undefined;
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return;
      handler(event);
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

export function useLockBodyScroll(locked) {
  useEffect(() => {
    if (!locked) return undefined;
    const original = document.body.style.overflow;
    document.body.classList.add('no-scroll');
    return () => {
      document.body.classList.remove('no-scroll');
      document.body.style.overflow = original;
    };
  }, [locked]);
}

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = (event) => setMatches(event.matches);
    setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);
  return matches;
}

/** Global keyboard shortcut, e.g. useHotkey({ key: 'k', meta: true }, openSearch). */
export function useHotkey(handler) {
  useEffect(() => {
    const listener = (event) => {
      const target = event.target;
      const typing = target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      const isSearchCombo = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
      const isSlash = event.key === '/' && !typing;
      if (isSearchCombo || isSlash) {
        event.preventDefault();
        handler();
      }
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [handler]);
}

export function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'light');

  const apply = useCallback((next) => {
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
    try {
      window.localStorage.setItem('bookswap-theme', next);
    } catch {
      /* storage may be unavailable */
    }
    setTheme(next);
  }, []);

  const toggle = useCallback(() => apply(theme === 'dark' ? 'light' : 'dark'), [apply, theme]);

  return { theme, setTheme: apply, toggle };
}
