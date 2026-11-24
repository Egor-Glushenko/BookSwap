import { Link } from 'react-router-dom';
import {
  ArrowRight, Check, Handshake, MessageCircle, Search, ShieldCheck, Star, Truck
} from 'lucide-react';
import { Seo, SITE_URL } from '../shared/seo';
import { SITE_NAME } from '../shared/constants';

const STEPS = [
  {
    icon: Search,
    title: 'Найдите книгу',
    text: 'Фильтруйте каталог по жанру, городу, состоянию и цене. В карточке видны рейтинг книги, рейтинг продавца и способ передачи.',
    details: ['Поиск по названию и автору', 'Фильтры по жанру и городу', 'Сортировка по цене и рейтингу']
  },
  {
    icon: MessageCircle,
    title: 'Договоритесь в чате',
    text: 'Напишите продавцу: уточните состояние, попросите дополнительные фото и обсудите место встречи. История переписки сохраняется.',
    details: ['Встроенный чат без обмена телефонами', 'Уведомления о новых сообщениях', 'Можно вернуться к диалогу позже']
  },
  {
    icon: Handshake,
    title: 'Передайте книгу',
    text: 'Встретьтесь лично или отправьте доставкой. После передачи отметьте объявление как «Передано» — оно уйдёт из каталога.',
    details: ['Самовывоз или доставка', 'Засчитанная сделка в профиле', 'Отзыв о продавце и оценка книги']
  }
];

const SAFETY = [
  'Смотрите рейтинг продавца и отзывы о прошлых сделках — они формируются только после реальных передач книг.',
  'Просите дополнительные фотографии обложки, корешка и страниц, если в объявлении только одно фото.',
  'Встречайтесь в людных местах: у метро, в библиотеке, у кафе. Для доставки выбирайте оплату при получении.',
  'Все расчёты происходят напрямую между читателями. BookSwap не запрашивает данные карт и не берёт комиссию.',
  'Подозрительное объявление можно отправить модератору кнопкой «Пожаловаться» — жалоба попадёт в панель модерации.'
];

const FAQ = [
  { q: 'Можно ли размещать объявления бесплатно?', a: 'Да. Размещение и обмен сообщениями бесплатны и не ограничены количеством книг.' },
  { q: 'Как продавец получает деньги?', a: 'Напрямую от покупателя при встрече или при получении посылки. BookSwap не участвует в расчётах и не берёт комиссию.' },
  { q: 'Что происходит после передачи книги?', a: 'Продавец отмечает объявление как переданное, книга исчезает из каталога, а сделка засчитывается в профиле. После этого можно оставить отзыв.' },
  { q: 'Кто модерирует объявления?', a: 'Объявления публикуются сразу, но модераторы проверяют жалобы и могут снять нарушающее правила объявление или заблокировать аккаунт.' },
  { q: 'Можно ли редактировать объявление?', a: 'Да, в личном кабинете доступны редактирование, снятие с публикации и возврат в каталог.' }
];

export function HowItWorksPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'HowTo',
        name: 'Как передать книгу на BookSwap',
        description: 'Три шага: найти книгу, договориться в чате и передать её новому читателю.',
        totalTime: 'PT10M',
        step: STEPS.map((step, index) => ({
          '@type': 'HowToStep',
          position: index + 1,
          name: step.title,
          text: step.text,
          url: `${SITE_URL}/how-it-works#step-${index + 1}`
        }))
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQ.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a }
        }))
      }
    ]
  };

  return (
    <>
      <Seo
        title={`Как это работает — передача книг | ${SITE_NAME}`}
        description="Как продать, обменять или отдать книгу на BookSwap: поиск, общение в чате, безопасная передача и отзывы."
        path="/how-it-works"
        jsonLd={jsonLd}
      />

      <div className="container">
        <div className="content-hero">
          <span className="eyebrow"><span className="dot" /> Три шага</span>
          <h1>
            Книга переходит из рук в руки,<br />
            <em>без лишних посредников.</em>
          </h1>
          <p className="lede">
            BookSwap не продаёт книги и не берёт комиссию. Мы даём каталог, чат и инструменты доверия,
            а сделку вы заключаете напрямую с другим читателем.
          </p>
          <div className="row">
            <Link className="btn btn-primary" to="/catalog">Найти книгу <ArrowRight size={16} /></Link>
            <Link className="btn btn-secondary" to="/sell">Разместить объявление</Link>
          </div>
        </div>

        <div className="steps section-tight">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div className="step" key={step.title} id={`step-${index + 1}`}>
                <span className="step-index">{String(index + 1).padStart(2, '0')}</span>
                <span className="icon-bubble" style={{ background: 'var(--blue-soft)', color: 'var(--blue-ink)', width: 38, height: 38, borderRadius: 11 }}>
                  <Icon size={17} />
                </span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
                <ul className="stack" style={{ gap: 6, marginTop: 4 }}>
                  {step.details.map((detail) => (
                    <li key={detail} className="row" style={{ gap: 7, color: 'var(--muted)', fontSize: 12.5 }}>
                      <Check size={13} color="var(--green)" /> {detail}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <section className="section-tight">
          <div className="section-head">
            <div>
              <span className="eyebrow">Безопасность</span>
              <h2>Как сделать сделку спокойной</h2>
            </div>
            <span className="badge soft"><ShieldCheck size={13} /> проверки и модерация</span>
          </div>
          <div className="feature-grid">
            {SAFETY.slice(0, 3).map((rule) => (
              <div className="feature-card" key={rule}>
                <span className="icon-bubble"><Star size={17} /></span>
                <p style={{ fontSize: 13.5, color: 'var(--ink-2)' }}>{rule}</p>
              </div>
            ))}
          </div>
          <ul className="stack mt-2" style={{ gap: 8 }}>
            {SAFETY.slice(3).map((rule) => (
              <li key={rule} className="row" style={{ gap: 9, alignItems: 'flex-start', color: 'var(--muted)', fontSize: 13.5 }}>
                <Truck size={15} style={{ flex: '0 0 auto', marginTop: 3 }} />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="section-tight" id="faq">
          <div className="section-head">
            <div>
              <span className="eyebrow">Вопросы</span>
              <h2>Частые вопросы</h2>
            </div>
          </div>
          <div className="faq-list">
            {FAQ.map((item) => (
              <details className="faq-item" key={item.q}>
                <summary>{item.q} <span aria-hidden="true">+</span></summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="section-tight" style={{ paddingBottom: 'min(7vw, 84px)' }}>
          <div className="cta-banner">
            <div>
              <h2>Начните с одной книги.</h2>
              <p>Разместите объявление — это займёт пару минут и ничего не стоит.</p>
            </div>
            <Link className="btn btn-primary btn-lg" to="/sell">Разместить книгу</Link>
          </div>
        </section>
      </div>
    </>
  );
}
