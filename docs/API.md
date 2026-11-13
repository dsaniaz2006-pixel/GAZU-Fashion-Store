# Authentication API upgrade (5 November 2026)

All bodies are JSON. Existing `{message, code?, requiresVerification?, email?, retryAfter?}` errors remain. Auth responses are `Cache-Control: no-store`. Normal session response is `{token, user:{id,name,email,role}}`. No password hashes, Google sub, recovery hash or Google credentials are returned.

| Method / route | Auth and body | Success | Validation/errors and storage |
| --- | --- | --- | --- |
| POST `/api/auth/register` | Public; `{name,email,password,confirmPassword?}` | 201 verification-required, no session | Existing normalized-email uniqueness; 400 invalid/mismatch; 409 existing email; 503 SMTP pending recovery; hashed password + EmailOtp |
| POST `/api/auth/login` | Public; `{email,password}` | 200 normal session | 401 generic credentials; 403 unverified/disabled; Google-only accounts have no password until recovery sets one |
| POST `/api/auth/google/challenge` | Exact CLIENT_ORIGIN, JSON `{}` | 200 `{nonce}` plus HttpOnly binding cookie | 403 foreign/missing Origin; 503 not configured; stores ten-minute GoogleChallenge |
| POST `/api/auth/google` | Same Origin/browser binding; `{credential}` | 201 new pending, 200 existing pending, or 200 verified session | 401 token/nonce/expiry/signature/claims; 403 disabled; 409 existing unlinked email or unique collision; 503 OTP delivery failure |
| POST `/api/auth/verify-email` | Public; `{email,otp}` | 200 `{message,token,user}` after activation | Additive session response; prior message consumers still work. 400 invalid/expired; 429 attempts; atomic EmailOtp consumption/User activation |
| POST `/api/auth/resend-otp` | Public; `{email}` | Existing generic message and retryAfter | Existing cooldown/send cap and SMTP recovery errors; no automatic Google re-entry resend |
| GET `/api/auth/me` | Bearer GAZU JWT | 200 `{user}` | Existing shape; 401 invalid/version-revoked token; 403 disabled/unverified |
| GET `/api/auth/methods` | Bearer GAZU JWT | 200 `{password:boolean,google:boolean}` | Exposes provider availability only for the authenticated user |
| POST `/api/auth/link-google` | Bearer JWT + exact Origin + challenge; `{credential,password}` | 200 message | 403 incorrect password/unverified; 401 invalid Google; 409 mismatched email/existing link/collision/concurrent account change; conditional same-user update |
| POST `/api/auth/forgot-password` | Public; `{email}` | 200 generic message and retryAfter for every eligible/ineligible account outcome | 400 malformed email; 429 IP cap; account throttle/SMTP failure not disclosed; protected recovery state on User |
| POST `/api/auth/reset-password` | Public; `{email,code,password,confirmPassword}` | 200 message, no auto-login | 400 wrong/expired/used code or mismatch; 429 IP cap; atomic password update, code consumption, sessionVersion increment |

Registration/Google activation and password reset use replica-set transactions where existing state requires it. GoogleChallenge is atomically consumed. Passwords are 8–72 UTF-8 bytes; Google token body is 20–12000 characters; codes are exactly six digits. See [AUTH_UPGRADE.md](AUTH_UPGRADE.md) for limits, state transitions, security decisions and live acceptance steps. Google challenge cookies require same-origin `/api` proxying as configured for Vite and Docker; arbitrary cross-site API-cookie hosting is not added.

Coverage: `backend/tests/authUpgrade.test.js` (26 new tests), existing `otp.test.js` and `api.test.js`; frontend `authUpgrade.test.jsx` (8 new tests), existing auth/OTP/route tests; `scripts/auth-env.test.mjs` (3 new configuration checks).

---

## Existing API reference (earlier phase record)

# API contract

