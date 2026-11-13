# Workstream 4: Admin Operations

SKU, staff role scope, inventory history, size editor, publication approval, staff editor

## Ownership / handoff files
- `backend/src/routes/admin.js`
- `backend/src/models/InventoryEvent.js`
- `backend/src/domain/inventory.mjs`
- `frontend/src/pages/Admin.jsx`
- `frontend/src/pages/Staff.jsx`
- `backend/tests/workstreams/agent4-inventory.unit.test.mjs`

## QA
Domain unit tests: executable without npm dependencies. Backend API integration and Playwright browser tests require installation and a disposable MongoDB replica set. See `docs/PHASES_7_12_TESTING.md`.

## Integration notes
Changes sharing `User`, `Product`, `Order`, checkout or UI contexts must be merged as a unit. Treat these filenames as ownership, not independent branches or proof of separate agents.
