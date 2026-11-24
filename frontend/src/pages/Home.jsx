import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Check, ChevronRight, MessageCircle, Plus, ShieldCheck,
  Sparkles, Star
} from 'lucide-react';
import { useFetch } from '../shared/hooks';
import { booksApi, listingsApi } from '../shared/api';
import { useAuth, useAuthGuard } from '../shared/auth';
import { useFavorites } from '../shared/favorites';
import { useToast } from '../shared/toast';
import { Seo, SITE_URL } from '../shared/seo';
import { BookCard } from '../components/BookCard';
import { BookGridSkeleton } from '../components/Skeletons';
import { Cover } from '../components/Cover';
import { Stars } from '../components/Stars';
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from '../shared/constants';
import { countLabel } from '../shared/format';

const FAQ = [
  {
    question: 'Как работает BookSwap?',
    answer: 'Вы находите книгу в каталоге, открываете объявление и пишете продавцу во встроенном чате. Дальше вы договариваетесь о встрече или доставке: BookSwap не берёт комиссию и не пересылает деньги — оплата и передача книги происходят напрямую между читателями.'
  },
  {
    question: 'Что можно разместить?',
    answer: 'Бумажные книги в любом состоянии, включая учебники, детские издания и книги на иностранных языках. Одно объявление — одна книга. Запрещены пиратские копии, рукописи без прав и издания, нарушающие закон.'
  },
  {
    question: 'Сколько стоит размещение объявления?',
    answer: 'Размещение бесплатно и без ограничений по количеству книг. Объявление сразу появляется в каталоге и доступно модерации — если что-то нарушает правила, его снимут с публикации.'
  },
  {
    question: 'Как не ошибиться при сделке?',
    answer: 'Смотрите рейтинг продавца и отзывы о прошлых сделках, просите дополнительные фотографии, встречайтесь в людных местах или пользуйтесь доставкой с оплатой при получении. Все подозрительные объявления можно отправить модератору кнопкой «Пожаловаться».'
  },
  {
    question: 'Что делать после того, как книга передана?',
    answer: 'Отметьте объявление как переданное в личном кабинете — оно исчезнет из каталога, а продавец получит засчитанную сделку. После этого можно оставить отзыв о продавце и оценить саму книгу.'
  }
];

