import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Cover } from './Cover';
import { countLabel } from '../shared/format';

const TYPE_CLASS = { 'Обмен': 'swap', 'Бесплатно': 'free', 'Продажа': '' };

export function BookCard({ book, favorite = false, onFavorite, eager = false }) {
  const typeClass = TYPE_CLASS[book.type] ?? '';
  const sold = book.status === 'sold';

  return (
    <article className={`book-card ${sold ? 'is-sold' : ''}`.trim()}>
      <Link className="book-cover-wrap" to={`/listing/${book.id}`} aria-label={`${book.title}, ${book.author}`}>
        <Cover title={book.title} author={book.author} tone={book.tone} image={book.coverUrl} eager={eager} />
        <span className={`badge ${typeClass}`}>{book.type}</span>
        {sold && <span className="badge sold sold-overlay">Передано</span>}
      </Link>

      {onFavorite && (
        <button
          type="button"
          className={`fav-button ${favorite ? 'active' : ''}`.trim()}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onFavorite(book.id);
          }}
          aria-label={favorite ? `Убрать «${book.title}» из избранного` : `Добавить «${book.title}» в избранное`}
          aria-pressed={favorite}
        >
          <Heart size={17} fill={favorite ? 'currentColor' : 'none'} />
        </button>
      )}

      <div className="book-body">
        <div className="book-title-row">
          <div style={{ minWidth: 0 }}>
            <h3>
              <Link to={`/listing/${book.id}`}>{book.title}</Link>
            </h3>
            <p className="truncate">{book.author}</p>
          </div>
          <strong className="book-price">{book.price}</strong>
        </div>

        <div className="book-facts">
          {book.genre && <span>{book.genre}</span>}
          <span>{book.condition}</span>
        </div>

        <div className="book-meta">
          <span className="rating">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5-5.9-3.2-5.9 3.2 1.2-6.5L2.5 9.4l6.6-.9L12 2.5z" />
            </svg>
            {book.rating}
          </span>
          <span className="meta-item">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            {book.city}
          </span>
          <span className="meta-item" title={`${countLabel(book.views, 'просмотр', 'просмотра', 'просмотров')}`}>
            {book.views}
          </span>
        </div>
      </div>
    </article>
  );
}
