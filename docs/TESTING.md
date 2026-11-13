> Current authentication upgrade (5 November 2026): [architecture, setup and actual verification](AUTH_UPGRADE.md), [changes](AUTH_UPGRADE_CHANGES.md), [checklist](AUTH_UPGRADE_CHECKLIST.md). Earlier phase records follow.

> Latest update: [Phase 1 frontend architecture, 4 November 2026](PHASE1.md). See its actual test results and [file-by-file changes](PHASE1_CHANGES.md). The existing content below records earlier work.

# Email OTP verification results

Current update: 35 backend tests, 10 frontend tests, and 1 payment-service test passed (46 total, zero failures/skips). Frontend production build passed. Backend dependency installation after the Nodemailer patch reported zero vulnerabilities.

OTP checks include expiry, hash storage, five-attempt lock under concurrent requests, one-time consumption, concurrent resends, hourly send limits, delivery failure recovery, duplicate registration, unverified JWT denial, and legacy admin access. Frontend checks include registration/verification, refresh recovery, unverified login, and delivery failures.

All email delivery in automated tests is mocked. No live Gmail delivery, real account registration, live migration, or seed operation was performed. Follow EMAIL_OTP.md for the final real-inbox check with your existing private settings.

The record below is from the earlier base-project update, retained as historical evidence. Its screenshots do not show the new OTP screen.

---

# Verification record

Verified locally on 2 November 2026. No results below refer to a cloud deployment.

| Check | Actual result |
| --- | --- |
| Backend `npm test` | 25 passed, 0 failed, 0 skipped |
| Frontend `npm test` | 6 passed, 0 failed |
| Payment-service `npm test` | 1 passed, 0 failed |
| Root `npm test` | All 32 tests passed |
| Frontend production build | Passed |
| Chrome browser flow | Passed; zero page JavaScript errors |
| Mobile viewport | Checked at 390 × 844, no horizontal overflow |
| Dependency install audit | npm reported 0 vulnerabilities for installed dependency trees |
| Docker Compose execution | Not run: Docker unavailable on this machine |
| Live Redis MISS/HIT/outage | Not run: no Redis runtime configured |
| Hosted GitHub Actions | Workflow provided; no remote run performed |
| Live cloud flow | Not deployed; no hosting target/secrets supplied |

## Automated coverage

Temporary MongoDB replica set, never the application database:

- Password hashing, registration role injection, login and authorization.
- Admin product CRUD, availability and soft deletion.
- Cart isolation, invalid/oversized quantities and mutation behavior.
- Server-side prices, idempotent retry, stock decrement and cart clearing.
- Rollback after an unavailable item, competing customers for the last unit, simultaneous duplicate checkout.
- Mock decline without data mutation, mock success, production-mode disable.
- Order ownership and allowed fulfilment transitions.
- Duplicate reviews (409), owner/admin deletion, populated names, average/count recalculation and zero reset.
- Text search, category, sorting, pagination metadata and invalid query bounds.
- Upload authorization, invalid bytes, oversize rejection, generated image path and serving.
- Admin aggregation and collected-revenue semantics.
- API HTTP delegation to the separate payment service, decline, success, and failure when the service is stopped.
- Validation errors and health readiness/request IDs.

Frontend: cart reducer, anonymous redirect, customer admin denial, debounced search and server pagination, direct product URL/reviews, extracted home layout. Service: shared-key decision authorization, successful/failed decisions and invalid outcome.

## Browser verification

Against isolated demo API and Vite, using installed Chrome:

1. Opened original home layout.
2. Signed in as test admin; refreshed /admin/products.
3. Uploaded a PNG, observed 100% progress, created a product using the returned URL.
4. Searched shop, opened product URL and refreshed it.
5. Posted review and verified it appeared.
6. Added to cart, filled controlled shipping fields, placed COD order.
7. Advanced order from placed to preparing and viewed statistics.
8. Checked mobile shop at 390 × 844 and captured screenshots.

Screenshots contain temporary demo data. The white test image is a deliberately tiny PNG uploaded by the smoke test.

## Remaining acceptance checks

