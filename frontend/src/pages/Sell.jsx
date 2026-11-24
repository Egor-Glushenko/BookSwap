import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, Info } from 'lucide-react';
import { listingsApi } from '../shared/api';
import { useFetch } from '../shared/hooks';
import { useAuth } from '../shared/auth';
import { useToast } from '../shared/toast';
import { Seo } from '../shared/seo';
import { ListingForm } from '../components/ListingForm';
import { DetailSkeleton } from '../components/Skeletons';
import { EmptyState } from '../components/EmptyState';
import { SITE_NAME } from '../shared/constants';

export function SellPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { notify } = useToast();

  const submit = async (payload) => {
    const result = await listingsApi.create(token, payload);
    notify('Объявление опубликовано');
    navigate(`/listing/${result.data.id}`);
  };

  return (
    <>
      <Seo
        title={`Разместить книгу | ${SITE_NAME}`}
        description="Разместите книгу на BookSwap: продажа, обмен или бесплатная передача. Размещение бесплатно, объявление сразу появляется в каталоге."
        path="/sell"
        noindex
      />

      <div className="container page">
        <nav className="breadcrumbs" aria-label="Хлебные крошки">
          <Link to="/">Главная</Link>
          <ChevronRight size={12} />
          <span>Новое объявление</span>
        </nav>

        <div className="page-head">
          <span className="eyebrow"><span className="dot" /> Новое объявление</span>
          <h1>Поделитесь книгой</h1>
          <p className="lede">
            Заполните карточку книги — так её будет проще найти. Объявление сразу появится в каталоге,
            а вы сможете редактировать его в любой момент.
          </p>
          <p className="alert info" style={{ maxWidth: 640 }}>
            <Info size={15} />
            <span>
              Публикуя объявление, вы подтверждаете, что книга ваша и не нарушает правила сервиса.
              {user?.city && user.city !== 'Не указан' ? ` Город по умолчанию — ${user.city}.` : ''}
            </span>
          </p>
        </div>

        <ListingForm onSubmit={submit} submitLabel="Опубликовать объявление" />
      </div>
    </>
  );
}

export function EditListingPage() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { notify } = useToast();
  const listing = useFetch((signal) => listingsApi.get(id, signal), [id]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [id]);

  const book = listing.data?.data;
  const isOwner = Boolean(book && user && book.sellerId === user.id);

  const submit = async (payload) => {
    const result = await listingsApi.update(token, id, payload);
    notify('Изменения сохранены');
    navigate(`/listing/${result.data.id}`);
  };

  if (listing.loading && !book) {
    return <div className="container page"><DetailSkeleton /></div>;
  }

  if (listing.error || !book) {
    return (
      <div className="container page">
        <EmptyState
          icon={Info}
          title="Объявление не найдено"
          description="Возможно, оно уже снято с публикации."
          action={<Link className="btn btn-primary" to="/profile">В личный кабинет</Link>}
        />
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="container page">
        <EmptyState
          icon={Info}
          title="Нет прав на редактирование"
          description="Редактировать объявление может только его автор."
          action={<Link className="btn btn-primary" to={`/listing/${book.id}`}>Вернуться к объявлению</Link>}
        />
      </div>
    );
  }

  return (
    <>
      <Seo
        title={`Редактирование «${book.title}» | ${SITE_NAME}`}
        description="Редактирование объявления BookSwap."
        path={`/listing/${book.id}/edit`}
        noindex
      />

      <div className="container page">
        <nav className="breadcrumbs" aria-label="Хлебные крошки">
          <Link to="/profile">Личный кабинет</Link>
          <ChevronRight size={12} />
          <Link to={`/listing/${book.id}`}>{book.title}</Link>
          <ChevronRight size={12} />
          <span>Редактирование</span>
        </nav>

        <div className="page-head">
          <span className="eyebrow">Редактирование</span>
          <h1>{book.title}</h1>
          <p className="lede">Обновите цену, состояние или описание — изменения сразу увидят покупатели.</p>
        </div>

        <ListingForm initial={book} onSubmit={submit} submitLabel="Сохранить изменения" compact />
      </div>
    </>
  );
}
