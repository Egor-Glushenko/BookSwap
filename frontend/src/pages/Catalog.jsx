import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import { listingsApi } from '../shared/api';
import { useFetch, useDebouncedValue } from '../shared/hooks';
import { useAuthGuard } from '../shared/auth';
import { useFavorites } from '../shared/favorites';
import { useToast } from '../shared/toast';
import { Seo, SITE_URL } from '../shared/seo';
import { BookCard } from '../components/BookCard';
import { BookGridSkeleton } from '../components/Skeletons';
import { Filters } from '../components/Filters';
import { Pagination } from '../components/Pagination';
import { EmptyState } from '../components/EmptyState';
import { SORT_OPTIONS, SITE_NAME } from '../shared/constants';
import { countLabel } from '../shared/format';

const FILTER_KEYS = ['type', 'genre', 'city', 'condition', 'minPrice', 'maxPrice'];

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requireAuth = useAuthGuard();
  const { isFavorite, toggle } = useFavorites();
  const { notify } = useToast();
  const inputRef = useRef(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const params = useMemo(() => Object.fromEntries(searchParams.entries()), [searchParams]);
  const page = Number(params.page) || 1;
  const sort = params.sort || 'new';

  const [query, setQuery] = useState(params.q || '');
  useEffect(() => setQuery(params.q || ''), [params.q]);
  const debouncedQuery = useDebouncedValue(query, 420);

  const apply = (patch, { replace = false } = {}) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') next.delete(key);
      else next.set(key, String(value));
    });
    next.delete('page');
    setSearchParams(next, { replace });
  };

  useEffect(() => {
    if ((params.q || '') === debouncedQuery) return;
    apply({ q: debouncedQuery });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  useEffect(() => {
    if (params.focus !== 'search') return;
    inputRef.current?.focus();
    const next = new URLSearchParams(searchParams);
    next.delete('focus');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.focus]);

  const filters = {
    type: params.type || '',
    genre: params.genre || '',
    city: params.city || '',
    condition: params.condition || '',
    minPrice: params.minPrice || '',
    maxPrice: params.maxPrice || ''
  };

  const result = useFetch(
    (signal) => listingsApi.list({
      query: params.q,
      type: filters.type,
      genre: filters.genre,
      city: filters.city,
      condition: filters.condition,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      sort,
      page,
      limit: 12
    }, signal),
    [searchParams.toString()]
  );

  const facets = useFetch((signal) => listingsApi.filters(signal), []);

  const books = result.data?.data || [];
  const total = result.data?.total ?? 0;
  const pages = result.data?.pages ?? 1;
  const activeFilters = FILTER_KEYS.filter((key) => filters[key]);

  const titleParts = [filters.type, filters.genre].filter(Boolean).join(' · ');
  const pageTitle = `${titleParts ? `${titleParts} — ` : ''}каталог книг${filters.city ? ` в ${filters.city}` : ''} | ${SITE_NAME}`;
  const description = filters.genre
    ? `Книги в жанре «${filters.genre}»: продажа, обмен и бесплатная передача. ${total} ${countLabel(total, 'объявление', 'объявления', 'объявлений')} с рейтингами и отзывами читателей.`
    : `Каталог BookSwap: купить, обменять или забрать книгу бесплатно. ${total} ${countLabel(total, 'объявление', 'объявления', 'объявлений')}, фильтры по жанру, городу, цене и состоянию.`;

  const itemListJsonLd = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    numberOfItems: books.length,
    itemListElement: books.slice(0, 12).map((book, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${SITE_URL}/listing/${book.id}`,
      name: `${book.title} — ${book.author}`
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [result.data]);

  const onFavorite = async (id) => {
    if (!requireAuth('Войдите, чтобы сохранять книги в избранное')) return;
    try {
      const favorite = await toggle(id);
      notify(favorite ? 'Книга в избранном' : 'Убрали из избранного');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  return (
    <>
      <Seo
        title={pageTitle}
        description={description}
        path={page > 1 ? `/catalog?page=${page}` : '/catalog'}
        jsonLd={itemListJsonLd}
      />

      <div className="container catalog-page">
        <nav className="breadcrumbs" aria-label="Хлебные крошки">
          <Link to="/">Главная</Link>
          <ChevronRight size={12} />
          <span>Каталог</span>
        </nav>

        <div className="catalog-head">
          <span className="eyebrow">
            <span className="dot" /> {countLabel(total, 'объявление', 'объявления', 'объявлений')}
          </span>
          <h1>{titleParts || 'Каталог книг'}</h1>
          <p className="lede">Продажа, обмен и книги даром. Уточняйте состояние и способ передачи в чате с продавцом.</p>
        </div>

        <div className="catalog-toolbar">
          <div className="search-box" style={{ flex: 1, minWidth: 240 }}>
            <div className="input-group" style={{ width: '100%' }}>
              <Search size={17} />
              <input
                ref={inputRef}
                className="input"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Название, автор или жанр"
                aria-label="Поиск книг"
              />
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm filter-toggle"
            onClick={() => setFiltersOpen((value) => !value)}
            aria-expanded={filtersOpen}
            aria-controls="catalog-filters"
          >
            <Filter size={15} /> Фильтры
            {activeFilters.length > 0 && <span className="badge soft">{activeFilters.length}</span>}
          </button>

          <label className="sort-control">
            <SlidersHorizontal size={14} />
            <span className="sr-only">Сортировка</span>
            <select className="select" value={sort} onChange={(event) => apply({ sort: event.target.value })}>
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>

        {activeFilters.length > 0 && (
          <div className="active-filters">
            {activeFilters.map((key) => (
              <button type="button" key={key} className="chip chip-removable" onClick={() => apply({ [key]: '' })}>
                {filters[key]}
                <X size={12} />
              </button>
            ))}
            <button type="button" className="chip ghost" onClick={() => setSearchParams(new URLSearchParams())}>
              Сбросить всё
            </button>
          </div>
        )}

        <div className="catalog-layout">
          <Filters
            value={filters}
            facets={facets.data}
            open={filtersOpen}
            onChange={(patch) => apply(patch)}
            onReset={() => setSearchParams(new URLSearchParams({ sort }))}
          />

          <div>
            {result.error && <p className="alert">{result.error}</p>}

            {result.loading && !books.length ? (
              <BookGridSkeleton count={9} />
            ) : books.length ? (
              <>
                <div className="book-grid">
                  {books.map((book, index) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      favorite={isFavorite(book.id)}
                      onFavorite={onFavorite}
                      eager={index < 4}
                    />
                  ))}
                </div>
                <Pagination
                  page={page}
                  pages={pages}
                  onChange={(next) => {
                    const nextParams = new URLSearchParams(searchParams);
                    if (next <= 1) nextParams.delete('page');
                    else nextParams.set('page', String(next));
                    setSearchParams(nextParams);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              </>
            ) : (
              !result.loading && (
                <EmptyState
                  icon={Search}
                  title="Ничего не нашлось"
                  description="Попробуйте изменить запрос, убрать часть фильтров или разместите своё объявление — вдруг книга уже ждёт вас."
                  action={
                    <div className="row" style={{ justifyContent: 'center' }}>
                      <button type="button" className="btn btn-secondary" onClick={() => setSearchParams(new URLSearchParams())}>
                        Сбросить фильтры
                      </button>
                      <Link className="btn btn-primary" to="/sell">Разместить книгу</Link>
                    </div>
                  }
                />
              )
            )}
          </div>
        </div>
      </div>
    </>
  );
}
