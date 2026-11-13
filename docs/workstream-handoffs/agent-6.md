# Workstream 6: Reliability & Testing

Privacy-limited analytics, operations status and journey dashboard, integration and Playwright test suites

## Ownership / handoff files
- `backend/src/domain/events.mjs`
- `backend/src/routes/events.js`
- `backend/src/models/StoreEvent.js`
- `frontend/src/pages/Operations.jsx`
- `backend/tests/phase7to12.integration.test.js`
- `e2e/tests/shopping.spec.js`
- `scripts/phase7-12-imports.test.mjs`
- `backend/tests/workstreams/agent6-events.unit.test.mjs`

## QA
Domain unit tests: executable without npm dependencies. Backend API integration and Playwright browser tests require installation and a disposable MongoDB replica set. See `docs/PHASES_7_12_TESTING.md`.

## Integration notes
Changes sharing `User`, `Product`, `Order`, checkout or UI contexts must be merged as a unit. Treat these filenames as ownership, not independent branches or proof of separate agents.
