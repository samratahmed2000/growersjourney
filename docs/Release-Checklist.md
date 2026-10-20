# Production Release Checklist — Growers Journy

Use this checklist before any production release. A checked box means the check
was actually performed for the release candidate, not merely that the feature
exists. Record the commit SHA, date, environment, and operator.

**Release candidate:** `________________`  
**Date:** `________________`  
**Environment:** `________________`  
**Operator:** `________________`

## 1. Code and repository

- [ ] Working tree is clean; no uncommitted user work is being shipped.
- [ ] The release commit SHA is recorded and reviewed.
- [ ] No `.env`, secret, key, token, database export, or customer data is in the
      commit or build artifact.
- [ ] `.env.example` files list variable **names** only and contain no real
      values.
- [ ] The lockfiles are committed and `npm ci` is used for the build.

## 2. Automated checks (run for the release candidate)

### Backend (`server/`)

```bash
npm ci
npm test
npm audit --omit=dev --audit-level=high
```

- [ ] Tests pass with zero failures.
- [ ] Production dependency audit has no high/critical findings.
- [ ] Startup fails cleanly when required configuration is missing.
- [ ] No test output contains a real connection string, password, cookie, or
      token.

### Frontend (`client/`)

```bash
npm ci
npm run lint
npm run typecheck
npm run build
npm audit --omit=dev --audit-level=high
```

- [ ] Lint passes.
- [ ] Typecheck passes.
- [ ] Production build passes.
- [ ] The build uses the intended `API_BASE_URL`,
      `NEXT_PUBLIC_API_BASE_URL`, and `NEXT_PUBLIC_SITE_URL`.
- [ ] Production dependency audit has no high/critical findings.
- [ ] Any dev-only advisory is documented and its production impact assessed.

**Verified locally on 2026-10-20 for this release candidate:**

- [x] Backend: 155 tests, 155 pass, 0 fail.
- [x] Frontend: `npm run lint`, `npm run typecheck`, `npm run build` pass.
- [x] Frontend build completes with the existing environment fallbacks.
- [ ] A real Atlas integration run (not an in-memory test) was performed.

## 3. Configuration and secrets

- [ ] `NODE_ENV=production` is set explicitly in the backend.
- [ ] `MONGODB_URI` points at the production database and includes its name.
- [ ] The Atlas user is least-privilege (`readWrite` on this database only).
- [ ] `BETTER_AUTH_SECRET` is ≥32 characters, unique, and stored in a secret
      manager.
- [ ] `BETTER_AUTH_URL` is the public HTTPS site origin.
- [ ] `FRONTEND_URL` contains only the exact production site origin(s).
- [ ] `TRUST_PROXY` matches the real proxy hop count; it is not `true`.
- [ ] `PAYMENT_WEBHOOK_SECRET` is ≥32 characters if payments are enabled.
- [ ] `PAYMENT_PUBLIC_BASE_URL` is the public HTTPS API origin.
- [ ] `PAYMENTS_ENABLED=false` unless a real provider has been approved.
- [ ] `PAYMENT_PROVIDER=FAKE` is **not** used in production.
- [ ] Frontend secrets are not behind `NEXT_PUBLIC_*`; the only public values
      are the API base URL and site URL.
- [ ] No secret appears in build logs, client bundles, or error responses.

## 4. Database and indexes

- [ ] Automated backups are enabled and the retention period is recorded.
- [ ] A restore into a non-production database has been tested (or the gap is
      explicitly accepted with an owner decision).
- [ ] `npm run db:indexes` has been run against the production database.
- [ ] The unique `(provider, eventId)` index on `payment_events` exists.
- [ ] The unique `idempotencyKey` index on `payments` exists.
- [ ] The partial unique `invoiceId` index for active (`INITIATED`/`PENDING`)
      payments exists.
- [ ] No production seed data, fake invoices, fake payments, or demo clients
      were inserted.

## 5. Authentication and authorization smoke tests

Use a test admin and a test client account. Do not use real customer data.

