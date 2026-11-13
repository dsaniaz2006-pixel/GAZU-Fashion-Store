# Codex multi-agent orchestration prompt — GAZU Wave 1

Use this prompt **only in a Codex environment that supports launching distinct subagents**. The present GAZU ZIP already contains an integrated Wave 1 prototype. Your task is to independently review, complete, and verify it, rather than blindly rewrite passing work.

You are the lead software engineer and agent orchestrator for `gazu-store`. Use the supplied integrated GAZU ZIP. **Never read the prior uploaded fake `.env` as truth. Do not touch the user's real production credentials.** Preserve checkout, roles, COD/mock payments, SMTP/OTP, product displays, existing hero animations, liquid navigation, grayscale/color hover behavior, existing Mongo data and one-root-`.env` architecture.

## Absolute engineering rules

1. Create an isolated Git worktree/branch for each of Agents 1–5; Agents 6 and 7 coordinate integration and documentation. Assign file ownership in advance to avoid conflicting edits.
2. No destructive catalogue migration, real payments, or production index creation without explicit approval. Use a disposable Mongo replica set/staging Atlas, mock Gemini provider in tests, no secrets in commits.
3. For each code-producing agent, run four gates: **Unit** (pure logic, edge cases), **Integration** (API/Mongo/storage/provider mocked or staging), **E2E** (real browser shopping/admin flows against staging), **TDD** (write a failing acceptance test first and show red→green evidence). Authenticated routes must test role denials and resource ownership.
4. Do not mark a gate passed simply because a test file was written. If a real service or test runner is unavailable, mark BLOCKED and provide exact local reproduction steps. Never manufacture success counts.
5. Every agent produces a handoff with branch/commit, file manifest, test logs, API contracts, migrations (if any), security notes, breaking changes and unresolved risks. Agent 6 must merge only verified changes.
6. Use product database records as source of truth for availability, publication, price, SKU, variant stock and checkout. AI output is untrusted and may not mutate these attributes.
7. No model key or secret in frontend. Implement request limits, budget enforcement, prompt-injection defenses, safe error handling, metrics, and graceful fallback.

## Agent 1 — Project readiness (Phase 0)

Study `Product.js`, `products.js`, `seed.js`, catalogue scripts, variant/inventory domain, stock rules, uploads, category navigation, cart, checkout, orders and the existing tests. Implement a **read-only** audit of catalogue IDs, duplicate SKUs/names, inactive/draft/demo products, categories/subcategories, image files, price paise, quantities/variants, size availability and publication status. Output structured JSON and a review plan. Add migration preview mode that requires manual approval to apply; do **not** delete or silently mutate. Establish baseline test and performance commands. TDD first; unit+integration+browser E2E. Deliver handoff to Agent 6.

## Agent 2 — Core AI infrastructure (Phase 1)

Review `backend/src/app.js`, auth/roles, Redis/cache, logging, config, Docker, and existing root env convention. Implement configurable Gemini/mock provider, separate text/image/embedding interfaces, bounded input/output, JSON validation, protected streaming, read-only tool allowlist, prompt registry, request/token budgets, usage logs, resilient errors, Mongo-backed job queue with retry/leases, independent worker, and safe fallback. Provide no-key CI mocks and provider contract tests. TDD first; unit+integration+browser E2E. Deliver handoff to Agent 6.

## Agent 3 — Product understanding/tagging (Phase 2)

Study Product, image storage and admin product editor. Implement optional local image analysis and text-assisted catalogue tagging for category, type, color, pattern, style, occasion, description and alt text. Uncertain facts must be flagged. No arbitrary URLs/SSRF, no fabricated materials or sizes, no automatic publishing. Store per-product versioned drafts, approve/reject in admin, reject stale drafts and audit decisions. Ensure real labels come from verified product context and model fields are schema-constrained. TDD first; unit+integration+browser E2E. Deliver handoff to Agent 6.

## Agent 4 — Embeddings & vector search (Phase 3)

Study Product schema, MongoDB deployment/Atlas compatibility, indexing and queues. Use one explicitly chosen embedding model/dimension, verified for current Gemini API. Text+local-image embeddings, fingerprints, incremental change detection, batch queue, retry/quota awareness, visibility/status/category/price filters, index creation definitions for both Atlas UI and supported driver. Never create production indexes automatically. Implement no-index fallback with safe lexical retrieval and monitor index readiness. TDD first; unit+integration+browser E2E including live staging Atlas when configured. Deliver handoff to Agent 6.

## Agent 5 — Smart shopping search (Phase 4)

Study Shop.jsx, Header.jsx, ProductGrid/Shelf, query params, categories, sorting, pagination and backend Product.search. Integrate natural language to shopping intent (category, color, price INR to paise, style, occasion), semantic/hybrid ranking, stock and publication filters, no hallucinated products, typo/synonyms/no-results handling. Preserve original shelf/grid, query URL state, sorting and mobile UI. Ensure search works without Gemini/Atlas via keyword fallback. TDD first; unit+integration+browser E2E. Deliver handoff to Agent 6.

## Agent 6 — Integration & release gate (critical)

Merge branches from Agents 1–5 in dependency order: Phase0 audit first, Phase1 contracts second; then Phase2/3 with shared models; Phase4 last. Resolve schema/routes/frontend file conflicts explicitly, verify root `.env.example` and Docker, preserve existing endpoints/animations, re-run backend unit+integration, frontend Vitest/build, payment service regression, full Playwright staging flows, lint/syntax, security checks and functional tests. Confirm each agent's tests on the **merged** tree, not just its own branch. Provide an integrated source ZIP excluding `.env`, `node_modules`, `dist`, credentials, OS artifacts, Mongo volumes and uploaded secrets. Output a truthful pass/block/fail report; no invented deployment claims.

## Agent 7 — External-setup guide and independent reviewer

Research current official Gemini AI Studio API-key setup and auth-key requirements, model availability/quotas/billing; current MongoDB Atlas Vector Search tier/role/index creation requirements; local Docker vs Atlas limitations. Produce a Mac beginner guide in correct order: install dependencies; confirm root env; run baseline; stage DB; create Gemini key; test model; run worker; review tags; create index; batch embed; enable semantic; test search and regressions. Never ask for actual keys/passwords to be pasted into chat. Include exact commands and expected outputs, safe rollback and troubleshooting for 401/403/429, wrong index dimensions, nonqueryable index, missing Mongo replica set and native npm build deps. No external setup marked done until verified by the user.

## Final coordinator acceptance checklist

- Each agent handoff present; all paths and contracts reconciled.
- Red→green test logs retained for each feature's TDD cycle.
- Unit, HTTP integration, full staging database integration, Playwright E2E and build report accurately distinguishes PASSED/BLOCKED/FAILED.
- Source ZIP works after a fresh `npm ci`, `npm run setup`, `npm run dev` on macOS and has no real keys.
- Shopping preserves authentication, orders, cart, payment and premium visual identity.
- AI routes have authorization, spending controls, reliable fallbacks and data privacy.
- Phase 2 tags require admin approval; Phase 3 index creation requires explicit staging setup; Phase 4 works without cloud AI.
- Agent 7 user guide is included and names only the external actions the user really needs to perform.
