# GAZU Wave 2 — Intelligent Fashion Shopping (Phases 5–9)

This source integrates **five parallel feature workstreams** plus an **Agent 6 integration workstream** into the uploaded Wave 1 codebase. These are delivery/workstream roles, not six independently running autonomous agents.

## Feature and route map

| Workstream | Feature | API | Web page |
|---|---|---|---|
| Agent 1 | AI Fashion Stylist & Style Finder | `POST /api/wave2/stylist` | `/style-finder` |
| Agent 2 | AI Shop the Look & Outfit Builder | `POST /api/wave2/outfits` | `/shop-the-look` |
| Agent 3 | Multi-turn conversational shopping assistant | `POST /api/wave2/chat`, GET/DELETE conversations | `/ai-assistant` |
| Agent 4 | Visual search / photo matching | `POST /api/wave2/visual-search` multipart | `/visual-search` |
| Agent 5 | Personalized discovery from account style & wishlist | `GET /api/wave2/recommendations` | `/discover` |
| Agent 6 | Integrate, preserve Wave 1 and legacy UI, protect DB, testing | `backend/src/app.js`, `frontend/src/App.jsx`, guarded staging launcher | Full integrated project |

### Important behavior

- All suggestions reference actual published, active, sellable `Product` records; no fabricated inventory, pricing, bundles or automatic checkout.
- Outfits may be **partial** when pieces are absent; UI explicitly lists missing slots. Each item is purchased individually via the existing product page.
- The stylist and outfit builder have an **AI-assisted mode** when Gemini is configured and responds; otherwise they are transparently **catalogue-curated**. Gemini outfit suggestions are allowlisted against actual products, slots and prices before being accepted.
- Multi-turn chat requires a verified login and valid configured Gemini provider. It stores at most 12 recent messages per conversation and sets a 30-day expiry; the Mongo TTL index must be initialized for automatic deletion.
- Visual search requires login and configured Gemini. The customer photo is processed in memory, sent to Gemini, and not stored by the GAZU backend. Files are limited to 3 MB and JPEG/PNG/WebP magic bytes.
- Recommendations are account-scoped, use only the signed-in customer's `stylePreference` and wishlist plus optional Atlas semantic product matches; browsing history is not collected.
- All five workstreams read the existing real catalogue; product changes and embeddings remain Wave 1 admin/worker responsibilities.
- This package also incorporates the four changed source/test files from the previously delivered Wave 1 **all-five-frontend-failures** correction, preserving its liquid navbar semantics.

## Setup on Mac — new, isolated Wave 2 preview

1. Extract the ZIP and open the resulting `gazu-store-wave1` folder in VS Code.
2. Copy **your own existing private `.env`** from your prior GAZU installation into the new root. Never paste credentials into chat. Ensure `MONGODB_STAGING_URI` ends in `/gazu_ai_staging?…`; keep the original `MONGODB_URI` unchanged. Ensure `GEMINI_API_KEY`, `GAZU_AI_PROVIDER=gemini`, `GAZU_AI_MODEL` and `GAZU_AI_EMBEDDING_MODEL` are already configured.
3. Install dependencies: `npm ci && npm run setup`.
4. Confirm existing staging data: `npm run ai:staging:status` then `npm run ai:staging:semantic`. You should still have three product embeddings from Wave 1.
5. Run `npm run test:wave2` (dependency-free workstream tests) and `npm run test:wave2:http` (Supertest HTTP contracts, after setup).
6. Run `npm test` and `npm run build` for the existing app. The frontend Vitest suite includes `frontend/src/tests/wave2.test.jsx`.
7. Run `npm run wave2:staging`. This **refuses to start unless** `MONGODB_STAGING_URI` points to `gazu_ai_staging`. It starts staging backend on **8002** and staging Vite frontend on **5174** without replacing original `MONGODB_URI`.
8. Open `http://localhost:5174`. Visit `/style-finder` and `/shop-the-look` first. For `/ai-assistant`, `/visual-search`, `/discover`, register/sign in as a *staging* customer (the original database's user accounts are not copied into staging). Your SMTP/OTP workflow must be functioning to verify a new customer.
9. Stop staging with Ctrl+C.

The standard `npm run dev` still targets the original `MONGODB_URI` and may be affected by your earlier port-8000/HTTP-401 conflict. Prefer `npm run wave2:staging` for AI preview. Do not run catalogue seed/cleanup commands against the original store.

## How to test each feature

- **Agent 1:** Style Finder → choose Heritage/Minimal/Street/Active, occasion, department, color, budget → Ask GAZU Stylist. Check no out-of-stock/draft items, price under budget. Gemini output is optional.
- **Agent 2:** Shop the Look → choose style/category/total budget/optional anchor → Build My Outfit. Verify individual items, sum and `missingSlots` warning. No cart modification.
- **Agent 3:** AI Assistant (signed-in) → send a question and follow-up → reload and reopen conversation → delete it. Verify prior account cannot read another account's conversation.
- **Agent 4:** Visual Search (signed-in) → choose a genuine local garment photo (JPEG/PNG/WebP under 3 MB) → search. Verify image recognition and results; reject spoofed/oversized files. This sends the photo to the configured Gemini API and may use quota.
- **Agent 5:** Discovery (signed-in) → save a wishlist item and set style under Profile → open Discover. Verify the saved product is excluded and that recommendations update with the same customer's wishlist.

## Four testing layers requested

1. **Unit:** Pure ranking, bounds, slots, image signatures and conversation policy; 31 local Node tests across all six workstreams (27 feature tests + 4 integrator tests).
2. **Integration:** Each agent's Node tests include Mongo-shaped catalogue fixtures; `frontend/src/tests/wave2.test.jsx` integrates pages and API-client mocks.
3. **End-to-end:** `backend/tests/wave2/http.test.js` tests real Express routes with database stubs and authentication. `e2e/wave2.spec.mjs` adds five real Chromium journeys, run against the staging server only.
4. **TDD:** Explicit security/regression specifications are in every `agent*.test.js`; local Agent 2 red-green captured two failures (plural garment names; budget-boundary test), fixed and rerun green.

### Browser E2E command (optional, separate install)

`npm install -D @playwright/test && npx playwright install chromium`

With the staging server **already running**, run:

`WAVE2_E2E_BASE_URL=http://localhost:5174 npm run test:wave2:browser`

Authenticated browser journeys require a valid **staging-only** JWT in `WAVE2_E2E_TOKEN`. Without it, the three private journeys are skipped. Do not share a token or put it in repository files.

## Verification status at handoff

**Executed in this environment:** 31/31 dependency-free tests passed (27 Agents 1–5 + 4 Agent 6); JavaScript syntax checks and Babel JSX syntax parsing passed. **Not executed here:** backend Supertest HTTP tests, frontend Vitest/production build, Chromium E2E, live Gemini image requests, live multi-turn chat, and connected staging DB workflow. The sandbox has no installed backend dependencies and cannot reach the npm registry, so it would be misleading to mark the latter passed.

Do not call this Wave 2 release production-ready until those tests pass on your Mac and the Wave 1 HTTP-401 issue is resolved in its original store environment.
