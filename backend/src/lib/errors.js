export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export const badRequest = (message = 'Некорректный запрос', details) => new ApiError(400, message, details);
export const unauthorized = (message = 'Необходима авторизация') => new ApiError(401, message);
export const forbidden = (message = 'Недостаточно прав') => new ApiError(403, message);
export const notFound = (message = 'Не найдено') => new ApiError(404, message);
export const conflict = (message = 'Конфликт данных') => new ApiError(409, message);
export const tooManyRequests = (message = 'Слишком много запросов, попробуйте позже') => new ApiError(429, message);

/** Wraps async route handlers so rejected promises reach the Express error middleware. */
export const asyncHandler = (handler) => (request, response, next) => {
  Promise.resolve(handler(request, response, next)).catch(next);
};
