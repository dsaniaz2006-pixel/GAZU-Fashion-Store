# Phase 1: React frontend architecture

Implemented and verified on 4 November 2026 against the newly supplied `gazu-store.zip` and the Phase 1 prompt. This is the React architecture phase of the seven-phase blueprint, not the earlier email phase. See [the pre-change audit](PHASE1_AUDIT.md), [completion checklist](PHASE1_CHECKLIST.md), and [file-by-file changes](PHASE1_CHANGES.md).

## Scope and preserved behavior

The existing GAZU design, React Router URLs, tab-scoped sessionStorage authentication, backend contracts and server-calculated checkout remain. All `backend/src` files, package manifests and lockfiles are byte-identical to the supplied archive. No schema, checkout service, price calculation, email service, payment service or deployment configuration was rewritten. The original uploaded images are retained. No dependencies were added or upgraded.

The inspected source uses React 19, Router 7, Vite 7, Tailwind 4, Express 5, Mongoose 8, JWT/bcrypt and Nodemailer. Installed versions come from the existing lockfiles. Existing Tailwind tooling was retained without a visual redesign.

**Source mismatch:** forgot-password and password-reset OTP were not implemented in this supplied ZIP. There are no corresponding backend routes or frontend screens, and its README already lists password reset as absent. Registration OTP, resend and verification are preserved. Adding password recovery requires a separate backend feature and was not invented during this frontend-only phase.

## Architecture

`main.jsx` retains ErrorBoundary → BrowserRouter → AuthProvider → CartProvider → App. `App.jsx` now defines routes instead of owning the storefront UI state.

- `StorefrontLayout` renders the existing Header, Footer, notifications and Outlet. Its StorefrontProvider owns only presentation concerns such as menu/search panels, session-only wishlist, toast and catalogue refresh. User and cart state are consumed from their respective providers.
- `AccountLayout` provides account/orders navigation and an Outlet. Login remains accessible to visitors; order pages sit beneath ProtectedRoute.
- `AdminLayout` provides active product/order/statistics links and an Outlet beneath both route guards.
- `ConnectedPages` adapts contexts and payment configuration to Account, Checkout and Admin, keeping route-specific wiring out of the presentation pages.
- `ProductGrid`, `OrderCard`, `OrderSummary` and shared loading/error states reuse existing CSS. Large checkout and order views delegate their repeated presentation.

### Routes

| URL | Access / purpose |
| --- | --- |
| `/` | Public home |
| `/shop` | Public catalogue; URL search/category/sort/page |
| `/product/:id` | Public product and existing reviews |
| `/cart` | Bag or sign-in prompt |
| `/wishlist` | Existing session-only wishlist |
| `/account` | Registration, OTP, sign-in or account |
| `/account/orders` | Authenticated customer history |
| `/account/orders/:id` | Authenticated order details using Mongo ID |
| `/checkout` | Authenticated COD/mock checkout |
| `/admin`, `/admin/stats` | Admin statistics |
| `/admin/products` | Admin inventory and uploads |
| `/admin/orders` | Admin fulfilment |
| `/help`, `/about` | Existing information pages |
| unmatched URL | 404 with shop link |

Navigation uses Router links or navigate. Guards retain the requested path, query and hash through sign-in. Customer accounts receive an access-denied view for admin routes; backend authorization remains authoritative. Existing nginx `try_files`, Netlify `_redirects`, and Vercel rewrites are retained for SPA fallback. Actual hosted deployment was not tested. Configure the deployed API URL/routing as described in [DEPLOYMENT.md](DEPLOYMENT.md); the Vite development proxy is not a production API proxy.

### Auth and cart

AuthContext exposes `user`, `token`, `ready`, `loading`, `error`, `message`, `login`, `logout` and `restore`. It restores `/auth/me`, aborts superseded requests, clears invalid sessions, and retains the session for a retry after transient network errors. API error events only apply to the token that originated the request, preventing an old 401 from signing out a new account. Authentication was not moved to localStorage.

CartContext uses reducer state `{items, loading, error}`. Actions are SET_CART, CLEAR_CART, ADD_ITEM, REMOVE_ITEM, UPDATE_QUANTITY, SET_LOADING and SET_ERROR. Quantities are validated; SET_CART removes duplicate IDs. Real mutations use the returned server cart through SET_CART, not speculative frontend pricing. The authenticated session keys the cart subtree, clearing old cart and page state when accounts change. Initial loading and all cart/checkout mutations share a synchronous lock. Cancellation and request sequencing reject stale results and stale errors. Failed operations retain the bag and expose retry/error states.

Checkout sends shipping, requestId and the existing optional mock outcome only. The backend still owns totals, availability, transactions and stock. The same requestId is retained after recoverable errors; duplicate clicks cannot create parallel requests. Success clears the shared cart. Display uses `order.orderNumber || order._id`; detail URLs continue to use `_id`.

### Hooks

| Hook | Responsibility |
| --- | --- |
| useAuth / useCart | One context access hook each, defined with their providers |
| useFetch | Loading/error, AbortSignal, stale-response masking, explicit private-session scope and reload |
| useDebounce | Existing delayed search value; old results hidden while new input settles |
| useLocalStorage | Validated, safe JSON storage and cross-tab updates for non-sensitive sort preference only |

Shop URLs remain authoritative. A missing sort is filled from the preference with history replacement. Typing replaces the current history entry; filters, sorting and pages retain useful back/forward navigation.

## Run on macOS

1. Extract the delivered ZIP and open its `gazu-store` folder in VS Code.
2. Use Node.js 22.12 or later (verification used Node 24.19).
3. From that folder:

