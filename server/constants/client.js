/** Business record statuses for a client. */
export const CLIENT_STATUSES = Object.freeze(["ACTIVE", "INACTIVE"]);

export const INITIAL_CLIENT_STATUS = "ACTIVE";

export const CLIENT_LIMITS = Object.freeze({
  displayName: { min: 2, max: 120 },
  companyName: { max: 160 },
  primaryEmail: { max: 254 },
  phone: { max: 40 },
  notes: { max: 5000 },
});
