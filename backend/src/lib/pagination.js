const readParam = (source, key) => {
  if (!source) return undefined;
  if (typeof source.get === 'function') return source.get(key);
  return source[key];
};

export function parsePagination(query, { defaultLimit = 12, maxLimit = 48 } = {}) {
  const pageValue = Number.parseInt(readParam(query, 'page') || '1', 10);
  const requested = Number.parseInt(readParam(query, 'limit') || String(defaultLimit), 10);
  const page = Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1;
  const limit = Number.isFinite(requested) ? Math.min(maxLimit, Math.max(1, requested)) : defaultLimit;
  return { page, limit, offset: (page - 1) * limit };
}

export function paginated(data, { page, limit, total }) {
  return {
    data,
    total,
    page,
    limit,
    pages: Math.max(1, Math.ceil(total / limit)),
    hasMore: page * limit < total
  };
}
