> Current authentication upgrade (5 November 2026): [architecture, setup and actual verification](AUTH_UPGRADE.md), [changes](AUTH_UPGRADE_CHANGES.md), [checklist](AUTH_UPGRADE_CHECKLIST.md). Earlier phase records follow.

> Latest update: [Phase 1 frontend architecture, 4 November 2026](PHASE1.md). See its actual test results and [file-by-file changes](PHASE1_CHANGES.md). The existing content below records earlier work.

# Email OTP update

- Added transactional registration email verification, hashed codes, expiry, attempt lock, atomic cooldown and per-account hourly send limit.
- Blocked unverified customer login and existing JWT access while preserving admin access.
- Added refresh/recovery/resend UI and safe SMTP failure recovery.
- Updated Nodemailer to 10.3.1 after dependency audit; installation reports zero vulnerabilities.
- Added backend and frontend OTP regression tests, Compose email variables, optional dry-run legacy migration, and setup guide.
- Did not send real emails, seed, migrate, or access live data.

# Changes from supplied ZIP

- Replaced page-state navigation and monolithic main.jsx with routed App, extracted visual components, account/cart contexts, cart reducer and custom hooks.
- Retained original catalogue seeds and storefront design; added server queries, product URLs/reviews, admin statistics, upload/progress and order detail URLs.
- Added Mongoose features and review transactions; preserved stock/price ownership, idempotency and rollback behavior.
- Added logging, optional Redis, separate payment service, gateway, container configuration, CI and deployment guide.
- Replaced README containing merge-conflict leftovers; updated API/testing documentation and added blueprint mapping/demo.
- Fixed upload editor accepting only old photo IDs, extracted-component imports, and health readiness test expectations during verification.
- Excluded bundled node_modules, original private .env, Git history, Mac resource forks and generated data from the release ZIP.
- No external publishing, production data changes or live deployment performed.


## Phase 2 database and API hardening (2026-11-04)

- Audited existing reviews, schema virtuals/statics/hooks, indexes, pagination, admin stats and error handling; retained working routes and checkout.
- Added defensive filter validation within `Product.search`, separate from HTTP Zod validation.
- Tightened Review model rating/comment validation.
- Corrected admin collected-revenue accounting; added `mockPaymentsPerDay` to report simulated payments separately.
- Extended backend API integration tests to cover new validation, model search guards and mock revenue separation.
- Added `docs/PHASE2.md`; updated `docs/API.md`.
- Full npm-based test execution unavailable in the editing environment; see Phase 2 verification notes.