export function HomePage() {
  const { user } = useAuth();
  const requireAuth = useAuthGuard();
  const { isFavorite, toggle } = useFavorites();
  const { notify } = useToast();

  const latest = useFetch((signal) => listingsApi.list({ limit: 8, sort: 'new' }, signal), []);
  const best = useFetch((signal) => booksApi.best({ period: 'all' }, signal), []);
  const facets = useFetch((signal) => listingsApi.filters(signal), []);

  const books = latest.data?.data || [];
  const total = facets.data?.total ?? latest.data?.total ?? 0;
  const cities = facets.data?.cities?.length ?? 0;
  const covers = books.slice(0, 3);

  const onFavorite = async (id) => {
    if (!requireAuth('Войдите, чтобы сохранять книги в избранное')) return;
    try {
      const favorite = await toggle(id);
      notify(favorite ? 'Книга в избранном' : 'Убрали из избранного');
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer }
    }))
  };

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        inLanguage: 'ru-RU',
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE_URL}/catalog?q={search_term_string}`,
          'query-input': 'required name=search_term_string'
        }
      },
      {
        '@type': 'Organization',
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/favicon.svg`,
        description: DEFAULT_DESCRIPTION
      }
    ]
  };

  const structuredData = useMemo(
    () => ({ '@context': 'https://schema.org', '@graph': [...websiteJsonLd['@graph'], faqJsonLd] }),
    // The schema is static; rebuilding it on every render would rewrite <head>.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <>
      <Seo
        title={`${SITE_NAME} — ${SITE_TAGLINE}`}
        description={DEFAULT_DESCRIPTION}
        path="/"
        jsonLd={structuredData}
      />

      <section className="hero container">
        <div className="hero-copy animate-in">
          <span className="eyebrow">
            <span className="dot" /> Книжное сообщество
          </span>
          <h1>
            Книги находят<br />
            <em>своих людей.</em>
          </h1>
          <p className="lede">
            Покупайте, обменивайтесь и отдавайте книги бесплатно. Живой каталог с рейтингами,
            встроенным чатом и продавцами, которым доверяют читатели.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary btn-lg" to="/catalog">
              Найти книгу <ArrowRight size={17} />
            </Link>
            <Link className="btn btn-secondary btn-lg" to="/sell">
              <Plus size={17} /> Разместить объявление
            </Link>
          </div>
          <div className="hero-proof">
            <div>
              <strong>{total || '—'}</strong>
              <span>{countLabel(total || 0, 'книга', 'книги', 'книг')} в каталоге</span>
            </div>
            <div>
              <strong>{cities || '—'}</strong>
              <span>{countLabel(cities || 0, 'город', 'города', 'городов')} и самовывоз</span>
            </div>
            <div>
              <strong>0 ₽</strong>
              <span>комиссия сервиса за сделку</span>
            </div>
          </div>
        </div>

        <div className="hero-collage animate-in">
          <span className="glow" aria-hidden="true" />
          <span className="warm-glow" aria-hidden="true" />
          <div className="cover-stack">
            <Cover
              className="stack-back"
              title={covers[2]?.title || 'Классика'}
              author={covers[2]?.author || 'Книжная полка'}
              tone={covers[2]?.tone || 'orange'}
              image={covers[2]?.coverUrl}
            />
            <Cover
              className="stack-front"
              title={covers[1]?.title || 'Новая жизнь'}
              author={covers[1]?.author || 'BookSwap'}
              tone={covers[1]?.tone || 'yellow'}
              image={covers[1]?.coverUrl}
            />
            <Cover
              className="stack-mid"
              eager
              title={covers[0]?.title || 'BookSwap'}
              author={covers[0]?.author || 'Книжный маркет'}
              tone={covers[0]?.tone || 'blue'}
              image={covers[0]?.coverUrl}
            />
          </div>
          <div className="hero-badge">
            <ShieldCheck size={14} /> Проверенные объявления
          </div>
          <div className="hero-note">
            <span className="check-badge">
              <Check size={13} />
            </span>
            <div>
              <strong>{books.length ? 'Книга уже ждёт читателя' : 'Станьте первым продавцом'}</strong>
              <small>{books[0]?.title || 'Поделитесь книгой с сообществом'}</small>
            </div>
          </div>
        </div>
      </section>

      <section className="container section-tight last-listings">
        <div className="section-head">
          <div>
            <span className="eyebrow">Свежее в каталоге</span>
            <h2>Только что добавили</h2>
          </div>
          <Link className="see-all" to="/catalog">
            Весь каталог <ChevronRight size={15} />
          </Link>
        </div>

        <div className="category-strip" aria-label="Популярные жанры">
          {(facets.data?.genres?.slice(0, 8) || []).map((genre) => (
            <Link className="chip" key={genre.name} to={`/catalog?genre=${encodeURIComponent(genre.name)}`}>
              {genre.name} <span className="filter-count">{genre.count}</span>
            </Link>
          ))}
          {!facets.data?.genres?.length && (
            <Link className="chip" to="/catalog">Все жанры</Link>
          )}
        </div>

        <div className="mt-2">
          {latest.loading && !books.length ? (
            <BookGridSkeleton count={8} />
          ) : latest.error ? (
            <p className="alert">{latest.error}</p>
          ) : (
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
          )}
        </div>
      </section>

      <section className="container section">
        <div className="section-head">
          <div>
            <span className="eyebrow">Три шага</span>
            <h2>Как это работает</h2>
          </div>
          <Link className="see-all" to="/how-it-works">
            Подробнее <ChevronRight size={15} />
          </Link>
        </div>
        <div className="steps">
          <div className="step">
            <span className="step-index">01</span>
            <h3>Найдите книгу</h3>
            <p>Ищите по названию, автору, жанру и городу. Фильтры помогают отобрать состояние, цену и способ передачи.</p>
          </div>
          <div className="step">
            <span className="step-index">02</span>
            <h3>Напишите продавцу</h3>
            <p>Встроенный чат хранит историю переписки: договоритесь о встрече, уточните состояние и задайте вопросы.</p>
          </div>
          <div className="step">
            <span className="step-index">03</span>
            <h3>Передайте книгу</h3>
            <p>Встретьтесь лично или отправьте доставкой, затем отметьте сделку и оставьте отзыв продавцу.</p>
          </div>
        </div>
      </section>

      <section className="container">
        <div className="best-books">
          <span className="glow" aria-hidden="true" />
          <div className="best-layout">
            <div className="best-copy">
              <span className="eyebrow">Выбор сообщества</span>
              <h2>
                Книги,<br />
                <em>которые любят.</em>
              </h2>
              <p>Рейтинг строится на оценках читателей, которые держали книгу в руках и дошли до последней страницы.</p>
              <Link className="see-all" to="/catalog?sort=rating" style={{ marginTop: 20 }}>
                Смотреть все рейтинги <ChevronRight size={15} />
              </Link>
            </div>
            <div className="best-list">
              {best.loading && !best.data?.data?.length && (
                <div className="loading-block"><span className="spinner" /> Собираем рейтинг…</div>
              )}
              {best.data?.data?.slice(0, 6).map((book, index) => (
                <Link className="rank-row" key={`${book.title}-${book.author}`} to={`/listing/${book.id}`}>
                  <span className="rank-number">{String(index + 1).padStart(2, '0')}</span>
                  <Cover title={book.title} author={book.author} tone={book.tone} />
                  <span className="rank-title">
                    <strong>{book.title}</strong>
                    <small>{book.author}</small>
                  </span>
                  <span className="rank-score">
                    <Stars value={Number(book.rating)} size={11} />
                    {book.rating}
                    <small>{book.reviews}</small>
                  </span>
                </Link>
              ))}
              {!best.loading && !best.data?.data?.length && (
                <p className="text-muted text-small">Пока нет оценённых книг — станьте первым читателем с мнением.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="container section" id="faq">
        <div className="section-head">
          <div>
            <span className="eyebrow">Вопросы</span>
            <h2>Коротко о главном</h2>
          </div>
        </div>
        <div className="faq-list">
          {FAQ.map((item) => (
            <details className="faq-item" key={item.question}>
              <summary>
                {item.question}
                <Plus size={17} />
              </summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="container section-tight" style={{ paddingBottom: 'min(7vw, 84px)' }}>
        <div className="cta-banner">
          <div>
            <h2>Полка освободится — истории останутся.</h2>
            <p>Разместите первое объявление за пару минут. Это бесплатно.</p>
          </div>
          {user ? (
            <Link className="btn btn-primary btn-lg" to="/sell">
              <Plus size={17} /> Разместить книгу
            </Link>
          ) : (
            <Link className="btn btn-primary btn-lg" to="/register">
              Создать аккаунт <ArrowRight size={17} />
            </Link>
          )}
        </div>
      </section>

      <section className="container section-tight" style={{ paddingBottom: 'min(6vw, 60px)' }}>
        <div className="feature-grid">
          <div className="feature-card">
            <span className="icon-bubble"><Sparkles size={18} /></span>
            <h3>Без лишнего шума</h3>
            <p>Никаких навязчивых баннеров и сложных сценариев — только книги и люди, которым они нужны.</p>
          </div>
          <div className="feature-card">
            <span className="icon-bubble"><MessageCircle size={18} /></span>
            <h3>Живое общение</h3>
            <p>Встроенный чат с историей переписки и уведомлениями о новых сообщениях.</p>
          </div>
          <div className="feature-card">
            <span className="icon-bubble"><Star size={18} /></span>
            <h3>Честные оценки</h3>
            <p>Рейтинг книги и рейтинг продавца считаются отдельно — видно и содержание, и сделку.</p>
          </div>
        </div>
      </section>
    </>
  );
}
