# GAZU — single root `.env` migration (Phase 5 configuration consolidation)

## Scope and audit

This change does not alter application features or migrate database records.

| Consumer | Before | After | Secrets scope |
|---|---|---|---|
| Backend API / seed / admin scripts | `dotenv/config` in backend working directory | `backend/src/config/env.js` reads `<project>/.env` using an absolute path; injected OS/Compose vars take priority | Server only |
| Email helper and email test | `dotenv/config` from backend directory | Both import the same backend root loader | Server only |
| Vite dev / build | frontend working directory, default `.env` discovery | `envDir` points to repository root; `VITE_` allowlist enforced | Only `VITE_API_URL` and `VITE_GOOGLE_CLIENT_ID` |
| Docker Compose | root `.env` interpolation | root `.env`, explicit per-service `environment` and public build args | Backend receives only selected secrets; frontend receives only public args |
| Payment-service (optional) | inherited shell vars only | startup reads root `.env` using Node's built-in loader, without overriding environment variables | Payment service only |
| Local database | `MONGODB_URI` from backend `.env` | root `MONGODB_URI` with `GAZU_DB_MODE=atlas` | Atlas is never copied into Docker's `MONGODB_URI` |
| Docker database | hard-coded Compose `mongo` service URI | same hard-coded Docker-local URI plus `GAZU_DB_MODE=docker-local` guard | Isolated persistent Docker volume |

**Google Identity Services:** Implemented in this update. Root `VITE_GOOGLE_CLIENT_ID` supplies React and is mapped to backend `GOOGLE_CLIENT_ID`. No Google Client Secret is used. See [AUTH_UPGRADE.md](AUTH_UPGRADE.md).

## Safe migration — do this on your Mac BEFORE deleting anything

1. Back up `backend/.env`, `frontend/.env`, `payment-service/.env`, and any existing root `.env` *outside the project*, in a secure location. The provided ZIP intentionally contains no real `.env` files.
2. From the project root, run `cp .env.example .env` only if you do not already have a root `.env`. If one exists, edit that file rather than overwriting it.
3. Merge keys from the legacy files into the root `.env`, carefully preserving each credential; resolve conflicting values explicitly. Do **not** paste secrets into chat or commit them. All private keys (JWT, SMTP, Atlas URI, payment secret) must stay **without** the `VITE_` prefix.
4. Set `GAZU_DB_MODE=atlas` and your existing Atlas `MONGODB_URI` for local `npm run dev`. For local standalone MongoDB, the backend will still reject transactions; use Atlas or a replica set.
5. Set `VITE_API_URL=/api` and, only if needed, `VITE_GOOGLE_CLIENT_ID=<public-client-id>`. Never add `VITE_GOOGLE_CLIENT_SECRET`, `VITE_JWT_SECRET`, etc.; the Vite config rejects unexpected `VITE_` variable names.
6. Run `npm run env:check` (structure-only, prints no secret values); then `npm run setup`, `npm test`, `npm run build`, and `npm run dev`. Verify registration, OTP, Google authentication, admin login, catalog, order, images, Redis fallback and emails using development test data.
7. Verify Docker with `docker compose config --quiet`, `docker compose up -d --build`, `docker compose ps` and `bash scripts/verify-phase5.sh`. Check `docker compose logs --tail=100` for readiness and failure messages. Docker always uses its separate `mongo-data` volume; it does not connect to Atlas.
8. Inspect the rendered Compose configuration privately (`docker compose config`) and verify only the intended fields are injected. **Its output may include passwords and other secrets; never share it publicly.**
9. Confirm with a local probe that the frontend bundle does not contain unique marker values from the JWT, SMTP, MongoDB URI or Google Client Secret. Search locally; do not post those values or the build artifacts publicly. Only after full tests and manual verification, retire redundant **actual** service `.env` files. The legacy `.env.example` references have intentionally not been deleted as historical references.

## How loading works

- Root `npm run dev` runs backend and frontend as before; backend `dotenv.config({ path: absoluteRootPath, override: false })`; frontend Vite's `envDir` loads root env in its own process. Vite config reads the private `FRONTEND_PORT` and `API_PROXY_TARGET` only to configure its dev server; they are not injected into the browser bundle.
- Backend's `checkEnvironment()` validates secrets and rejects a Docker-local mode pointing to the wrong MongoDB host. `NODE_ENV` does not select a DB automatically.
- Docker Compose reads the same root `.env` for interpolation but deliberately **overrides** `MONGODB_URI` with `mongodb://mongo:27017/gazu_store?replicaSet=rs0`, `GAZU_DB_MODE=docker-local`, and the browser origin with the mapped web port. Thus Atlas values in root `.env` cannot alter Docker data, and Docker values cannot rewrite Atlas data.
- Redis inside Docker uses `redis://redis:6379`; local npm mode uses the optional root `REDIS_URL` or falls back without caching.
- The frontend nginx server proxies browser `/api` and `/uploads` requests to the Docker API. Only `VITE_API_URL` and `VITE_GOOGLE_CLIENT_ID` are forwarded to the image build.
- Payment service is not launched by default in Phase 5 Compose. Starting it separately via `npm start --prefix payment-service` uses the root file, and `PAYMENT_SERVICE_PORT` avoids collision with API `PORT`.

## Security and limitations

- `.gitignore`, root `.dockerignore`, backend `.dockerignore`, and frontend `.dockerignore` explicitly exclude `.env` and nested service credentials.
- No real secrets were present in the uploaded Phase 5 ZIP, so credential migration cannot be completed automatically. No real `.env` files were removed.
- The unused Google Client Secret Compose mapping was removed. Only the public Client ID is required.
- This is local-development Compose, not a production secret-management system. Do not publish `docker compose config` outputs or commit `.env`.
- See the current authentication guide for actual local/Docker test results. Live Google account and inbox checks still require your local configuration.
- If Docker root volume data matters, do not run `docker compose down -v`.
