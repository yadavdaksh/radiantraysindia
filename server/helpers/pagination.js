export const getPaginationParams = (query, defaultLimit = 20, maxLimit = 100) => {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || defaultLimit), 1), maxLimit);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const formatPaginatedResponse = (items, page, limit, total) => {
  return {
    items,
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  };
};