- [ ] Anonymous `/admin` and `/portal` visits never render protected content.
- [ ] A `CLIENT` cannot call `/api/v1/admin/*`.
- [ ] A `TEAM_MEMBER` cannot call `/api/v1/admin/*` or `/portal`.
- [ ] An unlinked or inactive `CLIENT` receives `403 PORTAL_ACCESS_DENIED`.
- [ ] A client cannot read another client's project, invoice, or payment
      (`404`, not another client's data).
- [ ] Admin writes with a forged/foreign `Origin` are rejected.
- [ ] Logout revokes the session; the old cookie cannot read protected pages.
- [ ] Missing/unknown roles fail closed.
- [ ] Session cookies are `HttpOnly`, `SameSite=Lax`, `Secure` on HTTPS, and
      host-only.
- [ ] The login form never stores a token in `localStorage` or
      `sessionStorage`.
- [ ] The `?next=` redirect stays inside the user's own area.

## 6. Public site smoke tests

- [ ] `/`, `/services`, `/work`, `/work/[slug]`, `/about`, `/process`, `/contact`,
      `/privacy-policy`, and `/terms` return the expected pages.
- [ ] An unknown `/work/*` slug returns a real 404.
- [ ] `/dev/health` is unavailable in production (404).
- [ ] `robots.txt` and `sitemap.xml` use the production site URL.
- [ ] Draft legal pages are `noindex` until approved.
- [ ] The portfolio is clearly labelled as concepts/sample concepts; no fake
      client names, testimonials, logos, or metrics appear.
- [ ] The contact form submits, shows a success state only after `201`, and
      shows a useful error on validation/rate-limit failure.
- [ ] The contact form does not reveal the inquiry id or internal details.

## 7. Finance smoke tests

Use the sandbox/mock only, or a provider-approved test mode. Never use a real
card or real money in routine checks.

- [ ] Create an invoice as admin; totals are server-calculated.
- [ ] Issue the invoice; the invoice number is allocated server-side.
- [ ] A draft invoice is not visible to the client.
- [ ] The client sees only their own invoice.
- [ ] Start a payment session; a second submit reuses the active attempt.
- [ ] A different amount while a session is active returns
      `409 PAYMENT_ALREADY_PENDING`.
- [ ] A duplicate webhook event is acknowledged but credits only once.
- [ ] A forged webhook signature is rejected.
- [ ] A successful verified event marks the invoice paid/partially paid.
- [ ] A refund is provider-first and cannot exceed the refundable amount.
- [ ] Overpayment, if it occurs, is recorded and visible for reconciliation.
- [ ] No card data is collected or stored.
- [ ] `PAYMENTS_ENABLED=false` returns `503 PAYMENTS_DISABLED` from payment
      creation/webhook/refund/reconcile paths.

## 8. Responsive and accessibility checks

These are currently manual; no browser automation is installed.

- [ ] Keyboard-only navigation works for the header, mobile menu, forms,
      dialogs, and admin tables.
- [ ] Focus is visible and no focus trap is missing on modal dialogs.
- [ ] Form fields have labels, errors are announced, and required fields are
      indicated.
- [ ] Colour contrast meets the documented targets (accent-600 for interactive
      text; accent-500 not used for normal text on white).
- [ ] Pages are usable at 320 px, 768 px, 1024 px, and 1440 px widths.
- [ ] No horizontal scrolling on primary flows.
- [ ] Loading, empty, forbidden, error, and 404 states are usable.
- [ ] Images have appropriate alternative text or are decorative.
- [ ] Reduced-motion preferences are respected where animation exists.

## 9. Deployment and observability

- [ ] API liveness `/api/v1/health` returns `200`.
- [ ] API readiness `/api/v1/health/ready` returns `200` with Atlas connected.
- [ ] The Next.js site is reachable over HTTPS; HTTP redirects to HTTPS.
- [ ] HSTS, nosniff, frame denial, referrer policy, and permissions policy are
      present.
- [ ] Logs are retained and searchable by request id.
- [ ] No request bodies, cookies, query strings, or secrets appear in logs.
- [ ] Alerts exist for repeated `5xx`, readiness failures, webhook signature
      failures, and payment reconciliation errors.
- [ ] The hosting platform restarts on liveness failure, not on a transient
      readiness failure.
- [ ] Backups are enabled and the restore procedure is documented.
- [ ] The previous frontend build and backend artifact are retained for
      rollback.
- [ ] The rollback plan in `docs/Deployment.md` has been reviewed.

## 10. Known blockers (must be explicitly accepted by the owner)

- [ ] Legal pages have been reviewed and approved, or the release is explicitly
      accepted with draft/noindex legal pages.
- [ ] The absence of a real payment provider is accepted (payments disabled in
      production).
- [ ] The absence of an expiry/cancel flow for abandoned active payment sessions
      is accepted, or a documented manual resolution process exists.
- [ ] The absence of email delivery, notifications, and client invitations is
      accepted.
- [ ] The absence of automated browser/accessibility tests is accepted.
- [ ] The in-memory rate limiter's single-instance limitation is accepted or a
      shared store/edge limit is configured.
- [ ] The residual Better Auth token-in-JSON risk is accepted, or a nonce-based
      CSP is implemented.
- [ ] Public dynamic services/portfolio are out of scope for this release.

## 11. Sign-off

- [ ] Engineering review complete.
- [ ] Owner review complete.
- [ ] Deployment approved.
- [ ] Post-deploy smoke tests complete.
- [ ] Rollback target recorded.
- [ ] Release notes written without claiming unverified features.

**Notes / exceptions:**

```text

```
