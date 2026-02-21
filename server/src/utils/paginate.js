/**
 * Pagination Utility
 *
 * Extracts page & limit from query params, returns skip/limit values
 * and a helper to build the paginated response.
 *
 * Usage in controllers:
 *   const { skip, limit, page } = paginate(req.query);
 *   const items = await Model.find(filter).skip(skip).limit(limit);
 *   const total = await Model.countDocuments(filter);
 *   return res.json(paginatedResponse(items, total, page, limit, 'Items fetched'));
 */

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Parse pagination params from query string
 * @param {Object} query - req.query
 * @returns {{ page: number, limit: number, skip: number }}
 */
const paginate = (query = {}) => {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  if (isNaN(page) || page < 1) page = DEFAULT_PAGE;
  if (isNaN(limit) || limit < 1) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Build a standardized paginated response
 * @param {Array} data - array of documents
 * @param {number} total - total count of documents matching the filter
 * @param {number} page - current page
 * @param {number} limit - items per page
 * @param {string} message - response message
 */
const paginatedResponse = (data, total, page, limit, message = 'Data fetched') => {
  return {
    success: true,
    message,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
};

module.exports = { paginate, paginatedResponse };
