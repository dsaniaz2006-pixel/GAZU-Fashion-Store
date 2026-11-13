# Workstream 5: Marketing & Engagement

Coupon and gift-credit ledger, referral claim, collection launch, staff management panel

## Ownership / handoff files
- `backend/src/models/Promotion.js`
- `backend/src/models/GiftCredit.js`
- `backend/src/models/Launch.js`
- `backend/src/models/ReferralClaim.js`
- `backend/src/services/promotions.js`
- `backend/src/routes/marketing.js`
- `frontend/src/pages/Launches.jsx`
- `frontend/src/pages/MarketingPanel.jsx`
- `backend/tests/workstreams/agent5-promotions.unit.test.mjs`

## QA
Domain unit tests: executable without npm dependencies. Backend API integration and Playwright browser tests require installation and a disposable MongoDB replica set. See `docs/PHASES_7_12_TESTING.md`.

## Integration notes
Changes sharing `User`, `Product`, `Order`, checkout or UI contexts must be merged as a unit. Treat these filenames as ownership, not independent branches or proof of separate agents.
