# Root environment migration — actual verification results

Date: 2026-11-05. Work was performed against the supplied Phase 5 ZIP.

| Check | Command | Actual outcome |
|---|---|---|
| JS syntax | `node --check backend/src/config/env.js`; `node --check frontend/vite.config.js`; `node --check payment-service/src/server.js`; `node --check scripts/check-root-env.mjs` | PASS |
| Compose YAML structure | `python` PyYAML load of `docker-compose.yml` | PASS (not equivalent to `docker compose config`) |
| Backend unit/integration | `npm test --prefix backend` | BLOCKED: `ERR_MODULE_NOT_FOUND` for `mongoose`; 0/4 test files passed because dependencies are absent |
| Frontend tests | `npm test --prefix frontend` | BLOCKED: `vitest: not found` |
| Frontend build | `npm run build --prefix frontend` | BLOCKED: `vite: not found` |
| Docker Compose and container startup | `docker compose config`, `up`, and health checks | NOT RUN: Docker executable unavailable |
| Real root .env migration | n/a | NOT RUN: source ZIP contained no real `.env` files; no secrets or file deletion attempted |
| OAuth, SMTP, Atlas, Redis, checkout E2E | n/a | NOT VERIFIED: require running services and private development credentials |

Passing syntax/YAML checks does not imply successful startup, secure production deployment or passing integration tests. Run the migration guide on your Mac before removing legacy actual files.
| Root env key checker | `npm run env:check` | EXPECTED BLOCKER: no real root `.env` present in supplied ZIP; checker correctly reports missing file |
| Root env checker positive fixture | Run checker against a temporary, nonsecret placeholder `.env` with required keys | PASS: `Root .env key structure OK` (does not validate credentials) |


## Vite environment guard regression fix

`frontend/vite.config.js` loads configuration from the project root `.env`.
Vite may internally create `VITE_USER_NODE_ENV` when reading `NODE_ENV`; that key
is excluded from the app public-variable validation because it is not an app
setting. The approved app keys remain `VITE_API_URL` and
`VITE_GOOGLE_CLIENT_ID`; Vite's `envPrefix` restricts what can enter the bundle.

Run the dependency-free regression checks from the root folder:

```sh
node --test scripts/vite-env-policy.test.mjs
node --check frontend/vite.config.js
npm run env:check
```

For a full build/startup smoke test, install dependencies and run
`npm run build --prefix frontend` and `npm run dev` with your existing
root `.env`. No real `.env` is included with the shared ZIP.
