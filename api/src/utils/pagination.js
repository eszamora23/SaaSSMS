/**
 * Pagination Utilities
 */

/**
 * Parse pagination parameters from request query
 */
const parsePaginationParams = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = Math.min(parseInt(query.limit) || 20, 100); // Max 100 per page
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Build pagination response metadata
 */
const buildPaginationMeta = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

/**
 * Parse sort parameter
 * Expects format: "field:asc" or "-field" for desc
 */
const parseSortParam = (sortParam, defaultSort = { createdAt: -1 }) => {
  if (!sortParam) return defaultSort;

  const sortObj = {};

  // Handle format: "-field" or "field:desc"
  if (sortParam.startsWith('-')) {
    const field = sortParam.substring(1);
    sortObj[field] = -1;
  } else if (sortParam.includes(':')) {
    const [field, order] = sortParam.split(':');
    sortObj[field] = order.toLowerCase() === 'desc' ? -1 : 1;
  } else {
    sortObj[sortParam] = 1;
  }

  return sortObj;
};

/**
 * Paginate Mongoose query
 */
const paginateQuery = async (query, page, limit) => {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    query.skip(skip).limit(limit),
    query.model.countDocuments(query.getFilter()),
  ]);

  return {
    data,
    pagination: buildPaginationMeta(page, limit, total),
  };
};

module.exports = {
  parsePaginationParams,
  buildPaginationMeta,
  parseSortParam,
  paginateQuery,
};