Base: `/api`. JSON body except multipart uploads. Send `Authorization: Bearer <token>` on authenticated routes. All prices are integer paise. Errors are `{ "message": "..." }`; 400 validation, 401 authentication, 403 authorization, 404 missing, 409 conflict, 500 unexpected error. Mock decline uses 402; service unavailability uses 503. Request logs omit bodies, authorization headers and query strings. Responses have `X-Request-ID`.

## Authentication

- `POST /auth/register`: `{name,email,password}` → 201 `{requiresVerification,email,retryAfter,message}` with no token. Verify via `POST /auth/verify-email` using `{email,otp}`, then sign in. `POST /auth/resend-otp` accepts `{email}`. See EMAIL_OTP.md for error codes and limits. Role cannot be self-assigned.
- `POST /auth/login`: `{email,password}` → `{token,user}`.
- `GET /auth/me`: authenticated → `{user}`. User contains `id,name,email,role`.

## Catalogue

- `GET /products?q=cotton&category=Men&sort=price_asc&page=1&limit=12`
- `q`: Mongo text search on name/description, max 100 characters. Matches indexed words, not arbitrary substrings.
- `category`: Men, Women, Kids, Accessories; omit for all.
- `sort`: featured (default), newest, price_asc, price_desc.
- `page`: integer ≥1; `limit`: 1-50, default 12. Invalid values return 400.
- Returns `{items,total,page,limit,pages}`. This replaces the original bare product array.
- `GET /products/:id`: active product including `rating`, `reviewCount`, virtual `priceRupees`. Missing/deactivated → 404.
- Both return `X-Cache: HIT|MISS`. Only public product reads are cached.

## Reviews

- `GET /products/:id/reviews?page=1&limit=12` → `{items,total,page,limit,pages}` with populated `user: {_id,name}`. Same pagination bounds as catalogue.
- `POST /products/:id/reviews`: signed in; `{rating:5,comment:"Comfortable fit"}` → 201 review. Integer rating 1-5; comment 3-1000 characters. One per account/product, enforced by unique index; duplicates → 409. No verified-purchase restriction, consistent with the blueprint's viewed-product option.
- `DELETE /reviews/:id`: owner or admin → 204. Others → 403.
- Creation/deletion and aggregate product rating/count updates run in one transaction. Cache invalidation occurs after commit.

## Cart and orders

- `GET /cart`: signed in → populated cart array.
- `POST /cart/items`: `{productId,quantity}` adds units.
- `PATCH /cart/items/:id`: `{quantity}` sets units (1-99).
- `DELETE /cart/items/:id`: removes product.
- Cart mutations return current populated cart. These original `/cart/items` paths are retained.
- `POST /orders/checkout`: `{requestId:<UUID>,shipping:{name,address,city,pin,phone}}` → 201 order. PIN is six digits, phone ten digits. Prices, totals and user identity are never accepted from client.
- Transactions conditionally reduce stock, create order snapshot, clear cart. Retrying the same requestId returns the same order without charging stock twice.
- `GET /orders`: personal order list.
- `GET /orders/:id`: personal order detail; another customer's order → 404.
- Orders include virtual `itemCount`.

## Admin

All `/admin/*` routes require a database-backed admin role.

- `GET /admin/products`: active inventory array.
- `POST /admin/products`: full `{name,description,category,type,color,tag,img,pricePaise,quantity,inStock}` → 201 product.
- `PATCH /admin/products/:id`: same full body → updated product (partial bodies are not supported).
- `DELETE /admin/products/:id`: soft-delete → 204.
- `img`: Unsplash `photo-...` ID or `/uploads/<uuid>.png|jpg|webp` from upload endpoint.
- `POST /admin/uploads`: multipart field `image`, one JPEG/PNG/WebP up to 5 MB → 201 `{url:"/uploads/<generated-name>.png"}`. MIME allow-list and file signature checked. Wrong type/size → 400. `/uploads/*` serves files with nosniff.
- `GET /admin/orders`: all orders with populated customer name/email.
- `PATCH /admin/orders/:id/status`: `{status}`. Only placed → preparing → out_for_delivery → delivered. Skips/repeats → 409. Delivered COD becomes collected atomically.
- `GET /admin/stats`: `{revenuePerDay,ordersByStatus,topProducts,lowStock}`. `revenuePerDay` includes captured Razorpay payments and COD marked collected on delivery, grouped by IST date, most recent 30 revenue dates. `mockPaymentsPerDay` separately reports simulated successful payments; these are **not actual revenue**. Top five products by units across placed orders; low stock ≤5, at most 20 active products.

