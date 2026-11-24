import { useState } from 'react';
import { Star } from 'lucide-react';
import { Modal } from './Modal';
import { Stars } from './Stars';

export function ReviewDialog({ open, onClose, onSubmit, sellerName, listingTitle }) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSubmit({ rating, text: text.trim() });
      setText('');
      onClose();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} kicker="ОТЗЫВ О СДЕЛКЕ" title={`Как прошла сделка с ${sellerName || 'продавцом'}?`} size="narrow">
      <form onSubmit={submit} className="stack">
        {listingTitle && <p className="text-muted text-small">«{listingTitle}»</p>}

        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="text-small text-muted">Ваша оценка</span>
          <Stars value={rating} interactive onChange={setRating} size={22} />
        </div>

        <label className="field">
          <span className="field-label">Комментарий <span className="field-hint">необязательно</span></span>
          <textarea
            className="textarea"
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={600}
            placeholder="Как прошла встреча, состояние книги, общение"
          />
        </label>

        {error && <p className="alert">{error}</p>}

        <div className="modal-actions" style={{ marginTop: 4 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Отмена</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            <Star size={15} /> {busy ? 'Сохраняем…' : 'Оставить отзыв'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
