import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from './Modal';

export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = 'Подтвердить', danger = false }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const confirm = async () => {
    setBusy(true);
    setError('');
    try {
      await onConfirm();
      onClose();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title} size="narrow">
      {description && <p className="text-muted text-small">{description}</p>}
      {error && (
        <p className="alert">
          <AlertCircle size={15} /> {error}
        </p>
      )}
      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Отмена</button>
        <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={confirm} disabled={busy}>
          {busy ? 'Выполняем…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
