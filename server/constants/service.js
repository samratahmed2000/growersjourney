/**
 * Service content constants.
 *
 * The icon list mirrors `IconName` in `client/src/types/type.ts`. The server is
 * plain JavaScript and cannot import a TypeScript type, so the values are
 * duplicated deliberately. Keep both lists in sync.
 */
export const SERVICE_ICONS = Object.freeze([
  "code",
  "workflow",
  "sparkles",
  "search",
  "planning",
  "design",
  "build",
  "quality",
  "launch",
  "target",
  "layers",
  "communication",
  "responsive",
  "maintenance",
  "automation",
]);

export const SERVICE_LIMITS = Object.freeze({
  title: { min: 2, max: 120 },
  slug: { min: 2, max: 80 },
  summary: { min: 10, max: 500 },
  description: { max: 5000 },
  audience: { max: 1000 },
  listItems: 20,
  listItemLength: 500,
  technologyItems: 30,
  technologyLength: 50,
  sortOrder: 9999,
});
