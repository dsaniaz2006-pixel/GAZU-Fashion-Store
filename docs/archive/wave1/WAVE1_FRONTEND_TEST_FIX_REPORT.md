# GAZU Wave 1 — Frontend test-suite repair

Source: `GAZU_Wave1_Payment_503_Fix.zip`, updated only for issues surfaced by the November 11, 2026 Mac test log.

## What the Mac log proved before this repair

- Staging semantic search: **PASSED**, three returned products, `mode: semantic`.
- AI embedding jobs: **3 done**; AI tagging jobs: **3 done**.
- New Wave 1 backend tests: **22/22 passed**.
- Full backend tests after payment-503 patch: **99/99 passed**.
- Frontend production build in prior log: **passed** (with bundling warnings).
- Frontend Vitest suite in latest log: **11 files failed / 5 passed**, including four assertion failures and seven suite-load failures. Some `.mjs` files used Node's built-in test runner but were picked up by Vitest.

## Changes in this package

1. `frontend/vite.config.js`: Run Vitest only on `.test/.spec` JS, JSX, TS and TSX files; do not load Node `node:test` `.mjs` files into Vitest.
2. `frontend/package.json`: Run those `.mjs` tests separately through `npm run test:node` after Vitest, preserving their coverage.
3. `frontend/src/tests/setup.js`: Add jsdom-only `matchMedia` and WebGL-unavailable fallback mocks; include animation-frame fallback when missing. Production behavior is unchanged.
4. `frontend/src/apiResponseDiagnostics.mjs`: Preserve meaningful HTTP 502/503/504 messages when the response is identified by `X-GAZU-API: gazu-store`, while keeping the existing diagnostic for unidentified proxy errors.
5. `frontend/src/tests/authUpgrade.test.jsx` and `otp.test.jsx`: Make test responses carry the `X-GAZU-API` header, like the actual Express backend.
6. `frontend/src/components/brand/CinematicModelHero.jsx`: Give the visible line-broken hero heading the correct accessible name `LOOKS YOU REMEMBER`, with no appearance change.
7. `frontend/src/tests/productShelf.test.jsx`: Expect the third, optional `size` argument (`""`) supplied by the real size-aware cart method; selected quantity stays 2.
8. `frontend/src/tests/apiResponseDiagnostics.test.mjs`: Add a regression test for meaningful trusted HTTP 503 messages.

## Executed in this environment

- `npm run test:node --prefix frontend`: **7/7 PASSED**.
- `node --check` for modified plain JavaScript configuration/service/test setup files: **PASSED**.
- Frontend Vitest / production build: **NOT EXECUTED** here. `npm ci --offline` could not download an uncached package; the container's Node version was also below the exact engine range of jsdom 30. Your Mac's Node 24.19.0 is appropriate for the project.
- Browser E2E / authenticated admin approval flow: **NOT EXECUTED** here.

## On your Mac: final verification

Open this package in a new extracted directory and copy your private root `.env` into that directory. Keep `MONGODB_URI` for your original GAZU database and `MONGODB_STAGING_URI` for staging. Never upload `.env` or use your production database for test mutations.

```bash
npm ci
npm run setup
npm run test:wave1
npm test
npm run build
npm run ai:staging:semantic
npm run ai:staging:status
```

**Do not declare Wave 1 fully complete until** full `npm test` and `npm run build` pass on your Mac, and the staging-only admin tag-draft approval/rejection and browser E2E tests are verified.

E2E requires staging-safe app configuration, a staging admin, and the running services:

```bash
cd e2e
npm ci
npx playwright install chromium
npx playwright test tests/wave1.spec.js
```

Do not run E2E against your original store database; the normal root `npm run dev` uses the original `MONGODB_URI` unless you explicitly override it in a staging-only process.
