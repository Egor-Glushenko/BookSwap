import { ApiError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

export function notFoundHandler(request, _response, next) {
  next(new ApiError(404, `Маршрут ${request.method} ${request.originalUrl} не найден`));
}

export function errorHandler(error, request, response, _next) {
  let status = Number(error.status || error.statusCode) || 500;
  let message = error.message || 'Внутренняя ошибка сервера';

  if (error.type === 'entity.too.large') {
    status = 413;
    message = 'Слишком большой запрос';
  } else if (error.type === 'entity.parse.failed') {
    status = 400;
    message = 'Некорректный JSON в запросе';
  } else if (error.code === 'LIMIT_FILE_SIZE') {
    status = 413;
    message = 'Файл слишком большой';
  } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    status = 400;
    message = 'Неожиданное поле с файлом';
  } else if (error.code === '23505' || error.code === '23514' || error.code === '23503') {
    status = 400;
    message = 'Данные не прошли проверку ограничений базы';
  } else if (error.code === '22P02') {
    status = 400;
    message = 'Некорректный формат данных';
  }

  if (status >= 500) {
    logger.error('unhandled request error', {
      method: request.method,
      path: request.originalUrl,
      error: error.message,
      stack: configStack(error)
    });
    if (process.env.NODE_ENV === 'production') message = 'Внутренняя ошибка сервера';
  }

  response.status(status).json({
    error: message,
    ...(error.details ? { details: error.details } : {})
  });
}

function configStack(error) {
  return process.env.NODE_ENV === 'production' ? undefined : error.stack?.split('\n').slice(0, 6).join('\n');
}
