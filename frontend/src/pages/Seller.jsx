import { Link, useParams } from 'react-router-dom';
import { CalendarDays, MapPin, MessageCircle, ShieldCheck, Star } from 'lucide-react';
import { usersApi } from '../shared/api';
import { useFetch } from '../shared/hooks';
import { useAuthGuard } from '../shared/auth';
import { useFavorites } from '../shared/favorites';
import { useToast } from '../shared/toast';
import { Seo, SITE_URL } from '../shared/seo';
import { Avatar } from '../components/Avatar';
import { BookCard } from '../components/BookCard';
import { BookGridSkeleton } from '../components/Skeletons';
import { EmptyState } from '../components/EmptyState';
import { Stars } from '../components/Stars';
import { SITE_NAME } from '../shared/constants';
import { countLabel, formatDate } from '../shared/format';

export function SellerPage() {
  const { id } = useParams();
  const requireAuth = useAuthGuard();
  const { isFavorite, toggle } = useFavorites();
  const { notify } = useToast();
  const profile = useFetch((signal) => usersApi.profile(id, signal), [id]);

  const seller = profile.data?.user;
  const listings = profile.data?.listings || [];
  const reviews = profile.data?.reviews || [];

  const onFavorite = async (listingId) => {
    if (!requireAuth('Войдите, чтобы сохранять книги в избранное')) return;
    try {
      const favorite = await toggle(listingId);
      notify(favorite ? 'Книга в избранном' : 'Убрали из избранного');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  if (profile.loading && !seller) {
    return <div className="container page"><BookGridSkeleton count={4} /></div>;
  }

  if (profile.error || !seller) {
    return (
      <div className="container page">
        <Seo title={`Продавец не найден | ${SITE_NAME}`} description="Профиль продавца не найден." path={`/seller/${id}`} noindex />
        <EmptyState
          icon={MessageCircle}
          title="Профиль не найден"
          description="Возможно, аккаунт удалён или заблокирован."
          action={<Link className="btn btn-primary" to="/catalog">Перейти в каталог</Link>}
        />
      </div>
    );
  }

  return (
    <>
      <Seo
        title={`${seller.name} — продавец книг | ${SITE_NAME}`}
        description={`Книги продавца ${seller.name} из города ${seller.city}. Рейтинг ${seller.rating || 0}, ${countLabel(seller.deals, 'сделка', 'сделки', 'сделок')}, ${countLabel(profile.data.listingsTotal, 'активное объявление', 'активных объявления', 'активных объявлений')}.`}
        path={`/seller/${seller.id}`}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: seller.name,
          address: seller.city,
          description: seller.bio || undefined,
          url: `${SITE_URL}/seller/${seller.id}`,
          aggregateRating: seller.rating
            ? {
              '@type': 'AggregateRating',
              ratingValue: seller.rating,
              reviewCount: profile.data.reviewStats?.count || 1
            }
            : undefined
        }}
      />

      <div className="container page">
        <div className="seller-hero">
          <Avatar name={seller.name} src={seller.avatarUrl} size="lg" />
          <div className="grow">
            <div className="row" style={{ gap: 9 }}>
              <h1>{seller.name}</h1>
              {seller.role !== 'user' && (
                <span className="badge soft">
                  <ShieldCheck size={12} /> {seller.role === 'admin' ? 'Администратор' : 'Модератор'}
                </span>
              )}
            </div>
            <p>{seller.bio || 'Продавец BookSwap. Уточните детали книги в чате.'}</p>
            <div className="seller-stats">
              <div>
                <strong>{seller.rating || 0}</strong>
                <span>рейтинг продавца</span>
              </div>
              <div>
                <strong>{seller.deals || 0}</strong>
                <span>{countLabel(seller.deals || 0, 'сделка', 'сделки', 'сделок')}</span>
              </div>
              <div>
                <strong>{profile.data.listingsTotal || 0}</strong>
                <span>книг в продаже</span>
              </div>
            </div>
          </div>
          <div className="stack" style={{ gap: 8, color: 'var(--muted)', fontSize: 12.5 }}>
            <span className="row" style={{ gap: 6 }}>
              <MapPin size={14} /> {seller.city}
            </span>
            <span className="row" style={{ gap: 6 }}>
              <CalendarDays size={14} /> На BookSwap с {formatDate(seller.createdAt, { month: 'long', year: 'numeric' })}
            </span>
            <span className="row" style={{ gap: 6 }}>
              <Star size={14} /> {countLabel(profile.data.reviewStats?.count || 0, 'отзыв', 'отзыва', 'отзывов')} о сделках
            </span>
          </div>
        </div>

        <section className="section-tight">
          <div className="section-head">
            <div>
              <span className="eyebrow">Книги продавца</span>
              <h2>Активные объявления</h2>
            </div>
            <Link className="see-all" to="/catalog">Весь каталог</Link>
          </div>
          {listings.length ? (
            <div className="book-grid">
              {listings.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  favorite={isFavorite(book.id)}
                  onFavorite={onFavorite}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Star}
              title="Сейчас нет активных объявлений"
              description="Продавец снял книги с публикации или уже передал их новым читателям."
              action={<Link className="btn btn-secondary" to="/catalog">Смотреть другие книги</Link>}
            />
          )}
        </section>

        <section className="section-tight">
          <div className="section-head">
            <div>
              <span className="eyebrow">Отзывы</span>
              <h2>Как проходят сделки</h2>
            </div>
            {profile.data.reviewStats?.count > 0 && (
              <span className="row" style={{ gap: 8 }}>
                <Stars value={Number(profile.data.reviewStats.avg)} size={15} />
                <strong>{profile.data.reviewStats.avg}</strong>
                <span className="text-muted text-small">из 5</span>
              </span>
            )}
          </div>

          {reviews.length ? (
            <div className="reviews-list">
              {reviews.map((review) => (
                <article className="review" key={review.id}>
                  <div className="review-head">
                    <Avatar name={review.author} src={review.authorAvatar} size="sm" />
                    <div className="grow">
                      <strong>{review.author}</strong>
                      <span>{review.time}{review.listingTitle ? ` · ${review.listingTitle}` : ''}</span>
                    </div>
                    <Stars value={review.rating} size={13} />
                  </div>
                  {review.text && <p>{review.text}</p>}
                </article>
              ))}
            </div>
          ) : (
            <p className="text-muted text-small">У продавца пока нет отзывов о сделках.</p>
          )}
        </section>
      </div>
    </>
  );
}