```sh
npm ci
npm run setup
```

4. Copy your existing private `backend/.env` into this extracted project's backend directory. Keep your existing MongoDB, JWT and Gmail settings. For a fresh environment, use `backend/.env.example` as the template and fill it locally. No real credentials are included in this package.
5. Use the existing Atlas database or a local MongoDB replica set. Transactions require a replica set. **Do not seed, reset or migrate the existing database for this upgrade.**
6. Start the application:

```sh
npm run dev
```

Open http://localhost:5173. Default backend port is 8000. If those ports are busy, set the frontend port and proxy target together with the backend port and matching CLIENT_ORIGIN, for example:

```sh
PORT=8005 FRONTEND_PORT=5175 API_PROXY_TARGET=http://127.0.0.1:8005 CLIENT_ORIGIN=http://localhost:5175 npm run dev
```

Optional frontend `VITE_API_URL` remains available as before. Private `.env` files, dependencies, build outputs and Git metadata are intentionally excluded from the ZIP. Existing uploads are included; temporary test uploads are not.

## Verification results

| Check | Actual result |
| --- | --- |
| `npm ci` in root, frontend, backend, payment-service | Passed using unchanged lockfiles |
| `npm test --prefix frontend` | 31 passed across 3 files |
| `npm test --prefix backend` | 37 passed; temporary MongoDB replica set, mocked SMTP |
| `npm test --prefix payment-service` | 1 passed |
| `npm run build --prefix frontend` | Passed; Vite production build |
| Root `npm run dev` | Both frontend and backend started, isolated ports 5175/8005 |
| Headless Chrome browser regression | Passed, zero page errors |
| Desktop and 390px mobile screenshots | Inspected; original styling retained, no mobile horizontal overflow |
| Backend-source and dependency-file comparison | Identical to supplied archive |

69 automated tests passed in total. Frontend coverage includes auth restoration/logout and stale failures, guarded URLs and destinations, cart synchronization/concurrency/retry, reducer validation, fetch cancellation, safe preferences, order-number fallback, order links, admin navigation, checkout loading/success/failure/idempotency request retention, OTP and ErrorBoundary fallback. Backend assertions additionally verify number formatting, idempotent numbering, one confirmation notification, and successful order persistence when mail fails.

The browser run used the actual root development command, a disposable database with test customers/admin/products, and an intercepted Nodemailer transport. It exercised registration, OTP refresh recovery and verification, intended-destination login, pagination/back/forward, search/category/sort/refresh, product deep links, cart quantity/refresh, COD, order-number detail links, customer admin denial, logout/account changes, mock failure then success, admin refresh, image upload/create/edit/stock/deactivate, order status, statistics, mobile layout and 404. No real email or purchase was made. Test fixture records were never written to the user's database.

Screenshots are in `docs/phase1-screenshots/`. They contain disposable demonstration data, not the user's live inventory.

## Manual verification

Use a disposable test database and mail sandbox for order/OTP checks. The normal application sends mail using its configured SMTP settings.

| Feature | Steps and expected outcome |
| --- | --- |
| Registration and OTP | Register a new test email; refresh the OTP screen, enter the captured code, verify and sign in. Retry a wrong code; the email/form should remain. Test resend after the displayed cooldown. |
| Session | Refresh a private URL; your account restores. Log out and use Back; private data must not appear. Switch accounts and check that the previous bag is absent. |
| Guards | Open an order URL while signed out, sign in and confirm return to that URL. A customer opening `/admin/products` receives denial. |
| Catalogue | Type a search, filter category, change sort, move between pages, use Back/Forward, and refresh. Controls and results must follow the URL. |
| Product/reviews | Open and refresh a product URL. With a test account, submit/delete a review and check rating updates and duplicate-click protection. Review API regression tests pass; review UI creation/deletion was not exercised in this phase's Chrome run. |
| Cart | Add an item, change quantity, remove it, navigate and refresh. Bag count remains consistent. Simulate a failed API call and retry; no false success or duplicate item should appear. |
| Checkout | Submit COD in a test database; observe GAZU number and empty bag. Follow order history/detail and refresh. Try mock failure, retain shipping/bag, then mock success. Check duplicate submissions and out-of-stock errors. |
| Mail/number | With intercepted SMTP, inspect notification records and the same GAZU number in confirmation, order history and detail. Test SMTP failure: order still exists. Live Gmail delivery was not tested. |
| Admin | Sign in as existing admin; create a test product/upload image, edit price/stock, deactivate it; inspect orders, advance allowed statuses and view stats. Refresh each nested route. |
| Failures | Browser offline mode should show readable errors and retries. Invalid URL shows 404. Automated tests cover unexpected rendering via ErrorBoundary. |
| Responsive UI | Check desktop and narrow mobile home/shop/cart/order/admin pages, header controls, footer and navigation. |
| Password recovery | Not available in the supplied source. Requires a separately scoped implementation. |

## Limitations and Phase 2 readiness

Live Atlas/Gmail, Docker, hosted CI, Redis integration and cloud deployment were not tested in this phase. Existing deployment artifacts were preserved. Mock payments are simulations, not a production payment gateway. Wishlist remains session-only. Server-side catalogue pricing and order totals remain authoritative even though UI summaries display server-returned cart prices. Existing inventory/order-list pagination limitations remain.

The frontend now has stable route/layout boundaries, reusable auth/cart access, request cancellation, clear API error handling and focused order components for Phase 2. Inspect the existing Mongoose relationships, validation, indexes, aggregates and transaction tests before planning database changes: many blueprint backend features already exist. Address password recovery as an explicit missing feature if included in a later phase. No later-phase implementation was added here.
