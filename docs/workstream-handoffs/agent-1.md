# Workstream 1: Practical Shopping

Sizes/stock by variant; cart & checkout integrity; size guidance; Quick View; Recently Viewed

## Ownership / handoff files
- `backend/src/domain/variants.mjs`
- `backend/src/models/Product.js`
- `backend/src/models/User.js`
- `backend/src/services/cart.js`
- `backend/src/services/checkout.js`
- `backend/src/services/mockPayment.js`
- `backend/src/routes/cart.js`
- `frontend/src/pages/ProductDetail.jsx`
- `frontend/src/components/QuickView.jsx`
- ~~`frontend/src/components/RecentlyViewed.jsx`~~ — removed by user request (no browsing-history UI)
- `frontend/src/context/CartContext.jsx`
- `frontend/src/components/Cart.jsx`
- ~~`frontend/src/lib/recentlyViewed.js`~~ — removed by user request (no recently-viewed storage)
- `backend/tests/workstreams/agent1-variant.unit.test.mjs`

## QA
Domain unit tests: executable without npm dependencies. Backend API integration and Playwright browser tests require installation and a disposable MongoDB replica set. See `docs/PHASES_7_12_TESTING.md`.

## Integration notes
Changes sharing `User`, `Product`, `Order`, checkout or UI contexts must be merged as a unit. Treat these filenames as ownership, not independent branches or proof of separate agents.
