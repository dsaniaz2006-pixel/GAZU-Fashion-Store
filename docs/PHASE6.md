# Phase 6 — Payment microservice, nginx gateway, GitHub Actions

## Scope and architecture

Only Phase 6 was changed. Browser → **gateway** (`localhost:8080`) → static **web** or authenticated **Express API**; Express → private **payment-service**; Express → isolated MongoDB replica set + optional Redis. The frontend never calls the payment service directly. Cash on Delivery never calls the payment service. No live card, UPI, or money handling exists.

Existing Google sign-in, OTP, JWT auth, reviews, product CRUD, upload, checkout, notification, cache, logging, and container source was retained. External Google/SMTP and the complete application are **not verified in this environment**.

## Payment state and recovery design

- PaymentAttempt is MongoDB-backed, unique on `{user, requestId}`. Stores amount in paise, intent hash, cart hash, payment transaction ID, and `pending / processing / approved / declined / complete` state.
- Express reads the cart and quotes on the server; it does not accept amounts from React. The payment service only receives the simulated outcome, amount, and idempotency UUID over a protected private endpoint.
- `X-Service-Key` compares to `PAYMENT_SERVICE_SECRET` with constant-time comparison, and service decisions are persisted in a private JSON journal on a Docker volume. A stable payment transaction ID is returned when an identical request is retried. A conflicting request returns 409. This is an educational single-instance journal, not a production distributed payment ledger.
- Express claims a time-bounded processing lease to reject concurrent duplicate in-flight requests. It calls the external service **before** the MongoDB order transaction. Checkout then rechecks cart snapshot, server price, and stock inside its own transaction; all order and stock changes commit or roll back together.
- A payment simulator approval with failed order commit remains `approved` for retry, with no order marked paid. The customer must retry **the same checkout request UUID**; price/stock/cart changes can leave the attempt requiring manual intervention. Unlike a real payment, simulated approval does not settle money.
- An ambiguous HTTP timeout keeps an attempt retryable. The payment service returns the same persisted decision on a retry. A lost order response returns the existing order (200) by UUID. No real charges or refunds occur.
- Expired processing leases are reclaimable after 20 seconds. This is a single-service deployment strategy: do not scale Express/payment instances horizontally without replacing the file journal and lease protocol with a shared transactional service.
- COD orders remain independent of payment-service health; existing `GAZU-YYYY-NNNNNN` IDs and notification deduplication stay in place.

## Public gateway routing

| Path | Destination | Notes |
|---|---|---|
| `/`, `/shop`, `/product/*`, `/account/*`, `/admin/*` | web (React/nginx) | Browser route refresh preserved via SPA fallback |
| `/api/*` | Express API | Auth, cart, orders, mock payment orchestration, reviews, health |
| `/uploads/*` | Express static uploads | Named volume persists images |
| `/internal/*` | 404 at gateway | Payment simulator privileged operations remain private |
| `/healthz` | gateway | Local gateway liveness check |

Only gateway publishes host port 8080. Mongo, Redis, web, API, payment service remain on the private Compose bridge. Frontend nginx serves static React; it is not another public API gateway. The API creates an independent `X-Request-ID` and forwards that ID on internal payment calls.

## Single root environment

`gazu-store/.env` is the only active env file. Never commit it. Copy `.env.example` and provide random `JWT_SECRET` and `PAYMENT_SERVICE_SECRET` (at least 32 characters), plus Atlas/SMTP/Google credentials if needed. Vite receives only `VITE_API_URL` and `VITE_GOOGLE_CLIENT_ID` public values. Node server code and Compose read root configuration. Docker **overrides** `MONGODB_URI` with `mongodb://mongo:27017/gazu_store?replicaSet=rs0`; Atlas is not migrated or overwritten.

Relevant new values: `PAYMENT_SERVICE_URL=http://127.0.0.1:4001` (local), `PAYMENT_SERVICE_SECRET`, `PAYMENT_SERVICE_PORT=4001`, `PAYMENT_TIMEOUT_MS=5000`, and `PAYMENT_JOURNAL_PATH=./data/decisions.json` (local); Docker injects its own internal URL and `/app/data/decisions.json`. `GAZU_WEB_PORT=8080` remains the local Docker origin. For Google OAuth, configure the corresponding browser origin in Google Cloud Console.

## macOS local development

1. Install Node 22+, Docker Desktop (for Docker mode only), and a suitable replica-set-capable MongoDB/Atlas connection.
2. Backup any local `.env` files, then use one root `.env` with correct development credentials. **Do not commit or attach real credentials.**
3. `npm ci && npm run setup` (or `npm ci --prefix backend`, `frontend`, `payment-service`).
4. `npm run env:check`, then `npm run dev` starts Express (8000), Vite (5173) and payment service (4001). The configured Atlas database is used in local npm mode.
5. Open `http://localhost:5173`. Test COD and mock checkout separately. For an unavailable payment service, COD should still work, while mock checkout should return 503 with no order created.

## Docker mode

1. Configure root `.env` (secret placeholders must be replaced).
2. `docker compose config --quiet`
3. `docker compose up -d --build`
4. `docker compose ps -a`
5. `bash scripts/verify-phase6.sh`
6. Open `http://localhost:8080` and manually verify login, Google login, OTP, cart, COD, mock payment, reviews, uploads, order status and notifications using safe test accounts.
7. `docker compose logs --tail=50 gateway api payment-service` to inspect nonsecret operational logs.
8. Stop with `docker compose down` (without `-v`). **Do not use `down -v`: it deletes local Mongo, uploaded images and payment journal volumes.**

## Automated testing and CI

`.github/workflows/ci.yml` has two independent jobs: unit/integration tests with isolated disposable `mongodb-memory-server` replica sets and mocked SMTP; and a separate isolated Docker Compose boot/build/smoke test. The CI workflow never accesses live Atlas, never uses real Gmail or Google secrets, never deploys, and uses read-only repository permissions. A failed test fails the job. On GitHub, enable Actions and ensure Docker builds are permitted on the runner; no live secrets are needed for CI.

## Limitations

- No automatic compensation/refund flow for a *real* payment; none is processed here. If an approved simulated attempt cannot be committed due to stock/cart changes, it remains `approved` and needs the original request reattempt or manual investigation.
- File-backed simulator decisions are suitable for one local service instance only, backed by a Docker volume. Multiple replicas require a shared transactional payment journal.
- `npm run dev` does not start MongoDB or Redis; configure Atlas and optional Redis separately as before.
- CI smoke tests validate health and gateway security boundaries, not live Google OAuth or real outbound email.
- See `docs/PHASE6_CHECKLIST.md` and `docs/TESTING.md` for verification status.

## Phase 7 boundary

No cloud deployment, production image publishing, real payment provider, or production webhook was implemented. Phase 7 may add deployment after verification and approval.
