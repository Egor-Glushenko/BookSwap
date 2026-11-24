import { useEffect } from 'react';

const SITE_URL = (import.meta.env.VITE_PUBLIC_SITE_URL
  || (typeof window !== 'undefined' ? window.location.origin : ''))
  .replace(/\/+$/, '');

function setMeta(attribute, key, content) {
  if (!content) return;
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setLink(rel, href) {
  let element = document.head.querySelector(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

function setJsonLd(jsonLd) {
  const existing = document.getElementById('seo-jsonld');
  if (!jsonLd) {
    if (existing) existing.remove();
    return;
  }
  const script = existing || document.createElement('script');
  script.type = 'application/ld+json';
  script.id = 'seo-jsonld';
  script.textContent = JSON.stringify(jsonLd);
  if (!existing) document.head.appendChild(script);
}

/**
 * Keeps <head> in sync during client-side navigation. Crawlers receive the
 * same tags pre-rendered by the API (see backend/src/seo/index.js).
 */
export function Seo({
  title,
  description,
  path = '/',
  image = '/og-cover.svg',
  type = 'website',
  noindex = false,
  jsonLd = null
}) {
  const url = `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const imageUrl = /^https?:\/\//i.test(image) ? image : `${SITE_URL}${image}`;

  useEffect(() => {
    document.title = title;
    setMeta('name', 'description', description);
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', imageUrl);
    setMeta('property', 'og:site_name', 'BookSwap');
    setMeta('property', 'og:locale', 'ru_RU');
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', imageUrl);
    setLink('canonical', url);
    setJsonLd(jsonLd);
  }, [title, description, url, imageUrl, type, noindex, jsonLd]);

  return null;
}

export { SITE_URL };
