import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Archive, ChevronRight, Eye, Flag, Heart, MapPin, MessageCircle, Pencil,
  ShieldCheck, Star, Tag, Truck
} from 'lucide-react';
import { booksApi, chatsApi, listingsApi, moderationApi } from '../shared/api';
import { useFetch } from '../shared/hooks';
import { useAuth, useAuthGuard } from '../shared/auth';
import { useFavorites } from '../shared/favorites';
import { useToast } from '../shared/toast';
import { useUnread } from '../shared/notifications';
import { Seo, SITE_URL } from '../shared/seo';
import { Cover } from '../components/Cover';
import { Avatar } from '../components/Avatar';
import { Stars } from '../components/Stars';
import { BookCard } from '../components/BookCard';
import { DetailSkeleton } from '../components/Skeletons';
import { ReportDialog } from '../components/ReportDialog';
import { ReviewDialog } from '../components/ReviewDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { SITE_NAME, LISTING_STATUS_LABELS } from '../shared/constants';
import { formatDate, countLabel } from '../shared/format';

export function ListingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const requireAuth = useAuthGuard();
  const { isFavorite, toggle } = useFavorites();
  const { notify } = useToast();
  const { refresh: refreshUnread } = useUnread();

  const listing = useFetch((signal) => listingsApi.get(id, signal), [id]);
  const similar = useFetch((signal) => listingsApi.similar(id, signal), [id]);
  const reviews = useFetch((signal) => booksApi.ratings(id, signal), [id]);
  const myRating = useFetch((signal) => (token ? booksApi.myRating(token, id, signal) : Promise.resolve({ value: null })), [id, token]);

  const [imageIndex, setImageIndex] = useState(0);
  const [ratingDraft, setRatingDraft] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [ratingBusy, setRatingBusy] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [sellerReviewOpen, setSellerReviewOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [chatBusy, setChatBusy] = useState(false);

  const book = listing.data?.data;
  const isOwner = Boolean(user && book && book.sellerId === user.id);
  const images = book?.images?.length ? book.images : [];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    setImageIndex(0);
    setRatingDraft(0);
    setReviewText('');
  }, [id]);

  const jsonLd = useMemo(() => {
    if (!book) return null;
    return {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Book',
          name: book.title,
          author: { '@type': 'Person', name: book.author },
          genre: book.genre || undefined,
          isbn: book.isbn || undefined,
          inLanguage: 'ru',
          image: book.coverUrl ? `${SITE_URL}${book.coverUrl}` : `${SITE_URL}/og-cover.svg`,
          description: book.description || undefined,
          aggregateRating: book.reviews
            ? { '@type': 'AggregateRating', ratingValue: book.rating, reviewCount: book.reviews, bestRating: 5 }
            : undefined,
          offers: {
            '@type': 'Offer',
            price: book.priceValue ?? 0,
            priceCurrency: 'RUB',
            availability: book.status === 'active' ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
            itemCondition: 'https://schema.org/UsedCondition',
            url: `${SITE_URL}/listing/${book.id}`,
            seller: { '@type': 'Person', name: book.seller }
          }
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Главная', item: `${SITE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Каталог', item: `${SITE_URL}/catalog` },
            { '@type': 'ListItem', position: 3, name: book.title, item: `${SITE_URL}/listing/${book.id}` }
          ]
        }
      ]
    };
  }, [book]);

  useEffect(() => {
    if (myRating.data?.value) setRatingDraft(Number(myRating.data.value));
  }, [myRating.data]);

  if (listing.loading && !book) {
    return <div className="container page"><DetailSkeleton /></div>;
  }

  if (listing.error || !book) {
    return (
      <div className="container page">
        <Seo title={`Объявление не найдено | ${SITE_NAME}`} description="Объявление не найдено или уже снято с публикации." path={`/listing/${id}`} noindex />
        <EmptyState
          icon={Tag}
          title="Объявление не найдено"
          description="Возможно, книгу уже передали новому читателю или продавец снял объявление с публикации."
          action={<Link className="btn btn-primary" to="/catalog">Перейти в каталог</Link>}
        />
      </div>
    );
  }

  const onFavorite = async () => {
    if (!requireAuth('Войдите, чтобы сохранять книги в избранное')) return;
    try {
      const favorite = await toggle(book.id);
      notify(favorite ? 'Книга в избранном' : 'Убрали из избранного');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  const favoriteById = async (listingId) => {
    if (!requireAuth('Войдите, чтобы сохранять книги в избранное')) return;
    try {
      const favorite = await toggle(listingId);
      notify(favorite ? 'Книга в избранном' : 'Убрали из избранного');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  const startChat = async () => {
    if (!requireAuth('Войдите, чтобы написать продавцу')) return;
    setChatBusy(true);
    try {
      const result = await chatsApi.create(token, book.id);
      refreshUnread();
      navigate(`/chats?chat=${result.data.id}`);
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setChatBusy(false);
    }
  };

  const rate = async () => {
    if (!requireAuth('Войдите, чтобы оценить книгу')) return;
    if (!ratingDraft) {
      notify('Выберите оценку от 1 до 5', 'error');
      return;
    }
    setRatingBusy(true);
    try {
      const result = await booksApi.rate(token, book.id, ratingDraft, reviewText.trim());
      notify('Спасибо за оценку!');
      setReviewText('');
      reviews.reload();
      listing.setData((current) => ({ ...current, data: { ...current.data, rating: result.avg, reviews: result.count } }));
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setRatingBusy(false);
    }
  };

  const markSold = async () => {
    try {
      await listingsApi.setStatus(token, book.id, 'sold');
      notify('Объявление отмечено как переданное');
      listing.reload();
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  const archive = async () => {
    await listingsApi.remove(token, book.id);
    notify('Объявление снято с публикации');
    navigate('/profile');
  };

  const submitReport = async (reason) => {
    await moderationApi.report(token, book.id, reason);
    notify('Жалоба отправлена модератору');
  };

  const submitSellerReview = async ({ rating, text }) => {
    await moderationApi.createReview(token, {
      sellerId: book.sellerId,
      listingId: book.id,
      rating,
      text
    });
    notify('Отзыв о сделке сохранён');
  };

  const statusLabel = LISTING_STATUS_LABELS[book.status] || book.status;

  return (
    <>
      <Seo
        title={`${book.title} — ${book.author} | ${SITE_NAME}`}
        description={`${book.title}, ${book.author}. ${book.condition}, ${book.city}. ${book.price}. ${book.description}`.slice(0, 300)}
        path={`/listing/${book.id}`}
        type="product"
        image={book.coverUrl || '/og-cover.svg'}
        jsonLd={jsonLd}
      />

      <div className="container">
        <nav className="breadcrumbs" aria-label="Хлебные крошки">
          <Link to="/">Главная</Link>
          <ChevronRight size={12} />
          <Link to="/catalog">Каталог</Link>
          <ChevronRight size={12} />
          <Link to={`/catalog?genre=${encodeURIComponent(book.genre)}`}>{book.genre || 'Книги'}</Link>
          <ChevronRight size={12} />
          <span className="truncate" style={{ maxWidth: 240 }}>{book.title}</span>
        </nav>

        <div className="detail-layout">
          <div className="detail-gallery">
            <Cover
              title={book.title}
              author={book.author}
              tone={book.tone}
              image={images[imageIndex]}
              eager
            />
            {images.length > 1 && (
              <div className="gallery-thumbs" role="group" aria-label="Фотографии книги">
                {images.map((image, index) => (
                  <button
                    type="button"
                    key={image}
                    className={`gallery-thumb ${index === imageIndex ? 'active' : ''}`.trim()}
                    onClick={() => setImageIndex(index)}
                    aria-label={`Фото ${index + 1}`}
                    aria-pressed={index === imageIndex}
                  >
                    <Cover title={book.title} tone={book.tone} image={image} />
                  </button>
                ))}
              </div>
            )}
            <p className="text-muted text-small" style={{ marginTop: 4 }}>
              Продавец: <Link to={`/seller/${book.sellerId}`} style={{ color: 'var(--ink)' }}>{book.seller}</Link> · опубликовано {formatDate(book.createdAt)}
            </p>
          </div>

          <div className="detail-info">
            <div className="detail-badges">
              <span className={`badge ${book.type === 'Обмен' ? 'swap' : book.type === 'Бесплатно' ? 'free' : ''}`.trim()}>
                {book.type}
              </span>
              {book.status !== 'active' && <span className="badge sold">{statusLabel}</span>}
              {book.genre && <span className="badge soft">{book.genre}</span>}
              <span className="badge outline">{book.condition}</span>
            </div>

            <h1>{book.title}</h1>
            <p className="detail-author">{book.author}</p>

            <div className="detail-price-row">
              <span className="detail-price">
                {book.price} {book.priceValue ? <small>без комиссии</small> : null}
              </span>
              <span className="detail-rating-inline">
                <Stars value={Number(book.rating)} size={15} />
                <strong>{book.rating}</strong>
                <span>{countLabel(book.reviews, 'оценка', 'оценки', 'оценок')}</span>
              </span>
            </div>

            {book.description && <p className="detail-description">{book.description}</p>}

            {book.exchangeWant && (
              <p className="detail-description">
                <strong>Хочу взамен:</strong> {book.exchangeWant}
              </p>
            )}

            <dl className="spec-grid">
              <div>
                <dt>Издательство</dt>
                <dd>{book.publisher || '—'}</dd>
              </div>
              <div>
                <dt>Год издания</dt>
                <dd>{book.year || '—'}</dd>
              </div>
              <div>
                <dt>ISBN</dt>
                <dd title={book.isbn}>{book.isbn || '—'}</dd>
              </div>
              <div>
                <dt>Состояние</dt>
                <dd>{book.condition}</dd>
              </div>
              <div>
                <dt>Город</dt>
                <dd>{book.city}{book.district ? `, ${book.district}` : ''}</dd>
              </div>
              <div>
                <dt>Просмотры</dt>
                <dd>{book.views}</dd>
              </div>
            </dl>

            <div className="row" style={{ gap: 14, color: 'var(--muted)', fontSize: 12.5 }}>
              <span className="row" style={{ gap: 5 }}>
                <MapPin size={14} /> {book.pickup ? 'Самовывоз' : 'Самовывоз не указан'}
              </span>
              <span className="row" style={{ gap: 5 }}>
                <Truck size={14} /> {book.delivery ? 'Доставка' : 'Без доставки'}
              </span>
              <span className="row" style={{ gap: 5 }}>
                <Eye size={14} /> {countLabel(book.views, 'просмотр', 'просмотра', 'просмотров')}
              </span>
            </div>

            <Link className="seller-card" to={`/seller/${book.sellerId}`}>
              <Avatar name={book.seller} src={book.sellerAvatar} />
              <div className="grow">
                <strong>{book.seller}</strong>
                <span>
                  Рейтинг {book.sellerRating || 0} · {countLabel(book.sellerDeals, 'сделка', 'сделки', 'сделок')}
                </span>
              </div>
              <ChevronRight size={16} color="var(--muted)" />
            </Link>

            <div className="detail-actions">
              {!isOwner ? (
                <button type="button" className="btn btn-primary" onClick={startChat} disabled={chatBusy}>
                  <MessageCircle size={16} /> {chatBusy ? 'Открываем чат…' : 'Написать продавцу'}
                </button>
              ) : (
                <Link className="btn btn-primary" to={`/listing/${book.id}/edit`}>
                  <Pencil size={16} /> Редактировать объявление
                </Link>
              )}
              <button type="button" className={`btn btn-secondary ${isFavorite(book.id) ? 'active' : ''}`.trim()} onClick={onFavorite}>
                <Heart size={16} fill={isFavorite(book.id) ? 'currentColor' : 'none'} />
                {isFavorite(book.id) ? 'В избранном' : 'В избранное'}
              </button>
            </div>

            {isOwner && (
              <div className="owner-actions">
                {book.status === 'active' && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={markSold}>
                    <ShieldCheck size={14} /> Книга передана
                  </button>
                )}
                <button type="button" className="btn btn-danger btn-sm" onClick={() => setArchiveOpen(true)}>
                  <Archive size={14} /> Снять с публикации
                </button>
              </div>
            )}

            {!isOwner && (
              <div className="subtle-actions">
                <button type="button" className="subtle-link" onClick={() => requireAuth('Войдите, чтобы оставить отзыв') && setSellerReviewOpen(true)}>
                  <Star size={13} /> Отзыв о сделке
                </button>
                <button type="button" className="subtle-link" onClick={() => requireAuth('Войдите, чтобы отправить жалобу') && setReportOpen(true)}>
                  <Flag size={13} /> Пожаловаться
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="detail-sections">
          <section>
            <div className="block-title">
              <h2>Оценки книги</h2>
              <span className="text-muted text-small">{book.reviews ? `Средняя оценка ${book.rating} из 5` : 'Пока без оценок'}</span>
            </div>

            {!isOwner && (
              <div className="review-form">
                <div className="row-between">
                  <strong style={{ fontSize: 13.5 }}>Оцените книгу</strong>
                  <Stars value={ratingDraft} interactive onChange={setRatingDraft} size={22} />
                </div>
                <textarea
                  className="textarea"
                  value={reviewText}
                  onChange={(event) => setReviewText(event.target.value)}
                  maxLength={600}
                  placeholder="Что понравилось или не понравилось? Необязательно, но полезно другим."
                  style={{ minHeight: 84 }}
                />
                <div className="row-between">
                  <span className="text-muted text-small">{reviewText.length}/600</span>
                  <button type="button" className="btn btn-primary btn-sm" onClick={rate} disabled={ratingBusy || !ratingDraft}>
                    {ratingBusy ? 'Сохраняем…' : token ? 'Сохранить оценку' : 'Войти и оценить'}
                  </button>
                </div>
              </div>
            )}

            <div className="reviews-list mt-2">
              {reviews.data?.data?.length ? (
                reviews.data.data.map((review) => (
                  <article className="review" key={review.id}>
                    <div className="review-head">
                      <Avatar name={review.author} size="sm" src={review.authorAvatar} />
                      <div className="grow">
                        <strong>{review.author}</strong>
                        <span>{review.time}</span>
                      </div>
                      <Stars value={review.value} size={13} />
                    </div>
                    {review.review && <p>{review.review}</p>}
                  </article>
                ))
              ) : (
                <p className="text-muted text-small">Пока никто не оценил эту книгу. Ваша оценка будет первой.</p>
              )}
            </div>
          </section>

          {similar.data?.data?.length > 0 && (
            <section>
              <div className="block-title">
                <h2>Похожие книги</h2>
                <Link className="see-all" to={`/catalog?genre=${encodeURIComponent(book.genre)}`}>Смотреть жанр</Link>
              </div>
              <div className="book-grid">
                {similar.data.data.map((item) => (
                  <BookCard
                    key={item.id}
                    book={item}
                    favorite={isFavorite(item.id)}
                    onFavorite={favoriteById}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} onSubmit={submitReport} listingTitle={book.title} />
      <ReviewDialog open={sellerReviewOpen} onClose={() => setSellerReviewOpen(false)} onSubmit={submitSellerReview} sellerName={book.seller} listingTitle={book.title} />
      <ConfirmDialog
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        onConfirm={archive}
        title="Снять объявление?"
        description="Книга исчезнет из каталога. Вернуть объявление можно в личном кабинете."
        confirmLabel="Снять с публикации"
        danger
      />
    </>
  );
}
