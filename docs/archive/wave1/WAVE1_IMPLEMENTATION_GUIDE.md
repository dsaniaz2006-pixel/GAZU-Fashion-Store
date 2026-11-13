# GAZU Wave 1 — Seven Workstream Integration & Setup Guide

This package is the original GAZU source, expanded with Wave 1 AI. The seven requested *roles* were implemented in one engineering session; no independent autonomous subagent processes were running. Subagents 1–5 denote feature ownership; 6 denotes integration; 7 is this setup guide. To run seven truly separate Codex agents, use `WAVE1_7_AGENT_CODEX_PROMPT.md`.

**Do not use on your live customer database until Phase 0 audit and a separate staging database have been reviewed.** The original uploaded `.env` was intentionally ignored and is not included. No real external credential or production index was used during development.

## Workstream handoff inventory

| Role | Phase | New / modified implementation | Main handoff |
|---|---|---|---|
| 1 | Readiness | `backend/src/services/ai/catalogueAudit.js`, `backend/scripts/aiCatalogueAudit.js` | Read-only report; checks duplicate names/SKUs, stock, variants, product statuses, categories, file paths; no deletion |
| 2 | Infrastructure | `services/ai/modelProvider.js`, `usageTracker.js`, `promptRegistry.js`, `toolRegistry.js`, `responseValidator.js`, `aiJobs.js`, `models/AIQuota.js`, `models/AIUsage.js`, `models/AIJob.js`, `workers/aiWorker.js`, `routes/ai.js` | Mock + Gemini adapters, provider errors, quotas, audit fields, protected chat, SSE transport, Mongo queue |
| 3 | Product tagging | `services/ai/productTagging.js`, `localImage.js`, `models/AIProductDraft.js`, `frontend/src/components/AICataloguePanel.jsx` | Admin tagging proposals and approval; only approved style tags are written |
| 4 | Embeddings | `services/ai/embeddings.js`, `scripts/aiAtlasIndex.js`, `scripts/aiEnqueueAll.js`, `backend/ai/vector-index.json` | Gemini Embedding 2 at 768 dimensions, optional local product images, Atlas index definition, resumable batch queue |
| 5 | Smart search | `services/ai/smartSearch.js`, frontend `pages/Shop.jsx`, HTTP `/api/ai/search` | Query understanding, category/price/color filters, vector scoring and keyword fallback; keeps shelf/grid and sort controls |
| 6 | Integration | `backend/src/app.js`, `models/Product.js`, `routes/admin.js`, package scripts and dedicated tests | Wired API, auto-queue on catalogue edits, frontend staff panel, no checkout/order/auth migration |
| 7 | External setup | This document, `.env.example` comments and test report | Key/cluster/index/user steps and go-live checkpoints |

## Before connecting anything — local baseline

1. Unzip the integrated source (the ZIP intentionally excludes `node_modules` and your real `.env`).
2. In Terminal on your Mac, go to the extracted directory containing `package.json`.
3. Use Node.js **22.12 or later**. Run:

```bash
npm ci
npm run setup
npm run test:wave1
npm run ai:audit
```

The default audit uses **bundled catalogue seed definitions**, not MongoDB. A nonzero audit exit code 2 indicates review findings; it does not change anything. The bundled 31 seed entries passed the non-destructive audit here. Your live database can differ.

4. Keep your own root `.env` locally. If you do not already have one, create it from `.env.example` and fill in MongoDB, JWT and application settings; do not use the uploaded fake `.env`. **Do not share secrets in chat**.
5. Check the existing app before AI changes:

```bash
npm run env:check
npm run dev
```

Open `http://localhost:5173`. GAZU `/shop` now calls `/api/ai/search`, which works in keyword fallback mode even without Gemini. Run `npm run build` locally on the Mac. On this execution machine, the transplanted Mac `node_modules` lacked Rollup's Linux native package, so the Vite build was not independently verified here; reinstalling with `npm ci` on your own system is expected.

## Phase 0 — review real database, safely

- Create or restore a **separate staging Atlas database**. Copy only product data approved for testing; avoid copying real customer emails, orders or secrets.
- Confirm product name/SKU, correct Men/Women/Kids categories, variant stock counts, active/published flags, valid sizes and image paths.
- For a read-only audit of a connected database, on staging only set `GAZU_AI_AUDIT_ALLOW_DATABASE=true` and:

```bash
npm run ai:audit -- --database
```

- Inspect findings manually. This script never updates or removes products. **No automatic deletion of demo, discontinued or duplicate entries has been performed.** Admin must approve any cleanup through existing catalogue workflows.
- Establish real performance baseline with your chosen test dataset; none is claimed from the unavailable live database.

## Phase 1 — create a Gemini key

1. Visit https://aistudio.google.com/apikey (Google AI Studio).
2. Create or select a project and generate a current **Gemini authorization key**. Check active Gemini API quota and billing controls in AI Studio. Different models may have different limits and billable usage.
3. In **only the root `.env` on your machine**, set:

```dotenv
GAZU_AI_PROVIDER=gemini
GEMINI_API_KEY=PUT_YOUR_REAL_KEY_HERE
GAZU_AI_MODEL=gemini-2.5-flash
GAZU_AI_EMBEDDING_MODEL=gemini-embedding-2
GAZU_AI_VECTOR_ENABLED=false
GAZU_AI_AUTO_INDEX=false
GAZU_AI_USER_DAILY_REQUESTS=30
GAZU_AI_USER_DAILY_TOKENS=60000
GAZU_AI_PUBLIC_DAILY_REQUESTS=300
```

4. Restart backend and start the separate worker in another Terminal:

```bash
npm run ai:worker
```

