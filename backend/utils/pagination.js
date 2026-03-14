function normalizePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getPagination(query, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const page = normalizePositiveInt(query.page, 1);
  const requestedLimit = normalizePositiveInt(query.limit, defaultLimit);
  const limit = Math.min(requestedLimit, maxLimit);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

function buildPaginationMeta({ total, page, limit }) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
}

module.exports = { getPagination, buildPaginationMeta };
