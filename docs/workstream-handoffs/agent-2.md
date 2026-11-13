# Workstream 2: Premium Fashion Experience

Live-catalogue Shop the Look; deterministic Style Finder; editorial shop entry points

## Ownership / handoff files
- `frontend/src/lib/curation.mjs`
- `frontend/src/pages/Lookbook.jsx`
- `frontend/src/pages/StyleFinder.jsx`
- `frontend/src/pages/Shop.jsx`
- `frontend/src/tests/workstreams/agent2-curation.unit.test.mjs`

## QA
Domain unit tests: executable without npm dependencies. Backend API integration and Playwright browser tests require installation and a disposable MongoDB replica set. See `docs/PHASES_7_12_TESTING.md`.

## Integration notes
Changes sharing `User`, `Product`, `Order`, checkout or UI contexts must be merged as a unit. Treat these filenames as ownership, not independent branches or proof of separate agents.
