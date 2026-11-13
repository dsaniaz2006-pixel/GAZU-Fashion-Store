# GAZU Phases 7–12 development candidate

Features have been integrated into the existing source tree without applying any database migration or destroying any user data.

## Run locally
Restore your previous root `.env` to the project folder (excluded from this ZIP). Run `npm ci && npm run setup && npm run env:check && npm run dev`.

## QA
- `npm run test:phases:unit`
- `node --test scripts/phase7-12-cross-domain.test.mjs scripts/phase7-12-imports.test.mjs`
- `npm test` (requires dependencies and MongoMemory test binary)
- `npm run build`
- Playwright: see `docs/PHASES_7_12_TESTING.md`

## Features / pages
`/shop-the-look`, `/style-finder`, `/launches`, `/account/profile`, `/admin/operations`, `/admin/marketing`, `/admin/staff`. Size-stock and publication status are administered through Edit Product.

## Important
Do NOT use `docker compose down -v`, reset Atlas collections, or create gift codes without business approval. Existing products have no size variants until an administrator assigns verified sizes and quantities. The original stock counts are preserved until then. See `docs/workstream-handoffs/agent-7-integration.md`.
