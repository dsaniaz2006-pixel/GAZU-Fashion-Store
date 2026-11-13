> Current authentication upgrade (5 November 2026): [architecture, setup and actual verification](AUTH_UPGRADE.md), [changes](AUTH_UPGRADE_CHANGES.md), [checklist](AUTH_UPGRADE_CHECKLIST.md). Earlier phase records follow.

> Latest update: [Phase 1 frontend architecture, 4 November 2026](PHASE1.md). See its actual test results and [file-by-file changes](PHASE1_CHANGES.md). The existing content below records earlier work.

# Architecture and blueprint mapping

## Service boundaries

Browser → nginx gateway → web for client routes; API for `/api/*` and `/uploads/*`; payment service for `/api/payments/*`.

API → Mongo replica set (users, products, reviews, orders), Redis (public product reads), local persistent image volume. API → payment service `/internal/decision` using a shared service secret. Payment service's gateway adapter forwards bearer authorization to the API, which performs authentication, validation and the transaction. The service has no database credentials and never owns order state. This two-hop adapter preserves the existing public payment contract without duplicating checkout business logic.

Compose discovers containers by service name. Local monolith mode does not require the payment service; set PAYMENT_SERVICE_URL to opt in. No card data is accepted.

## Database and concurrency

Product has text and category/price indexes, name-normalization save middleware, priceRupees virtual and search static. Review references User/Product and enforces unique user/product. Review save/document-delete hooks aggregate ratings in the same session; competing rating updates conflict on the shared product and Mongo transactions retry. Order embeds purchase-time items and has itemCount virtual and unique user/requestId idempotency index. Cart remains embedded in User.

Checkout retains conditional stock decrement and transaction rollback. Reviews, catalogue writes and completed checkout invalidate cached catalogue generations. A generation in Redis forms part of every cache key, avoiding wildcard scans and stale in-flight writes resurfacing under a new generation. Old keys expire after 30 seconds. Reconnection rotates the generation. Cache failures fall back to MongoDB. Requests during an outage can expose at most TTL-bounded older keys in multi-instance edge cases; this is a classroom cache, not a strict distributed consistency guarantee.

## React

main.jsx composes BrowserRouter, ErrorBoundary, AuthProvider and CartProvider. App.jsx declares routes. Account and admin use nested routes; guards control access and API role checks remain authoritative. CartContext synchronizes reducer state from server responses, blocks concurrent cart mutations and ignores responses from a previous account generation. Auth expiry clears the token and displays a sign-in message. useFetch ignores stale responses after route changes; useDebounce drives shop search. StorefrontContext holds presentation-only state for the original layout. Tailwind utilities style the added pages alongside the preserved storefront CSS.

## Coverage

| Blueprint topic | Implementation |
| --- | --- |
| Virtuals/statics/middleware/indexes | backend/src/models/Product.js, Review.js, Order.js |
| Referencing/populate/aggregation | reviews, admin orders, services/stats.js |
| Custom errors | utils/errors.js and middleware/errors.js |
| Routes/context/reducer/hooks | frontend/src/routes, context, hooks, App.jsx |
| Search/pagination/reviews | routes/products.js and frontend pages |
| Upload/progress | routes/uploads.js, api.js uploadImage, Admin.jsx |
| Logging | config/logger.js, middleware/requestLogger.js |
| Redis | services/cache.js |
| Microservice/gateway | payment-service, gateway/nginx.conf |
| Containers/CI/CD | Dockerfiles, docker-compose.yml, .github/workflows/ci.yml |
| Cloud | deployment guide and opt-in hooks; not deployed |

Postponed features remain postponed: real payments, refunds/cancellations, email, variants, recommendations, Kubernetes and queues.


## Phase 3 CE-2 integration
The existing React Router/Context frontend continues to call the single Express API via `frontend/src/api.js`. Existing review/store/search models and routes remain the source of truth; UI changes are incremental. Admin image upload uses browser XMLHttpRequest for real transfer progress, Express/multer for validated upload and `/uploads` static serving. Revenue reporting distinguishes collected COD from mock transactions. Phase 4 infrastructure is not introduced here.

## Phase 4 observability and cache
Request IDs use AsyncLocalStorage and Morgan writes structured HTTP events through Winston; Redis is an optional read-through cache for public products. Versioned keys ensure invalidation without key scans. MongoDB remains the authoritative store and a Redis outage does not prevent checkout. See `PHASE4.md`.


## Phase 5 local Docker architecture
See [PHASE5.md](PHASE5.md). The default Compose stack uses web -> api -> MongoDB replica set and optional Redis; gateway/payment-service are not deployed in this phase.

## Phase 6 gateway and payment boundaries

Browser → public nginx gateway (`:8080`) → web (React static assets) or Express (`/api`, `/uploads`). Express calls private payment-service over an authenticated internal HTTP decision endpoint; MongoDB remains authoritative for stock/orders and Redis is an optional product cache. PaymentAttempt records durable retry status. See `docs/PHASE6.md`.
