const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

function write(level, message, meta) {
  if (isTest && level !== 'error') return;
  const line = meta && Object.keys(meta).length ? `${message} ${JSON.stringify(meta)}` : message;
  const target = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  if (isProduction) {
    target(JSON.stringify({ level, message, ...meta, time: new Date().toISOString() }));
  } else {
    target(`[${new Date().toISOString()}] ${level.toUpperCase()} ${line}`);
  }
}

export const logger = {
  info: (message, meta) => write('info', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  error: (message, meta) => write('error', message, meta)
};

/** Minimal request logger: method, path, status, duration. */
export function requestLogger(request, response, next) {
  const startedAt = process.hrtime.bigint();
  response.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    if (request.path === '/api/health') return;
    const meta = {
      method: request.method,
      path: request.originalUrl,
      status: response.statusCode,
      ms: Math.round(durationMs)
    };
    const log = response.statusCode >= 500 ? logger.error : response.statusCode >= 400 ? logger.warn : logger.info;
    log(`${request.method} ${request.originalUrl} ${response.statusCode}`, meta);
  });
  next();
}
