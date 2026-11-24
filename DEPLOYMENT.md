# Деплой BookSwap

Два поддерживаемых сценария:

1. **Один сервис (проще всего)** — Render собирает фронтенд и API, Express раздаёт статику и
   подставляет SEO-теги. Один домен, нет CORS.
2. **Раздельно** — статика на Vercel, API на Render, PostgreSQL managed.

## Вариант 1. Один сервис на Render

1. Создайте **PostgreSQL** (Render → New → PostgreSQL) и скопируйте Internal Database URL.
2. Создайте **Web Service** из репозитория:
   - Root Directory: корень репозитория;
   - Build Command: `npm install && npm run build`;
   - Start Command: `npm start`;
   - Health Check Path: `/api/health`.
3. Переменные окружения:

   | Переменная | Значение |
   | --- | --- |
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | Internal Database URL (с `?sslmode=require`) |
   | `JWT_SECRET` | длинная случайная строка |
   | `JWT_EXPIRES_IN` | `30d` |
   | `ADMIN_LOGIN` / `ADMIN_PASSWORD` | свои значения |
   | `MODERATOR_LOGIN` / `MODERATOR_PASSWORD` | свои значения |
   | `CLIENT_ORIGINS` | публичный URL сервиса, например `https://bookswap.onrender.com` |
   | `PUBLIC_SITE_URL` | тот же URL (для canonical, sitemap и OG) |
   | `TRUST_PROXY` | `true` |

4. Первый запуск: `prestart` применит миграции автоматически. Демо-данные в production не
   создаются (`SEED_DEMO=false` по умолчанию при наличии `DATABASE_URL`). Чтобы загрузить их
   вручную: `npm run seed --workspace backend`.

`PUBLIC_SITE_URL` важнее, чем кажется: он попадает в canonical, Open Graph, `robots.txt`
и `sitemap.xml`. Если он не задан, API возьмёт хост из запроса — это работает, но менее надёжно
за прокси с несколькими доменами.

### Постоянные файлы

Диск Render по умолчанию эфемерный: загруженные фотографии книг и аватары исчезнут при
редеплое. Варианты:

- подключить Render Disk и указать `UPLOAD_DIR=/var/data/uploads`;
- либо перейти на S3-совместимое хранилище: поменять реализацию `POST /api/uploads/image`
  и добавлять абсолютные URL в `listings.images`.

## Вариант 2. Vercel (фронтенд) + Render (API)

**Render (API):**
- Build Command: `npm install`;
- Start Command: `npm start` (внутри `backend` миграции выполняются в `prestart`);
- переменные: `DATABASE_URL`, `JWT_SECRET`, staff-логины, `TRUST_PROXY=true`,
  `CLIENT_ORIGINS=https://<ваш-проект>.vercel.app`, `PUBLIC_SITE_URL=https://<ваш-проект>.vercel.app`.
- `SEED_DEMO` оставьте выключенным для боевой базы.

**Vercel (фронтенд):**
- Root Directory: `frontend`;
- Framework Preset: Vite;
- Build Command: `npm run build`, Output: `dist`;
- переменные:

  | Переменная | Значение |
  | --- | --- |
  | `VITE_API_URL` | `https://<api>.onrender.com/api` |
  | `VITE_PUBLIC_SITE_URL` | `https://<ваш-проект>.vercel.app` |

`frontend/vercel.json` уже содержит rewrite всех путей на `index.html` — без него прямые
ссылки вида `/listing/12` отдают 404.

**Важно:** SEO-теги для карточек рассчитывает API (у Vercel статика без SSR). Поэтому
в раздельном варианте основной домен для поисковиков и соцсетей — Vercel, а ссылки на карточки
открываются через rewrite на клиенте; для полноценного серверного SEO используйте вариант 1
или настройте проксирование `/listing/*` на Render.

## Проверка после деплоя

```bash
curl -sS https://<host>/api/health
curl -sS https://<host>/robots.txt
curl -sS https://<host>/sitemap.xml | head
curl -sS https://<host>/listing/1 | grep -o '<title>[^<]*</title>'
curl -sSI https://<host>/api/listings?limit=1 | grep -i cache-control
```

Ожидается: `status: ok` и `database: postgres`, корректный sitemap, подставленный `<title>`
с названием книги, `Cache-Control: no-store` у API.

## Частые проблемы

| Симптом | Причина и решение |
| --- | --- |
| `Origin is not allowed by CORS` | `CLIENT_ORIGINS` не совпадает с адресом браузера (нужен точный origin без слэша). Для локальной разработки оставьте `http://localhost:5173`. |
| 401 сразу после входа | разный `JWT_SECRET` между инстансами или истёк токен; удалите сессию в браузере и войдите снова. |
| `password authentication failed` / `no pg_hba.conf entry` | неверный `DATABASE_URL` или TLS: для managed PostgreSQL нужен `?sslmode=require`, для локального — `PGSSLMODE=disable`. |
| Пустые карточки после деплоя | фронтенд собран без `VITE_API_URL` (используется относительный `/api`, а API на другом домене). Пересоберите с переменной. |
| 404 на `/listing/12` при обновлении | нет SPA-fallback: используйте один сервис Render либо `frontend/vercel.json`. |
| Фото пропали после редеплоя | эфемерный диск; см. «Постоянные файлы». |
| `Too many requests` | сработал rate limit (20 попыток входа в минуту, 10 регистраций за 10 минут, 600 запросов API в минуту). |
| Неверные canonical/OG на проде | не задан `PUBLIC_SITE_URL` либо он с другим протоколом/доменом. |

## Миграции и откат

- Миграции применяются при `npm start` (backend `prestart`), вручную — `npm run migrate`.
- Все они идемпотентны; повторный запуск безопасен.
- Перед рискованными изменениями схемы делайте бэкап managed PostgreSQL средствами провайдера.
- Откат кода без отката схемы безопасен: приложение игнорирует неиспользуемые колонки.
