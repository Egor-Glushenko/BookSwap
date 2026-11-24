import { mediaUrl } from '../shared/api';

/**
 * Generated typographic cover. Real photos (uploaded by sellers) are used when
 * available, otherwise the tone gradient keeps the catalogue consistent.
 */
export function Cover({
  title = '',
  author = '',
  tone = 'blue',
  image,
  images,
  className = '',
  eager = false
}) {
  const src = image || (Array.isArray(images) ? images[0] : '') || '';
  return (
    <div className={`cover ${tone || 'blue'} ${src ? 'has-image' : ''} ${className}`.trim()}>
      {src ? (
        <img
          src={mediaUrl(src)}
          alt={`Обложка книги «${title}»`}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
        />
      ) : (
        <>
          <span className="cover-label">BOOKSWAP</span>
          <strong className="cover-title">{title || 'Без названия'}</strong>
          <i className="cover-author">{author || 'Автор не указан'}</i>
        </>
      )}
    </div>
  );
}
