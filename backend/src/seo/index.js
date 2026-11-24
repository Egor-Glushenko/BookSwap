import { query } from '../db/index.js';
import { listingRepository } from '../repositories/listing.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { mapListing, mapUser } from '../lib/mappers.js';
import { config } from '../config/env.js';

const escapeXml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

const staticEntries = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/catalog', changefreq: 'daily', priority: '0.9' },
  { path: '/how-it-works', changefreq: 'monthly', priority: '0.6' },
  { path: '/login', changefreq: 'yearly', priority: '0.3' },
  { path: '/register', changefreq: 'yearly', priority: '0.3' }
];

const cache = new Map();
const CACHE_TTL = 10 * 60_000;

export async function buildSitemap(origin = config.publicSiteUrl) {
  const cached = cache.get(origin);
  if (cached && Date.now() - cached.at < CACHE_TTL) return cached.xml;

  const [listingsResult, sellersResult] = await Promise.all([
    query(
      `SELECT id, updated_at FROM listings
       WHERE status IN ('active', 'sold')
       ORDER BY updated_at DESC
       LIMIT 5000`
    ),
    query(
      `SELECT DISTINCT l.seller_id AS id, MAX(l.updated_at) AS updated_at
       FROM listings l
       WHERE l.status = 'active'
       GROUP BY l.seller_id
       ORDER BY updated_at DESC
       LIMIT 2000`
    )
  ]);

  const base = origin;
  const urls = [
    ...staticEntries.map((entry) => ({
      loc: `${base}${entry.path}`,
      changefreq: entry.changefreq,
      priority: entry.priority,
      lastmod: new Date().toISOString().slice(0, 10)
    })),
    ...listingsResult.rows.map((row) => ({
      loc: `${base}/listing/${row.id}`,
      changefreq: 'weekly',
      priority: '0.8',
      lastmod: new Date(row.updated_at || Date.now()).toISOString().slice(0, 10)
    })),
    ...sellersResult.rows.map((row) => ({
      loc: `${base}/seller/${row.id}`,
      changefreq: 'weekly',
      priority: '0.5',
      lastmod: new Date(row.updated_at || Date.now()).toISOString().slice(0, 10)
    }))
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

  cache.set(origin, { at: Date.now(), xml });
  return xml;
}

export function invalidateSitemapCache() {
  cache.clear();
}

export function robotsTxt(origin = config.publicSiteUrl) {
  return `User-agent: *
Allow: /
Disallow: /api/
Disallow: /profile
Disallow: /favorites
Disallow: /chats
Disallow: /moderation

Sitemap: ${origin}/sitemap.xml
Host: ${origin.replace(/^https?:\/\//, '')}
`;
}

/**
 * Server-rendered <head> for crawlers and social previews. Client-side
 * navigation keeps the same tags in sync through <Seo /> in the React app.
 */
export async function buildMeta(pathname, origin = config.publicSiteUrl) {
  const base = origin;
  const defaults = {
    title: 'BookSwap — книги находят своих людей',
    description: 'BookSwap — маркетплейс книг: купить, обменять или забрать бесплатно. Живой каталог с фильтрами, рейтингами книг и продавцов, встроенным чатом и безопасной модерацией.',
    url: `${base}${pathname === '/' ? '/' : pathname}`,
    image: `${base}/og-cover.svg`,
    type: 'website',
    jsonLd: null,
    noindex: false
  };

  const listingMatch = /^\/listing\/(\d+)\/?$/.exec(pathname);
  const sellerMatch = /^\/seller\/([0-9a-fA-F-]{36})\/?$/.exec(pathname);

  if (listingMatch) {
    const row = await listingRepository.findById(Number(listingMatch[1]));
    if (row) {
      const listing = mapListing(row);
      const priceLabel = listing.priceValue ? `${listing.priceValue} RUB` : listing.price;
      return {
        ...defaults,
        title: `${listing.title} — ${listing.author} | BookSwap`,
        description: `${listing.title}, ${listing.author}. Состояние: ${listing.condition}. ${listing.city}. ${listing.price}. ${listing.description}`.slice(0, 300),
        url: `${base}/listing/${listing.id}`,
        image: listing.coverUrl ? `${base}${listing.coverUrl}` : `${base}/og-cover.svg`,
        type: 'product',
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'Book',
          name: listing.title,
          author: { '@type': 'Person', name: listing.author },
          genre: listing.genre || undefined,
          isbn: listing.isbn || undefined,
          numberOfPages: undefined,
          aggregateRating: listing.reviews
            ? { '@type': 'AggregateRating', ratingValue: listing.rating, reviewCount: listing.reviews }
            : undefined,
          offers: {
            '@type': 'Offer',
            price: listing.priceValue ?? 0,
            priceCurrency: 'RUB',
            availability: listing.status === 'active' ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
            url: `${base}/listing/${listing.id}`,
            seller: { '@type': 'Person', name: listing.seller },
            description: priceLabel
          }
        }
      };
    }
    return { ...defaults, title: 'Объявление не найдено | BookSwap', noindex: true, status: 404 };
  }

  if (sellerMatch) {
    const user = await userRepository.findPublicById(sellerMatch[1]);
    if (user && !user.is_blocked) {
      const seller = mapUser(user);
      return {
        ...defaults,
        title: `${seller.name} — продавец книг | BookSwap`,
        description: `Книги продавца ${seller.name} из города ${seller.city}. Рейтинг ${seller.rating || 0}, ${seller.deals || 0} сделок.`,
        url: `${base}/seller/${seller.id}`,
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: seller.name,
          address: seller.city,
          aggregateRating: seller.rating
            ? { '@type': 'AggregateRating', ratingValue: seller.rating, reviewCount: Math.max(1, seller.deals || 1) }
            : undefined
        }
      };
    }
    return { ...defaults, title: 'Продавец не найден | BookSwap', noindex: true, status: 404 };
  }

  if (/^\/(profile|favorites|chats|moderation|sell)/.test(pathname)) {
    return { ...defaults, title: 'Личный кабинет | BookSwap', noindex: true };
  }

  return defaults;
}

export function renderMetaTags(meta) {
  const tags = [
    `<title>${escapeXml(meta.title)}</title>`,
    `<meta name="description" content="${escapeXml(meta.description)}" />`,
    `<link rel="canonical" href="${escapeXml(meta.url)}" />`,
    `<meta name="robots" content="${meta.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'}" />`,
    `<meta property="og:type" content="${escapeXml(meta.type)}" />`,
    `<meta property="og:site_name" content="BookSwap" />`,
    `<meta property="og:locale" content="ru_RU" />`,
    `<meta property="og:title" content="${escapeXml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeXml(meta.description)}" />`,
    `<meta property="og:url" content="${escapeXml(meta.url)}" />`,
    `<meta property="og:image" content="${escapeXml(meta.image)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeXml(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeXml(meta.description)}" />`,
    `<meta name="twitter:image" content="${escapeXml(meta.image)}" />`
  ];
  if (meta.jsonLd) {
    tags.push(`<script type="application/ld+json">${JSON.stringify(meta.jsonLd).replaceAll('</', '<\\/')}</script>`);
  }
  return tags.join('\n    ');
}
