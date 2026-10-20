/**
 * Shared limits for the admin API.
 *
 * Keeping the pagination bounds in one place means every list endpoint rejects
 * the same oversized requests instead of quietly loading a whole collection.
 */
export const ADMIN_PAGINATION = Object.freeze({
  defaultPage: 1,
  defaultLimit: 20,
  maxLimit: 100,
  maxPage: 10000,
});

export const ADMIN_SEARCH_MAX = 100;
