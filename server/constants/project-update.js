/** Project update visibility. INTERNAL is deliberately the default. */
export const PROJECT_UPDATE_VISIBILITIES = Object.freeze([
  "INTERNAL",
  "CLIENT",
]);

export const INITIAL_PROJECT_UPDATE_VISIBILITY = "INTERNAL";

export const PROJECT_UPDATE_LIMITS = Object.freeze({
  title: { min: 2, max: 160 },
  body: { min: 1, max: 5000 },
});
