# GAZU Fashion Store — Phase 2 Backend and MongoDB

## Scope and audit

Phase 2 is the **advanced MongoDB and backend API** milestone. The provided Phase 1 ZIP already implements nearly all planned features. This patch preserves the existing Express routes, JWT/OTP, checkout transactions, order counters, customer frontend, email and deployment files. It does not run migrations or connect to MongoDB Atlas.

| Requirement | Current file | Initial status | Action in Phase 2 | Risk |
|---|---|---|---|---|
| User, product, order, OTP, notification, counter schemas | `backend/src/models/*.js` | Present | Preserved | High if changed |
| Reviews, one-per-user compound index | `models/Review.js` | Present | Tighten model-level rating/comment validation | Medium |
| Review creation/deletion and rating update | `routes/products.js`, `routes/reviews.js`, `models/Review.js` | Present | Preserve transactional document hooks | High |
| Product rupee virtual, order itemCount virtual | `models/Product.js`, `models/Order.js` | Present | Verified source and added regression assertions | Low |
| Search and rating static methods | `models/Product.js`, `models/Review.js` | Present | Guard direct Product.search calls against invalid filters | Medium |
| Product name normalization | `models/Product.js`, `routes/admin.js` | Present | Preserve save hook and document-based admin update | Low |
| Safe populate | `routes/products.js`, `routes/admin.js` | Present | Retain limited user projections | Medium |
| Text/category-price/review/email/idempotency indexes | `models/*.js` | Present | Preserve; check actual Atlas indexes manually | High |
| Query search, sorting, paging | `routes/products.js` | Present | Preserve response shape and tighten static | Medium |
| Revenue, top products, status, low stock | `services/stats.js` | Partially correct | Separate mock payment totals from collected revenue | Medium |
| Centralized error handling | `middleware/errors.js`, `utils/errors.js` | Present | Preserve JSON contract | Medium |
| Existing auth, checkout, OTP, email, counter | `routes/`, `services/` | Present | No functional rewrites | High |
| Automated regressions | `backend/tests/api.test.js` | Present | Add validation, static guard, mock payment statistics tests | Medium |

## Models and relationships

- **User**: unique email, role, embedded cart of product ID and quantity. Password hash excluded by default. OTPs and notifications use their existing dedicated collections.
- **Product**: pricePaise as integer; quantity, active soft-delete, rating/reviewCount; `priceRupees` is a JSON virtual. Text index on name+description; compound category+price index; pre-save name normalization.
- **Order**: references user; line items embed purchase-time details; unique `(user, requestId)` for idempotency; unique `orderNumber` preserves `GAZU-YYYY-NNNNNN`; `itemCount` sums quantities.
- **Review**: references user and product; unique `(user, product)`; integer rating 1–5 and trimmed 3–1000 character comment; post-save and document post-delete hooks recalculate product aggregates, within the same transaction when invoked through current APIs.

## Endpoints

| Method | Route | Authorization | Notes |
|---|---|---|---|
| GET | `/api/products` | Public | `q`, `category`, `sort`, `page`, `limit`; `{items,total,page,limit,pages}`; invalid values →400 |
| GET | `/api/products/:id` | Public | Active product with `priceRupees`, rating, count; missing →404 |
| GET | `/api/products/:id/reviews` | Public | Paginated reviews; author name only; missing product →404 |
| POST | `/api/products/:id/reviews` | Signed in | `{rating,comment}`; 201; duplicate →409; no verified-purchase restriction |
| DELETE | `/api/reviews/:id` | Owner or admin | 204; other user →403; missing →404 |
| GET | `/api/admin/stats` | Admin | Collected revenue, simulated mock payment totals, status counts, top sellers, low stock |

All other original auth/cart/orders/admin endpoints remain intact; consult `docs/API.md` for bodies and error codes.

## Aggregation and revenue semantics

`revenuePerDay` is grouped by **Asia/Kolkata** date and counts only `paymentStatus: collected`. Cash-on-delivery orders reach this state when marked delivered. `mockPaymentsPerDay` counts `paymentMethod: mock` and `paymentStatus: mock_paid` separately, using `simulatedPaise`, **not collected revenue**. Both are amounts in paise. `topProducts` counts units from order snapshots (not just collected payments). Admin-only queries group orders by status and show low-stock active products.

## Index and migration safety

Schemas declare the needed indexes, but their physical state on an existing Atlas database **was not verified**. Before deploying, inspect `db.products.getIndexes()`, `db.reviews.getIndexes()`, `db.orders.getIndexes()` and `db.users.getIndexes()` in a read-only Atlas console. Check duplicates before creating any unique index. Never drop records or reset production data to resolve index errors.

## Verification

- JavaScript syntax checks: performed for edited backend modules and test file.
- Backend integration suite: **not verified** in this environment because a complete npm dependency installation was not available.
- Frontend tests/build: **not verified** for the same reason; no frontend source files were altered.
- Live Atlas, SMTP, sequential order numbers and deployed integration: **not run**; credentials unavailable and production data intentionally untouched.

On your Mac from the project root:

```bash
npm ci --prefix backend
npm ci --prefix frontend
npm test --prefix backend
npm test --prefix frontend
npm run build --prefix frontend
npm run dev
```

Use a development MongoDB Atlas replica set for manual checkout. **Do not point automated tests at the live store database.** The backend integration tests use a disposable `MongoMemoryReplSet`.

### Manual checklist

1. Sign in as customer; list `/api/products` with `q`, category, price sort, two pages, and `page=0` (400).
2. Review a product, retry same review (409), sign in as another customer to verify deletion is forbidden (403), delete as owner, check rating/count.
3. Sign in as admin; inspect `/api/admin/stats` with COD pending, COD collected, and mock-paid records. Confirm mock totals never appear in collected revenue.
4. Test admin product creation and name normalization, soft deletion, customer/admin order visibility, and existing OTP/password reset.
5. Verify COD, mock checkout, idempotent retries, unchanged stock on rollback, emails, order notification rows, and sequential order numbers.
6. Run backend/frontend suites and review index status before calling Phase 2 production-ready.

## Changes, limitations, Phase 3

No new npm package was added. No frontend redesign, statistics UI, or Phase 3 upload/UI work was undertaken. The current ZIP already includes several later-stage ETE files (Redis, service, gateway, Docker), but this phase did not rework or validate them.

**Important limit:** existing Atlas index states, successful test outcomes and actual runtime integration remain unverified until run on the user's machine. Phase 3 may proceed with the frontend integration/polish only after the Phase 2 tests and manual checks are green.
