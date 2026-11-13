# GAZU — Safe Modularity Refactor (Waves 1–3)

## What was changed

This is a **compatibility-first structural refactor**, not a redesign or a data migration. The original homepage, liquid-glass navigation, account/cart/checkout behavior, MongoDB schemas, AI features, `/api/*` URLs, and Vite entry point are retained. It intentionally does not require new npm dependencies.

The source ZIP contained an existing separation between presentation, contexts, routes, models, and backend services. Instead of replacing that working architecture, this pass removes concentrated responsibilities and creates explicit, testable boundaries.

### Architecture map

```
project root /
├── .env.example           # one documented source for private runtime config; copy as .env LOCALLY
├── .editorconfig          # conventions for new/edited files
├── backend/
│   ├── src/
│   │   ├── app.js         # Express composition root, unchanged public /api paths
│   │   ├── server.js      # dependency initialization, startup/shutdown
│   │   ├── config/
│   │   │   ├── env.js     # root .env loading, secret validation
│   │   │   └── runtime.js # typed port configuration
│   │   ├── http/
│   │   │   ├── health.js  # health response + pure summary
│   │   │   └── responses.js # API identity and 404s
│   │   ├── middleware/   # authorization, schema validation, errors, request logging
│   │   ├── models/       # Mongoose persistence
│   │   ├── services/     # domain/AI/payment operations, no React or page coupling
│   │   └── routes/
│   │       ├── wave2.js  # original Wave 2 endpoints backed by services/wave2/
│   │       ├── wave3.js  # router composition facade, unchanged route mount
│   │       └── wave3/    # independent fit, support, languages, admin, forecast routers
│   └── tests/
├── frontend/
│   ├── vite.config.js     # public env allowlist and API proxy
│   └── src/
│       ├── api.js        # backward-compatible facade, existing component imports kept
│       ├── config/publicConfig.js # Vite-public client config only
│       ├── lib/api/      # HTTP client, image upload
│       ├── lib/catalogue/ # pure product/cart adapters
│       ├── lib/navigation/ # pure URL building
│       ├── features/wishlist/ # guest/authenticated wishlist state + persistence
│       ├── context/      # AuthProvider, CartProvider (reducer), StorefrontProvider
│       ├── components/   # reusable UI and Nimbus liquid navbar
│       ├── pages/        # route-level UI (including wave2 and wave3)
│       ├── layouts/      # nested pages and existing header/footer
│       └── tests/
├── payment-service/      # isolated mock payment service
├── e2e/                  # existing Playwright/browser contracts
└── scripts/              # tests, data scripts, isolated staging launchers
```

### Stable contracts

- All callers continue importing `api`, `uploadImage`, `toProduct`, and `toCart` from `frontend/src/api.js`. This facade re-exports modules from the new service layer, keeping existing mocks and imports valid.
- The frontend's auth token stays in `sessionStorage` only. Authentication, cart request isolation, session expiry, checkout and role guards have not been rewritten.
- `StorefrontProvider` retains its existing consumer API (`go`, `toggleWish`, `wishlist`, `notify`, etc.). Guest wishlist sync now lives in `features/wishlist/useWishlist.js`.
- Wave 3's `/fit`, `/support`, `/languages`, `/admin/*` and forecast URLs are mounted in **the same order** via five feature routers. Their handlers and authorization/ownership predicates were preserved.
- The backend continues identifying itself with `X-GAZU-API: gazu-store`; `/api/health` and the final JSON 404 response retain their format.
- Request parsing now distinguishes malformed JSON (400) and oversized JSON (413) from unexpected server failures (500). Other existing application error codes are preserved.
- The legacy, unreferenced frontend `data/mensBottomwearEdit.js` was deleted. **No actual product images, catalogue import scripts, collections or database records were removed.**

### Naming conventions

- React UI: `PascalCase.jsx`; hooks: `useSomething.js`; backend feature routes: `feature.routes.js`; pure utilities/adapters: `camelCase.js`; database models: `PascalCase.js`.
- New code: two-space indentation, LF, explicit exports and domain-focused paths. Some legacy source still uses older compressed formatting. A wholesale Prettier rewrite is deliberately deferred because it would create enormous unrelated diffs and could break source-inspecting tests.

## Runtime configuration and safety

1. Keep **one private root `.env`**, never under `frontend/` or `backend/`. The ZIP includes only `.env.example`. Use `npm run env:check` locally.
2. The Vite bundle only permits `VITE_API_URL` and `VITE_GOOGLE_CLIENT_ID`. Everything else (Atlas URLs, JWT, SMTP, payment secrets, Gemini API keys) stays server-side.
3. `npm run dev` uses the configured `MONGODB_URI` and typically serves `http://localhost:5173` (backend `8000`). **Do not run seed/cleanup/bulk indexing commands against your original database.**
4. `npm run wave3:staging` is a separate staging launcher (frontend `5174`, backend `8002`) that requires an explicitly configured `MONGODB_STAGING_URI` targeting `gazu_ai_staging`. Its catalogue may contain only 3 test products.
5. This refactor performs **no automatic database migration, seeding, AI indexing, product deletion, or admin approval**.
6. If your website sees 401, 405 or ECONNREFUSED, verify the process serving port `8000` and check the `X-GAZU-API` header rather than rewriting database URLs.

## Testing sequence

From the project root:

```bash
npm ci
npm run setup
npm run test:architecture    # no MongoDB, browser, or npm deps required
npm run verify:refactor      # architecture, Wave 2/3 logic, removal regression
npm run test:wave2:http     # backend dependencies + disposable test database
npm run test:wave3:http     # backend dependencies + disposable test database
npm test                    # backend + frontend Vitest + payment-service
npm run build
```

For UI/real staging validation, keep `npm run wave3:staging` running in another terminal, install the existing `e2e` dependencies, and run `WAVE3_E2E_BASE_URL=http://localhost:5174 npm run test:wave3:browser`. Also validate Google OAuth origin, seeded staging accounts, policies, fit charts and the live Gemini integration separately. **Passing unit tests does not certify all live features.**

### No-regression acceptance checks

- Main Nimbus liquid-glass navbar keeps its single AI dropdown; no second AI bar or Recently Viewed section appears.
- Existing Men/Women/Kids filtering, product detail, bag, wishlist, checkout, Google/email login and order status routes remain unchanged.
- Anonymous customer API reads work; authenticated requests preserve account ownership; stale 401s do not log out a replacement user.
- AI fit only uses verified size charts; support only accesses owned orders; AI admin suggestions require approval; forecasting remains read-only.

## Known limitations and follow-up

- The supplied ZIP has **no installed node_modules**. This execution environment has an incomplete offline npm cache, so full Vitest, Supertest/Express integration, production Vite build and Playwright runs **must still be verified on your Mac**.
- The existing app has broader legacy modules (notably `frontend/src/pages/Admin.jsx` and the original Wave 2 router) that can be split later after live integration tests are green. Risky mass renames and a full prettier pass are intentionally excluded.
- Automated dead-code analysis cannot prove absence of dynamic imports, seeded database usage or external scripts; only the explicitly unreferenced frontend editorial-data duplicate was removed.
- This is a modularization/refactor, **not** a claim of production readiness or successful live OAuth/Gemini verification.
