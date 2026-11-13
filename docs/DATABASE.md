# GAZU Database Guide

## Database technology and ownership

GAZU uses MongoDB through Mongoose (`backend/src/config/db.js`, `backend/src/models/`). The backend owns database access. Browser components must call API endpoints; they must not connect to MongoDB directly.

**Important:** This is documentation, not a migration. The project retains the existing MongoDB collections and documents.

## Important models

| Model | Purpose | Relevant source |
| --- | --- | --- |
| `Product` | Catalogue, prices in integer paise, stock/variants, publication status, optional staff-verified fit ranges and AI embeddings | `backend/src/models/Product.js` |
| `User` | Customers, accounts, roles, wishlist/cart/profile data | `backend/src/models/User.js` |
| `Order` | Customer-owned purchases, shipping, item price snapshots and status | `backend/src/models/Order.js` |
| `Review` | Customer product reviews and rating aggregation | `backend/src/models/Review.js` |
| `AIJob`, `AIProductDraft` | Asynchronous tagging/embedding jobs and reviewable proposals | `backend/src/models/AIJob.js`, `AIProductDraft.js` |
| `AIShoppingConversation` | Assistant conversation records | `backend/src/models/AIShoppingConversation.js` |
| `AISizeChartDraft` | Drafts awaiting staff verification of body measurement ranges | `backend/src/models/AISizeChartDraft.js` |
| `AIAdminSuggestion`, `AIAdminAudit` | AI-admin suggestions and audit history | `backend/src/models/AIAdminSuggestion.js`, `AIAdminAudit.js` |
| `SupportTicket` | Human-support handoff | `backend/src/models/SupportTicket.js` |
| `InventoryEvent` | Inventory analytics events | `backend/src/models/InventoryEvent.js` |

More models exist in `backend/src/models/` for OTP, promotions, gifts, loyalty, payments and marketing. Consult those schemas before altering relationships.

## Key integrity rules

- Product `pricePaise` and order money fields represent integer **paise**, not rupees.
- `Product.quantity` and per-size variant quantities must remain nonnegative integers.
- `Product.active` / `publicationStatus` determine visibility; do not equate archived products with deleted records.
- Embedded `Order.items` preserve purchase-time names and prices. `Order.user` controls ownership.
- Optional `Product.fitData` should not be considered verified unless `verified` is true and measurement rows are present.
- `Product.aiEmbedding.values` contains embeddings and is normally excluded from regular product queries.
- Checkout/reviews use transactional behavior; MongoDB Atlas or a replica set is needed for those flows.

## Production and AI staging are separate

- `MONGODB_URI`: normal store connection (in some previous user setups the default database appeared as `test`; **inspect the actual URI and connection name**, do not assume it is `gazu_store`).
- `MONGODB_STAGING_URI`: isolated AI testing database, expected to end in `/gazu_ai_staging` and use a least-privileged staging user.
- `npm run dev` uses normal app configuration. `npm run wave3:staging` uses the isolated Wave 3 launcher, which must be verified to target staging before any write operations.
- Staging may contain only a few test products, so its catalogue is **not** expected to match production.

**Never run** `seed`, catalogue cleanup/import, AI bulk enqueue/indexing, or migration commands against an unverified URL. Keep an Atlas backup and validate target database and permissions first. Tests should use disposable databases or mocks.

## Schema and operational changes

For any new field: add model validation, API validation, ownership/authorization checks, migration/backfill or backward-compatible defaults, automated tests, and a deployment rollback plan. Consult `docs/ARCHITECTURE.md` and `docs/GAZU_REFACTOR_ARCHITECTURE.md` for system boundaries.