On a machine with Docker: follow README Compose setup and seed. Verify all health checks, refresh nested URLs through nginx, verify X-Payment-Service on mock checkout, and inspect a shared request ID across the API and payment adapter. Verify Redis MISS→HIT, invalidation after product/review/stock changes, and continued catalogue availability with Redis stopped. The implementation falls back to MongoDB when Redis is absent; runtime cache behavior still needs this check.

Push to your own repository, obtain a real passing CI run, configure deployment, then run the demo against the live URL. Record those results here before describing ETE as fully complete.

## Reproduce

`npm ci && npm run setup`, then `npm test && npm run build` from the root. Backend integration tests require local server permissions and network access for the first MongoDB binary download. Tests keep their data in a temporary replica set. Uploaded test fixtures are written under backend/data/uploads and may be removed after tests. Test scripts run only `*.test.js`, so the optional local demo server is not started by npm test.


## Phase 2 verification (2026-11-04)

Added automated regression cases for virtual serialization, search static argument safety, review rating/comment validation, and simulated-vs-collected admin totals. Source syntax checked. Full suites and frontend build **not run successfully in this workspace** because npm dependencies could not be fully installed. Run the commands and record actual outputs as described in `docs/PHASE2.md`; no pass counts are claimed.


## Phase 3 execution (Nov 4, 2026)
See `PHASE3.md`. Offline npm installs failed due to missing cache archives. Frontend test/build failed because vitest/vite were unavailable. Backend test runner found 3 test files but they failed loading due to missing mongoose. Added Phase 3 tests have **not** been executed; no CE-2 acceptance claim is made.

## Phase 4 verification (2026-11-04)
- `node --check` for edited JavaScript: passed.
- `npm ci --prefix backend --offline --ignore-scripts --no-audit --no-fund`: **failed** with `ENOTCACHED` for `zod-4.6.7.tgz` (missing package in local npm cache). No dependency installation or test pass is claimed.
- `npm test --prefix backend`: **ran, blocked** by `ERR_MODULE_NOT_FOUND: mongoose` (4 test files failed to load; zero tests passed).
- `npm test --prefix frontend`: **ran, failed to start** (`vitest: not found`).
- `npm test --prefix payment-service`: **ran, failed to load** (`ERR_MODULE_NOT_FOUND: supertest`).
- `npm run build --prefix frontend`: **ran, failed to start** (`vite: not found`).
- Real Redis and MongoDB integration: **not executed**; follow `PHASE4.md` on a configured Mac.
- The `phase4.test.js` cases use a mocked Redis client and perform no database changes or outbound emails.


## Phase 5 verification (2026-11-04)
Docker executable unavailable in the authoring environment. Docker build/start/health/end-to-end status: **not run**. Static Compose YAML and shell/Node syntax checks were performed; see PHASE5.md for macOS runtime checks. Backend/frontend/payment-service suites require installed dependencies and must be run in the target Mac environment; no Phase 5 runtime pass is claimed.

## Phase 6 verification — 2026-11-05

- `node --check` on modified backend and payment source: **PASS**.
- `bash -n scripts/verify-phase6.sh`: **PASS**.
- Python YAML parse of Compose and CI files: **PASS** (structural check only; not Docker validation).
- `node --test scripts/vite-env-policy.test.mjs`: **3/3 PASS**.
- `npm ci --prefix payment-service --offline --no-audit --no-fund`: **BLOCKED**, missing cached `wrappy-1.0.2.tgz`.
- `npm ci --prefix backend --offline --no-audit --no-fund`: **BLOCKED**, missing cached `zod-4.6.7.tgz`.
- Full test suites, frontend production build, Docker Compose runtime, live OTP/Google, and SMTP: **NOT VERIFIED** here; Docker CLI is unavailable and npm dependencies were not installed.
- CI workflow authored but **not run on GitHub**. No claim of complete Phase 6 acceptance is made.

## Three-demo-only cleanup (2026-11-06)

`node --test backend/tests/threeProductCatalogue.test.js`: 7 passed, 0 failed. No database writes were performed. Full backend test command reported 10 passes with 5 test files unable to load due to missing dependencies (`mongoose` etc.); frontend Vitest, payment-service Supertest, and Vite build likewise could not run without packages. Docker is unavailable in this environment. See [THREE_PRODUCT_CLEANUP.md](THREE_PRODUCT_CLEANUP.md) for the preview-first, explicit-apply database cleanup instructions.
