import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AlertCircle, Check } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback((message, type = 'success') => {
    if (!message) return;
    const id = (counter.current += 1);
    setToasts((current) => [...current.filter((toast) => toast.message !== message), { id, message, type }]);
    setTimeout(() => dismiss(id), 3600);
  }, [dismiss]);

  const value = useMemo(() => ({ notify, dismiss }), [notify, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div className={`toast ${toast.type === 'error' ? 'error' : ''}`} key={toast.id}>
            {toast.type === 'error' ? <AlertCircle size={15} /> : <Check size={15} />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
