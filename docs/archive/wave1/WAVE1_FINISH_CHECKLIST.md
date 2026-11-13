# GAZU Wave 1 — final acceptance on your Mac

**Scope:** safely finish live checks against `gazu_ai_staging`. The original `MONGODB_URI` is preserved and must not be changed. This package contains no credentials. All commands run from `gazu-store-wave1/`.

## Before starting

Confirm the root `.env` contains your own working `GEMINI_API_KEY`, `GAZU_AI_PROVIDER=gemini`, `GAZU_AI_MODEL=gemini-3.1-flash-lite`, `GAZU_AI_EMBEDDING_MODEL=gemini-embedding-2-preview`, and `MONGODB_STAGING_URI` pointing explicitly to `/gazu_ai_staging`. Keep `GAZU_AI_VECTOR_ENABLED=false` and `GAZU_AI_AUTO_INDEX=false` for the original website until switching it intentionally. Ensure `JWT_SECRET` and the other app configuration remain present.

The user's previous live checks confirmed three successful embedding jobs and three stored 768-element arrays; Atlas showed index `gazu_product_vector_v1` READY. Those live checks were performed on the user's Mac, **not in this packaging environment**.

## Step A: Staging status and semantic retrieval

```bash
npm run ai:staging:status
npm run ai:staging:semantic
```

The staging runner explicitly loads `MONGODB_STAGING_URI`, rejects any URI not targeting `/gazu_ai_staging`, and validates the **actual** connected database name. It does not rewrite `.env`.

`semantic` must print `SEMANTIC VERIFICATION PASSED` and at least one relevant product. A `keyword-fallback` result, 429, 503, or empty results is not a pass. Report the terminal output with secrets redacted.

## Step B: Queue, process and review AI tagging

1. Queue at most three tag jobs in staging:

```bash
npm run ai:staging:queue-tags
```

2. Start the staging-only worker in another terminal:

```bash
npm run ai:staging:worker
```

3. Return to the first terminal and rerun `npm run ai:staging:status`. Verify that the tag jobs are done; then stop the worker with Ctrl+C.
4. To verify admin review with the website, run a local development server explicitly targeting staging in a **dedicated terminal** rather than starting a normal production process. IMPORTANT: that server will use staging users/sessions, not your live store accounts. Create an appropriate staging admin through a reviewed development-only path if needed. Verify pending drafts can be approved and saved; reject a separate draft and confirm no unintended product fields change.

## Step C: Full regression and browser tests

```bash
npm run test:wave1
npm test
npm run build
```

The browser E2E scenarios are in `e2e/tests/wave1.spec.js`. Only run them against isolated staging application instances; they require the real services and correct test credentials. Previous Linux checks did not include working native Rollup dependencies or a MongoDB memory-server binary; neither suite was proven successful on that Linux run.

## Completion gate

Wave 1 is **not 100% complete** until all of the following have evidence: staging semantic mode with relevant results, real AI tagging and approval, full backend/frontend regression passing, browser E2E passing, and original storefront smoke tests passing. Do not report 100% from code existence alone.

## Troubleshooting

- `Cannot find package mongoose`: run `npm run setup` in the project root.
- `No valid embeddings`: inspect `gazu_ai_staging.products`, not the original database.
- `keyword-fallback`: verify `GAZU_AI_PROVIDER=gemini`, the current model values, Atlas index READY, active published products, and API quota; avoid excessive retries.
- `429` / `503`: stop automatic retries, review Gemini rate limits and model availability, and retry later using a controlled backoff. Do not activate billing just to troubleshoot.
