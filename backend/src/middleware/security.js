import { config } from '../config/env.js';

/** Security headers applied to every response (API + pre-rendered pages). */
export function securityHeaders(_request, response, next) {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'SAMEORIGIN');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('X-DNS-Prefetch-Control', 'off');
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  response.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "img-src 'self' data: blob: https:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self'",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'"
    ].join('; ')
  );
  next();
}

/**
 * Small in-memory fixed-window limiter. Enough for a single-instance MVP and it
 * keeps brute-force attempts on /auth away without extra infrastructure.
 */
export function rateLimit({ windowMs = 60_000, max = 30, message = 'Слишком много запросов, попробуйте позже' } = {}) {
  const buckets = new Map();
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
  }, windowMs);
  timer.unref?.();

  return (request, response, next) => {
    const key = `${request.ip}:${request.baseUrl}${request.path}`;
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    response.setHeader('RateLimit-Limit', String(max));
    response.setHeader('RateLimit-Remaining', String(Math.max(0, max - bucket.count)));
    if (bucket.count > max) {
      response.setHeader('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
      return next(Object.assign(new Error(message), { status: 429 }));
    }
    next();
  };
}

/**
 * CORS delegate. Same-origin requests (including module scripts, which always
 * send an Origin header) and configured domains get CORS headers; everyone else
 * simply receives no CORS headers and is blocked by the browser.
 */
export function corsDelegate(request, callback) {
  const origin = request.headers.origin;
  const normalized = origin ? origin.replace(/\/+$/, '') : '';
  const selfOrigin = `${request.protocol}://${request.get('host')}`;
  const allowed = !origin
    || config.allowAllOrigins
    || normalized === selfOrigin
    || config.allowedOrigins.includes(normalized);

  callback(null, {
    origin: allowed ? normalized || true : false,
    credentials: false,
    exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining'],
    maxAge: 86_400
  });
}
