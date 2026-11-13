# GAZU phases 7–12: test plan

The development process is test-first for dependency-free domain rules (variants, curation, loyalty, inventory, promotions, analytics). The term TDD describes red/green/refactor and is not a fourth independent test suite.

## Unit tests (no npm dependencies)
`npm run test:phases:unit`

Run cross-workstream checks: `node --test scripts/phase7-12-cross-domain.test.mjs scripts/phase7-12-imports.test.mjs`

## Backend integration tests (isolated disposable MongoDB replica set)
`npm ci --prefix backend` then `npm test --prefix backend`.
Requires Node 22+, installed node_modules and a network/cache-accessible MongoDB test binary for mongodb-memory-server.

## Frontend integration/unit tests
`npm ci --prefix frontend` then `npm test --prefix frontend` and `npm run build --prefix frontend`.

## Browser end-to-end tests (real running website)
Start GAZU with a dedicated test database. In a second terminal: `cd e2e && npm install && npx playwright install chromium && npm test`.
Auth/order checkout E2E requires seeded isolated test fixtures; the provided browser smoke tests cover public navigation only. Do not point destructive tests at live Atlas or Docker customer data.

## HTTP smoke tests
With GAZU running, `node --test scripts/phase7-12-http-smoke.mjs`.

## Security / launch gates
- Assign genuine size inventory before advertising a product as size-selectable.
- Gift credits are administratively issued; no gift-card sales or refunds are implemented.
- Promotions must be reviewed for disclosure and financial policy before public launch.
- Referral reward abuse controls and redemption (spending loyalty points) are still launch-gated.
- Run backup/restore verification on an isolated database before launch.
- Do not use `docker compose down -v` or destructive seeding.
