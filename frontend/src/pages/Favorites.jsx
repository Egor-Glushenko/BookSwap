import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { favoritesApi } from '../shared/api';
import { useFetch } from '../shared/hooks';
import { useAuth, useAuthGuard } from '../shared/auth';
import { useFavorites } from '../shared/favorites';
import { useToast } from '../shared/toast';
import { Seo } from '../shared/seo';
import { BookCard } from '../components/BookCard';
import { BookGridSkeleton } from '../components/Skeletons';
import { EmptyState } from '../components/EmptyState';
import { SITE_NAME } from '../shared/constants';
import { countLabel } from '../shared/format';

export function FavoritesPage() {
  const { token } = useAuth();
  const requireAuth = useAuthGuard();
  const { isFavorite, toggle } = useFavorites();
  const { notify } = useToast();
  const favorites = useFetch((signal) => favoritesApi.list(token, signal), [token]);

  const books = favorites.data?.data || [];

  const onFavorite = async (id) => {
    if (!requireAuth()) return;
    try {
      await toggle(id);
      favorites.reload();
      notify('Избранное обновлено');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  return (
    <>
      <Seo
        title={`Избранное | ${SITE_NAME}`}
        description="Книги, которые вы сохранили на BookSwap."
        path="/favorites"
        noindex
      />

      <div className="container page">
        <div className="page-head">
          <span className="eyebrow"><span className="dot" /> {countLabel(books.length, 'книга', 'книги', 'книг')}</span>
          <h1>Избранное</h1>
          <p className="lede">Книги, к которым вы хотите вернуться. Цена и статус обновляются автоматически.</p>
        </div>

        {favorites.loading && !books.length ? (
          <BookGridSkeleton count={4} />
        ) : books.length ? (
          <div className="book-grid">
            {books.map((book) => (
              <BookCard key={book.id} book={book} favorite={isFavorite(book.id)} onFavorite={onFavorite} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Heart}
            title="Здесь пока пусто"
            description="Нажмите на сердечко в карточке книги, чтобы сохранить её и вернуться к ней позже."
            action={<Link className="btn btn-primary" to="/catalog">Найти книгу</Link>}
          />
        )}
      </div>
    </>
  );
}
