import { useState } from 'react';
import { Flag } from 'lucide-react';
import { Modal } from './Modal';
import { REPORT_REASONS } from '../shared/constants';

export function ReportDialog({ open, onClose, onSubmit, listingTitle }) {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const message = reason === 'Другое' ? details.trim() : `${reason}${details.trim() ? `. ${details.trim()}` : ''}`;
      await onSubmit(message);
      setDetails('');
      onClose();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      kicker="ЖАЛОБА"
      title="Что не так с объявлением?"
      size="narrow"
    >
      <form onSubmit={submit} className="stack">
        {listingTitle && <p className="text-muted text-small">«{listingTitle}»</p>}

        <div className="stack" style={{ gap: 6 }}>
          {REPORT_REASONS.map((option) => (
            <label className="checkbox" key={option}>
              <input
                type="radio"
                name="report-reason"
                value={option}
                checked={reason === option}
                onChange={() => setReason(option)}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>

        <label className="field">
          <span className="field-label">Комментарий{hint()}</span>
          <textarea
            className="textarea"
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            maxLength={500}
            placeholder="Что именно стоит проверить модератору"
          />
        </label>

        {error && <p className="alert">{error}</p>}

        <div className="modal-actions" style={{ marginTop: 4 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Отмена</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            <Flag size={15} /> {busy ? 'Отправляем…' : 'Отправить жалобу'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function hint() {
  return <span className="field-hint">необязательно</span>;
}
