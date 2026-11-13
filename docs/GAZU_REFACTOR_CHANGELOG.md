# GAZU safe refactor — file-level changes

## New

- `backend/src/routes/wave3/{fit,support,languages,admin,forecast}.routes.js` — isolated feature routing without changing URL/HTTP method or handler logic
- `backend/src/routes/wave3/shared.js` — common validation IDs, rate limiter instances, role policy, published-product lookup
- `backend/src/config/runtime.js` — validated startup port
- `backend/src/http/{health,responses}.js` — common health and response middleware
- `frontend/src/config/publicConfig.js` — client-safe API base path
- `frontend/src/lib/api/{httpClient,imageUpload}.js` — transport and upload orchestration
- `frontend/src/lib/catalogue/productAdapters.js` — pure DB-to-UI product/cart adapters
- `frontend/src/lib/navigation/storefrontPaths.js` — pure public route resolver
- `frontend/src/features/wishlist/useWishlist.js` — independent guest/authenticated wishlist state
- `scripts/architecture-refactor.test.mjs` — compatibility and architecture regression tests
- `.editorconfig`, `docs/GAZU_REFACTOR_ARCHITECTURE.md`, this changelog

## Updated

- `frontend/src/api.js` — preserved exports; now a compatibility facade
- `frontend/src/context/StorefrontContext.jsx` — delegates wishlist behavior and URL logic to dedicated modules
- `backend/src/routes/wave3.js` — small composition facade
- `backend/src/app.js` — central API identity, health and 404 responders
- `backend/src/server.js` — validated port parsing
- `backend/src/middleware/errors.js` — safe 400/413 for body-parser errors; guarded response status
- `package.json` — `test:architecture`, `verify:refactor` scripts
- `README.md` — current architecture guide pointer

## Removed

- `frontend/src/data/mensBottomwearEdit.js` — unreferenced duplicate editorial constants. The backed catalogue equivalents and product/image data are retained.

## Preserved

Existing dependencies, product assets, MongoDB models, API URL contracts, Wave 1–3 features, `npm run dev`, staging launchers, `.env.example`, existing tests, liquid-glass UI and all public component imports remain intact.

## Validation caveat

No live database was modified. Run the dependency-based tests and browser journeys on your Mac before swapping a production deployment. See the architecture guide for commands.
