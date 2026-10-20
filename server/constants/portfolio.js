/** Portfolio content states. */
export const PORTFOLIO_STATUSES = Object.freeze([
  "CONCEPT",
  "IN_PROGRESS",
  "COMPLETED",
]);

export const INITIAL_PORTFOLIO_STATUS = "CONCEPT";

export const PORTFOLIO_LIMITS = Object.freeze({
  title: { min: 2, max: 120 },
  slug: { min: 2, max: 80 },
  summary: { min: 10, max: 500 },
  description: { max: 5000 },
  category: { max: 80 },
  url: { max: 2048 },
  imageUrls: 8,
  technologyItems: 30,
  technologyLength: 50,
  featureItems: 20,
  featureLength: 500,
});
