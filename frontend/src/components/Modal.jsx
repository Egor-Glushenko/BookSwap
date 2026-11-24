import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useLockBodyScroll } from '../shared/hooks';

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function Modal({ open, onClose, title, kicker, children, size = '', footer, id = 'modal-title' }) {
  const panelRef = useRef(null);
  const previousFocus = useRef(null);
  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) return undefined;
    previousFocus.current = document.activeElement;
    const panel = panelRef.current;
    const first = panel?.querySelector(FOCUSABLE);
    if (first) first.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose?.();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      const focusable = [...panel.querySelectorAll(FOCUSABLE)].filter((node) => node.offsetParent !== null);
      if (!focusable.length) return;
      const firstNode = focusable[0];
      const lastNode = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === firstNode) {
        event.preventDefault();
        lastNode.focus();
      } else if (!event.shiftKey && document.activeElement === lastNode) {
        event.preventDefault();
        firstNode.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (previousFocus.current instanceof HTMLElement) previousFocus.current.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div
        className={`modal ${size}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? id : undefined}
        ref={panelRef}
      >
        <button type="button" className="icon-button modal-close" onClick={onClose} aria-label="Закрыть">
          <X size={18} />
        </button>
        {(title || kicker) && (
          <div className="modal-head">
            {kicker && <span className="eyebrow">{kicker}</span>}
            {title && <h2 id={id}>{title}</h2>}
          </div>
        )}
        {children}
        {footer && <div className="modal-actions">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