## Payments and health

- `GET /payments/config` → `{mockEnabled,razorpayEnabled,razorpayKeyId?}`. Only the public Razorpay key ID is returned.
- `POST /payments/mock/checkout`: checkout body plus `outcome:"success"|"failure"`. Signed in. Only enabled when ENABLE_MOCK_PAYMENTS=true and NODE_ENV is not production.
- Failed mock decision → 402 with no cart/stock mutation. Success → 201 mock_paid order, no money moved. In standalone mode decision is local; with PAYMENT_SERVICE_URL it is requested over HTTP using X-Service-Key. Decision failure → 503.
- The internal payment simulator only decides mock outcomes; the API alone writes orders. Razorpay traffic is handled and verified by the backend, not the mock service.
- `GET /health`: `{status,mongo,redis}`. Missing Mongo → 503. Redis disabled/down does not fail readiness; shop falls back to database.


## Phase 3 frontend/API mapping
`GET /api/products?q=&category=&sort=&page=&limit=` is used by `/shop`. `GET /api/products/:id/reviews` and `POST /api/products/:id/reviews` power review listing and creation; `DELETE /api/reviews/:id` deletes owned/admin reviews. `POST /api/admin/uploads` accepts multipart `image` (JPEG, PNG, WebP, max 5 MB) and returns `{url:"/uploads/uuid.ext"}`. `GET /api/admin/stats` includes `revenuePerDay` (captured online and collected COD paise) and separately `mockPaymentsPerDay` (simulated paise), plus `ordersByStatus`, `topProducts`, `lowStock`. Server-side JWT/role protections remain mandatory.

## Phase 4 diagnostics and caching
`GET /api/products` and `GET /api/products/:id` return `X-Cache: HIT|MISS|BYPASS`. `X-Request-ID` is generated server-side for API responses. Public catalogue cache varies by path and query parameters; private/authenticated reads are bypassed. `GET /api/health` includes `mongo: up|down` (required) and `redis: up|down|disabled` (optional). Cache version is advanced after committed product, review and checkout updates.

## Phase 6 payment API

`POST /api/payments/mock/checkout` — Bearer JWT required. Body `{requestId: UUID, shipping: {...}, outcome: "success" | "failure"}`. Server resolves authoritative items and price; simulated payments only. Returns 201 for new order, 200 for exact idempotent replay, 402 declined, 409 conflicting/in-flight UUID, 503 unavailable or unknown result. Never send customer-supplied prices.

`POST /api/payments/razorpay/order` — Bearer JWT required. Body is the checkout shipping/coupon/gift-credit details. Server calculates the total from the cart, then creates the Razorpay order and returns its ID, amount, currency, and public key ID.

`POST /api/payments/razorpay/verify` — Bearer JWT required. Body is the same checkout details plus `razorpayOrderId`, `razorpayPaymentId`, and `razorpaySignature`. The backend verifies the HMAC and gateway payment amount/status before creating the order. Captured payments are refunded if a final stock/cart conflict prevents order creation.

`GET /api/payments/config` — Public mock/Razorpay availability flags and, when configured, the public Razorpay key ID.

`POST /internal/decision` — **Private mock payment-service only**; `X-Service-Key` plus `{idempotencyKey: UUID, outcome, amountPaise: integer}`; authenticated Express uses this, never React. 200 approved/declined, 400 invalid, 403 unauthorized, 409 conflicting replay, 503 journal failure. Not exposed by nginx gateway. Razorpay requests are made directly by the backend and do not use the mock payment-service.