5. Log in as an admin and open the existing product editor. Use **AI Catalogue Review → Suggest tags**, then **Refresh AI jobs & drafts**, inspect suggestions, approve/reject. On mock mode the draft is explicitly marked `mock`; live Gemini mode uses the key. Generated material, size and factual claims must be manually verified. Approving currently merges *style tags only*.
6. The assistant endpoint `POST /api/ai/chat` is authenticated but there is no customer-facing chat widget in Wave 1; that belongs to Wave 2. The protected SSE endpoint `/api/ai/chat/stream` is also implemented for future UI. Do not mark conversational shopping released just because the backend exists.

Official documentation: https://ai.google.dev/gemini-api/docs/api-key and https://ai.google.dev/gemini-api/docs/rate-limits

## Phase 2 — tagging workflow acceptance

- Approve only tags you have checked against the product photo and verified metadata.
- Imported product images from `/products/men-*` can be read server-side for multimodal classification. Unsplash `photo-*` placeholders are **not downloaded** and produce text-only tagging, to avoid SSRF.
- Ensure `npm run ai:worker` stays running to process queued jobs. Jobs are stored in MongoDB, with leases/retries; a single worker is sufficient for development.
- Note that tag suggestions, description drafts and detected colors are **not automatically published**. The current approval UI applies only tags.

## Phase 3 — Atlas vector index and batch indexing

This project currently uses a local Docker Mongo container for non-Atlas mode. That container is **not equivalent to Atlas Vector Search**. Choose a separate staging Atlas deployment with MongoDB Vector Search support. Verify the chosen tier and allowed index creation method in your Atlas console; **Free-tier indexes may require creation in the Atlas UI**, while the driver helper can require a supported deployment/role.

1. Confirm the `MONGODB_URI` points to the staging database and `GAZU_DB_MODE=atlas`.
2. In Atlas search/index UI, create a **Vector Search** index named `gazu_product_vector_v1` on collection `products`, using the `definition` object in `backend/ai/vector-index.json` (the outer `name` and `type` are metadata, not always part of the JSON editor). OR, where driver creation is supported, run:

```bash
npm run ai:index -- --confirm
```

The index uses `aiEmbedding.values` at **768 dimensions**, cosine similarity, and filter fields for product visibility, category, type, price, stock, quantity and color. Check that its status is **READY/queryable** before enabling vector search.

3. Preview a bounded batch (no queue write):

```bash
npm run ai:enqueue:all -- --kind=embed --limit=100
```

4. After reviewing the count, enqueue jobs on the staging database:

```bash
npm run ai:enqueue:all -- --confirm --kind=embed --limit=100
npm run ai:worker
```

5. Verify queued jobs become `done` in AI Catalogue Review, and check stored vectors have length 768. Only then update the root environment:

```dotenv
GAZU_AI_VECTOR_ENABLED=true
GAZU_AI_AUTO_INDEX=true
```

Restart the backend. The admin product editor now automatically queues fresh embeddings after relevant edits when auto-indexing is enabled.

### Data-safety rules

- Do not run the batch command against production until staging is verified. Batch enqueuing has an explicit `--confirm` requirement and a 5,000-product upper batch limit.
- If the selected Atlas index is unavailable, search falls back to keyword matching; it should not pretend that semantic ranking succeeded.
- Only active published products are candidates; product availability and prices are still sourced from MongoDB.
- The vector-search result count may be approximate because only a bounded candidate set is reranked. For large-scale pagination/accurate totals, the query architecture requires further tuning.

Official documentation: https://www.mongodb.com/docs/vector-search/indexes/vector-search-type/ and https://www.mongodb.com/docs/vector-search/deployment/deployment-options/

## Phase 4 — smart search acceptance

- Navigate to the existing `/shop`. Try `black oversized streetwear outfit for men under ₹3,000`.
- Verify extracted category, color and maximum budget; toggle category, price sort, shelf/grid and pagination.
- Test zero-results and out-of-stock behavior.
- If vector search is disabled or unavailable, the backend returns `mode: keyword-fallback`. If enabled and queryable with Gemini, it returns `mode: semantic`.
- Keep customer checkout, COD, authentication, reviews and admin flows unchanged.

## Run tests

```bash
npm run test:wave1
node --test backend/tests/validation.test.js backend/tests/workstreams/*.test.mjs
npm test
npm run build
cd e2e && npm ci && npx playwright install chromium && npx playwright test tests/wave1.spec.js
```

For E2E, keep a **separate staging MongoDB replica set and running backend/frontend**. The browser tests assume backend `http://localhost:8000` and frontend `http://localhost:5173`. Do not point them at production. See `WAVE1_TEST_REPORT.md` for completed checks and blockers.

## Known gaps before production

1. **No real Gemini API key was used**; live chat, live image understanding, embeddings and streaming require your configuration and acceptance tests.
2. **No live Atlas Vector Search index was created**, and no real database collections were modified. Actual semantic ranking must be verified after setup.
3. The four test categories were addressed with code and tests, but database-backed integration and Playwright browser E2E could not run in this offline, Mac-dependency-derived Linux environment. Read the test report; do not treat draft coverage as an E2E pass.
4. Existing Men's featured ordering in `Product.search()` still sorts a full result set in application memory; refactor/measure this before large catalogues.
5. The Phase 4 smart-search pipeline applies deterministic intent extraction plus vector/keyword retrieval. It is **not** an autonomous AI agent or an advanced LLM query planner.
6. Rate controls are request/token-budget proxies, **not a guaranteed cash-spend cap**. Configure billing limits in Google Cloud and measure live token usage before high traffic.
7. This is a substantial integrated prototype, not a declared production release; security review, full regression, E2E, load testing and live provider checks remain necessary.
