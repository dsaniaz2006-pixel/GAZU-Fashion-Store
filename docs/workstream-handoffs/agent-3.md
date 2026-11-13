# Workstream 3: Customer Accounts & Loyalty

Database wishlist, address book, style preference, points on delivery, referral view

## Ownership / handoff files
- `backend/src/routes/profile.js`
- `backend/src/models/LoyaltyEntry.js`
- `backend/src/domain/loyalty.mjs`
- `frontend/src/pages/Profile.jsx`
- `frontend/src/context/StorefrontContext.jsx`
- `backend/tests/workstreams/agent3-loyalty.unit.test.mjs`

## QA
Domain unit tests: executable without npm dependencies. Backend API integration and Playwright browser tests require installation and a disposable MongoDB replica set. See `docs/PHASES_7_12_TESTING.md`.

## Integration notes
Changes sharing `User`, `Product`, `Order`, checkout or UI contexts must be merged as a unit. Treat these filenames as ownership, not independent branches or proof of separate agents.
