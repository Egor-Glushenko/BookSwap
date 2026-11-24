import { Link } from 'react-router-dom';
import { ArrowLeft, Compass, Search } from 'lucide-react';
import { Seo } from '../shared/seo';
import { SITE_NAME } from '../shared/constants';

export function NotFoundPage({ title = 'Страница не найдена' }) {
  return (
    <>
      <Seo
        title={`${title} | ${SITE_NAME}`}
        description="Запрашиваемая страница не найдена. Вернитесь в каталог книг BookSwap."
        path="/404"
        noindex
      />
      <div className="container">
        <div className="not-found">
          <span className="code">404</span>
          <h1>{title}</h1>
          <p>Возможно, страница переехала или ссылка устарела. Книги никуда не пропали — они в каталоге.</p>
          <div className="row" style={{ justifyContent: 'center' }}>
            <Link className="btn btn-primary" to="/catalog">
              <Search size={16} /> В каталог
            </Link>
            <Link className="btn btn-secondary" to="/">
              <ArrowLeft size={16} /> На главную
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export function ForbiddenPage({ title = 'Недостаточно прав' }) {
  return (
    <>
      <Seo title={`${title} | ${SITE_NAME}`} description="Раздел доступен только для служебных аккаунтов." path="/403" noindex />
      <div className="container">
        <div className="not-found">
          <span className="code">403</span>
          <h1>{title}</h1>
          <p>Этот раздел доступен модераторам и администраторам BookSwap.</p>
          <div className="row" style={{ justifyContent: 'center' }}>
            <Link className="btn btn-primary" to="/catalog">
              <Compass size={16} /> В каталог
            </Link>
            <Link className="btn btn-secondary" to="/">На главную</Link>
          </div>
        </div>
      </div>
    </>
  );
}
