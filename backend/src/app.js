import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import cors from 'cors';
import express from 'express';
import { config } from './config/env.js';
import { databaseHealth, databaseKind } from './db/index.js';
import authRouter from './routes/auth.routes.js';
import usersRouter from './routes/users.routes.js';
import listingsRouter from './routes/listings.routes.js';
import favoritesRouter from './routes/favorites.routes.js';
import booksRouter from './routes/books.routes.js';
import chatsRouter from './routes/chats.routes.js';
import moderationRouter from './routes/moderation.routes.js';
import uploadsRouter from './routes/uploads.routes.js';
import { corsDelegate, rateLimit, securityHeaders } from './middleware/security.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { requestLogger } from './lib/logger.js';
import { buildMeta, buildSitemap, invalidateSitemapCache, renderMetaTags, robotsTxt } from './seo/index.js';
import { asyncHandler } from './lib/errors.js';

const SEO_START = '<!--seo-head-start-->';
const SEO_END = '<!--seo-head-end-->';

// Only these client routes are real pages; anything else must answer 404 so
// search engines do not index arbitrary URLs.
const SPA_ROUTES = [
  /^\/$/,
  /^\/catalog\/?$/,
  /^\/listing\/\d+\/?$/,
  /^\/listing\/\d+\/edit\/?$/,
  /^\/seller\/[0-9a-f-]{36}\/?$/i,
  /^\/how-it-works\/?$/,
  /^\/login\/?$/,
  /^\/register\/?$/,
  /^\/sell\/?$/,
  /^\/profile\/?$/,
  /^\/favorites\/?$/,
  /^\/chats\/?$/,
  /^\/moderation\/?$/
];

function injectHead(html, tags) {
  const start = html.indexOf(SEO_START);
  const end = html.indexOf(SEO_END);
  if (start !== -1 && end !== -1) {
    return `${html.slice(0, start)}${tags}\n    ${html.slice(end + SEO_END.length)}`;
  }
  return html.replace('</head>', `    ${tags}\n  </head>`);
}

export async function createApp({ serveFrontend = true } = {}) {
  const app = express();

  app.set('trust proxy', config.trustProxy);
  app.disable('x-powered-by');

  app.use(securityHeaders);
  app.use(cors(corsDelegate));
  app.use(express.json({ limit: config.requestLimit }));
  app.use(express.urlencoded({ extended: false, limit: config.requestLimit }));
  app.use(requestLogger);

  const apiLimiter = rateLimit({ windowMs: 60_000, max: 600 });
  app.use('/api', apiLimiter);
  app.use('/api', (_request, response, next) => {
    response.setHeader('Cache-Control', 'no-store');
    next();
  });

  app.get('/api/health', asyncHandler(async (_request, response) => {
    const healthy = await databaseHealth();
    response.status(healthy ? 200 : 503).json({
      status: healthy ? 'ok' : 'degraded',
      service: 'bookswap-api',
      database: databaseKind(),
      uptime: Math.round(process.uptime()),
      time: new Date().toISOString()
    });
  }));

  app.get('/api', (_request, response) => {
    response.json({
      name: 'BookSwap API',
      version: '1.1.0',
      docs: 'https://github.com/bookswap/bookswap#readme',
      endpoints: [
        'GET /api/health',
        'POST /api/auth/register',
        'POST /api/auth/login',
        'GET /api/auth/me',
        'PATCH /api/auth/me',
        'GET /api/users/:id',
        'GET /api/listings',
        'GET /api/listings/filters',
        'GET /api/listings/:id',
        'POST /api/listings',
        'PATCH /api/listings/:id',
        'PATCH /api/listings/:id/status',
        'DELETE /api/listings/:id',
        'GET /api/favorites',
        'POST /api/favorites/:listingId',
        'GET /api/books/best',
        'GET /api/books/:id/ratings',
        'POST /api/books/:id/rating',
        'GET /api/chats',
        'POST /api/chats',
        'GET /api/chats/:id/messages',
        'POST /api/chats/:id/messages',
        'GET /api/moderation/categories',
        'POST /api/moderation/reports',
        'GET /api/moderation/reviews/:sellerId',
        'POST /api/moderation/reviews',
        'POST /api/uploads/image',
        'GET /sitemap.xml',
        'GET /robots.txt'
      ]
    });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/listings', listingsRouter);
  app.use('/api/favorites', favoritesRouter);
  app.use('/api/books', booksRouter);
  app.use('/api/chats', chatsRouter);
  app.use('/api/moderation', moderationRouter);
  app.use('/api/uploads', uploadsRouter);

  if (existsSync(config.uploadDir)) {
    app.use(config.uploadsPublicPath, express.static(config.uploadDir, {
      maxAge: '30d',
      immutable: true,
      fallthrough: true,
      index: false
    }));
  }

  const requestOrigin = (request) => (config.publicSiteUrlConfigured
    ? config.publicSiteUrl
    : `${request.protocol}://${request.get('host')}`);

  app.get('/robots.txt', (request, response) => {
    response.type('text/plain').send(robotsTxt(requestOrigin(request)));
  });

  app.get('/sitemap.xml', asyncHandler(async (request, response) => {
    response.type('application/xml').send(await buildSitemap(requestOrigin(request)));
  }));

  const indexPath = join(config.frontendDist, 'index.html');
  const hasFrontend = serveFrontend && existsSync(indexPath);

  if (!hasFrontend) {
    app.get('/', (_request, response) => {
      response.type('html').send(`<!doctype html><html lang="ru"><meta charset="utf-8">
<title>BookSwap API</title>
<body style="font-family:system-ui;padding:40px;max-width:640px;margin:auto;line-height:1.6">
<h1>BookSwap API работает</h1>
<p>Собранный фронтенд не найден в <code>${config.frontendDist}</code>.</p>
<p>Запустите <code>npm run build</code> в корне проекта или используйте Vite dev-сервер на <code>http://localhost:5173</code>.</p>
<p><a href="/api/health">/api/health</a> · <a href="/api">/api</a> · <a href="/sitemap.xml">/sitemap.xml</a></p>
</body></html>`);
    });
  }

  if (hasFrontend) {
    app.use(express.static(config.frontendDist, {
      index: false,
      maxAge: '1y',
      immutable: true,
      setHeaders(response, filePath) {
        if (filePath.endsWith('index.html')) response.setHeader('Cache-Control', 'no-cache');
      }
    }));

    app.get('*', async (request, response, next) => {
      if (request.path.startsWith('/api') || request.path.startsWith(config.uploadsPublicPath)) return next();
      try {
        const html = await readFile(indexPath, 'utf8');
        const meta = await buildMeta(request.path, requestOrigin(request));
        const known = SPA_ROUTES.some((route) => route.test(request.path));
        if (!known) {
          Object.assign(meta, {
            title: 'Страница не найдена | BookSwap',
            description: 'Запрашиваемая страница не найдена. Откройте каталог книг BookSwap.',
            noindex: true,
            status: 404
          });
        }
        response.setHeader('Cache-Control', 'no-cache');
        response.status(meta.status || 200).type('html').send(injectHead(html, renderMetaTags(meta)));
      } catch (error) {
        next(error);
      }
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  // Exposed so write endpoints can drop the cached sitemap after changes.
  app.locals.invalidateSitemapCache = invalidateSitemapCache;

  return app;
}
