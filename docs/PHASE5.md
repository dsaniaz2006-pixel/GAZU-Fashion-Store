# GAZU Fashion Store — Phase 5: local Docker stack

## Scope and architecture

The default `docker compose up --build` builds and runs **four services**: `web` (production Vite build on unprivileged nginx), `api` (Express / Node 22), `mongo` (single-node `rs0` MongoDB 7) and `redis` (optional Redis 7 cache). A short-lived `mongo-init` helper bootstraps the replica set and waits for PRIMARY election. This helper is not an additional application microservice. The Phase 6 payment-service and gateway source files remain in the repository but are **not deployed by this Phase 5 Compose file**. The existing in-API educational mock payment implementation remains in place.

Browser -> `http://localhost:8080` -> `web:8080`. nginx forwards `/api/*` and `/uploads/*` to `api:8000`, preserving original paths. `api` connects to MongoDB as `mongo:27017` and Redis as `redis:6379`; none of these internal DNS names appear in browser JavaScript. SPA refreshes fall back to `index.html`. User uploads persist in named volume `uploads`; MongoDB files persist in named volume `mongo-data`.

## Audit of supplied ZIP

| Requirement | Existing file | Initial status | Gap / Phase 5 work | Risk |
|---|---|---|---|---|
| Backend image | `backend/Dockerfile` | Partial | multi-stage dependency copy, non-root runtime, clean context | moderate: dependency install |
| Frontend image | `frontend/Dockerfile` | Partial | unprivileged nginx runtime, production build and `/api` proxy | moderate: React deep links |
| Frontend nginx | `frontend/nginx.conf` | Partial | same-origin API/uploads forwarding, asset policy, healthz | moderate: broken images |
| Compose | `docker-compose.yml` | Partial | phase-scoped four services, private network, volumes, readiness and safe env | high: previously required Phase 6 services |
| Mongo replica set | Compose inline `mongo-init` | Partial | idempotent init script, wait for PRIMARY before API boot | high: transaction support |
| Redis | Compose `redis` | Partial | private service, optional for API startup, health probe | low: graceful fallback |
| Uploads | `backend/src/routes/uploads.js` | Completed in code; container unverified | persistent named volume and proxy URL | moderate: permissions |
| Mongo connection | `backend/src/config/db.js` | Completed in code; container unverified | compose uses replica-set URI | high: startup |
| App health | `backend/src/app.js` | Completed in code; container unverified | API probe checks DB; Redis is informational | moderate |
| Phase 6 gateway/payments | `gateway/`, `payment-service/` | Existing | leave files intact, exclude from Phase 5 stack | low |
| Tests | backend and frontend suites | Unverified | retain suites and document local/docker checks | high: runtime unavailable |

## Mac setup

1. Install and start **Docker Desktop for Mac**, including Docker Compose v2. Check `docker version` and `docker compose version`.
2. In the extracted `gazu-store` folder run `cp .env.example .env` (if you don't already have a local root `.env`). Generate a fresh `JWT_SECRET` with `openssl rand -hex 32`, paste it into root `.env` and supply other local-only settings as necessary. Never commit `.env`.
3. The default local Compose stack creates an **empty local MongoDB database**. It **does not read or migrate your Atlas data**. Your existing `backend/.env` Atlas URI remains available for `npm run dev` outside Docker.
4. Run `docker compose config --quiet` (with valid root `.env`). Then `docker compose build` and `docker compose up -d` (or `docker compose up --build`).
5. Inspect `docker compose ps` and `docker compose logs --tail=100 mongo-init api web redis`.
6. Open `http://localhost:8080`; API health at `http://localhost:8080/api/health` (expect HTTP 200, Mongo `up`; Redis may report `up`, `down`, or `disabled`).
7. Check replica-set status: `docker compose exec mongo mongosh --quiet --eval 'printjson(rs.status().myState)'` (expect `1` for PRIMARY). The `mongo-init` container should have exited successfully.
8. Load sample admin/product data **only in local Docker DB** if needed, using `docker compose exec api node src/seed.js`. This creates demo records; do not run the seed command against Atlas inadvertently.
9. Verify `/shop`, `/product/<real-id>`, `/admin/products` on direct page refresh; the latter requires admin login. Confirm image uploads via an admin account and their URLs under `/uploads/`.
10. For caching, send `curl -i 'http://localhost:8080/api/products'` twice; with Redis ready expect `X-Cache: MISS`, then `HIT` (depending on prior requests and TTL). Admin edits, review changes and committed checkout invalidate cached product data. A failed checkout must not commit a stock change.
11. Restart `api` using `docker compose restart api`; verify images still exist. Restart `mongo`; verify orders still exist. Stop `redis` with `docker compose stop redis` and verify `/api/products` still works with `X-Cache: BYPASS`, then `docker compose start redis` to restore caching.
12. Inspect `docker compose logs api` for Winston JSON HTTP logs, `X-Request-ID` in API responses, and no secrets.
13. Stop safely: `docker compose down` (retains volumes). **NEVER use `docker compose down -v` unless deliberately destroying all local orders, products and uploaded images.**

## Environment and security

- `GAZU_WEB_PORT` defaults to 8080. If changed, set `CLIENT_ORIGIN` to matching `http://localhost:<port>` in your **root** `.env`.
- `JWT_SECRET` is required. No credentials should be built into images. SMTP variables and optional `OTP_SECRET` are passed at runtime. Registration OTP/password reset and email order notifications require correctly configured SMTP, otherwise sending mail is unavailable.
- **Development-only warning:** Local single-node MongoDB intentionally has **no authentication** and is **not published to a host port**. This is suitable only for a trusted local Docker environment, not a production deployment. Set appropriate MongoDB authentication and TLS for production. Redis likewise has no public host port.
- This Compose stack uses `NODE_ENV=development` to retain the educational mock-payment demonstration, while web/API containers run compiled frontend and normal Node server (no dev watch). Do not publish the stack as a production deployment preset. No real payment provider is integrated.
- Uploaded files are stored on local Docker volumes, not ephemeral image layers. Back up volumes before upgrades and carefully restore using a verified, offline backup process.
- Backend starts only after primary election. Redis is optional; the API must continue browsing without it. Checkout continues using MongoDB transactions.

## Limitations, test status, next phase

This environment has no Docker executable, so **image builds, Compose startup, replica-set transactions, service probes, and end-to-end browser checks have NOT been executed**. Local static YAML/script checks do not prove runtime correctness. Run the listed Mac commands and backend/frontend suites before considering Phase 5 complete. Existing prior phase test dependencies must be installed on your Mac first. The Mongo init script refuses to reconfigure an incompatible preexisting replica-set; investigate without deleting persisted data.

Phase 6 (NOT implemented here): separate payment-service deployment, dedicated nginx gateway routing and GitHub Actions CI. Phase 7 deployment is also out of scope.

After starting containers, run `bash scripts/verify-phase5.sh` for safe automated HTTP/replica/cache smoke checks. The script does **not** modify database records or volumes; it does not replace the manual transactional checkout tests.
