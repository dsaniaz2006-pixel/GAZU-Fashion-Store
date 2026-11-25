> **Render Free keep-alive:** A scheduled GitHub Actions workflow pings the public GAZU health endpoint every five minutes, with retry checks for cold starts. See [the setup and reliability notes](docs/RENDER_KEEPALIVE.md). This is best-effort on Free compute; a paid Render plan is required for guaranteed no-spin-down behaviour.

> **Wave 1–3 compatibility-first structural refactor:** See [the current folder architecture](docs/GAZU_REFACTOR_ARCHITECTURE.md) and [file-level changes](docs/GAZU_REFACTOR_CHANGELOG.md). API/state layers were modularized and Wave 3 routes split without changing published URLs or visual design. Run `npm run verify:refactor` and the full dependency-based tests on your Mac before deployment.

> **Wave 1 AI workstream update (Phases 0–4):** See [WAVE1_IMPLEMENTATION_GUIDE.md](docs/archive/wave1/WAVE1_IMPLEMENTATION_GUIDE.md) and [WAVE1_TEST_REPORT.md](docs/archive/wave1/WAVE1_TEST_REPORT.md). No live API keys or MongoDB data are bundled.

# GAZU Fashion Store

React/Express/MongoDB fashion store with customer/admin accounts, products, reviews, carts, transaction-safe checkout, optional Razorpay payments, professional GAZU order numbers, email notifications, Redis caching and Docker support.

The latest update adds Google Identity Services, mandatory GAZU OTP for first-time Google users, direct returning Google login, explicit account linking and password recovery. See [the complete authentication guide](docs/AUTH_UPGRADE.md), [file-by-file changes](docs/AUTH_UPGRADE_CHANGES.md), and [completion checklist](docs/AUTH_UPGRADE_CHECKLIST.md).

## Current documentation index (Waves 1–3)

- [Architecture](docs/ARCHITECTURE.md) and [current refactor architecture](docs/GAZU_REFACTOR_ARCHITECTURE.md)
- [API contracts](docs/API.md)
- [Database models and staging safety](docs/DATABASE.md)
- [Environment configuration](docs/ENVIRONMENT.md)
- [Test commands and procedures](docs/TESTING.md)
- [Wave 1–3 AI feature map](docs/AI_FEATURES.md)
- [Project changelog](CHANGELOG.md)

Historical implementation notes are retained in their original locations for traceability.

## Run locally on macOS

Use Node.js 22.12+. Keep your existing **single root `.env`** and its database/SMTP settings. Your root `VITE_GOOGLE_CLIENT_ID` supplies both React and backend Google audience verification. No Google Client Secret or additional `.env` file is needed. The root `.env.example` contains placeholders for fresh installations only; do not overwrite your existing file.

```sh
npm ci
npm run setup
npm run env:check
npm run dev
```

Open http://localhost:5173. No seed or database migration is needed for this upgrade. MongoDB transactions require Atlas or a replica set. Your private environment and live data are not in this ZIP.

## Docker

Keep using the existing Compose project name/folder to retain your intended named volumes:

```sh
docker compose config --quiet
docker compose up -d --build
```

Open http://localhost:8080. Client ID changes require rebuilding the frontend image; API configuration changes require recreating the API container. Docker retains its separate Mongo replica set, Redis, uploads and volumes. Do not run `down -v` on your store. Phase 6 gateway/service deployment is not part of this update.

## Tests and acceptance

```sh
npm test
node --test scripts/*.test.mjs
npm run build
```

Final results: 73 backend, 43 frontend, 1 payment-service and 6 environment tests passed. Production build passed. Root development browser flows and an isolated Docker stack were verified. Google certificates/credentials and SMTP were simulated in tests; live Google chooser and Gmail inbox delivery still require the [manual acceptance checklist](docs/AUTH_UPGRADE.md). Tests use disposable databases, never your application database.

## Documentation

- [Authentication architecture, Google settings, security and Mac setup](docs/AUTH_UPGRADE.md)
- [API](docs/API.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Testing](docs/TESTING.md)
- [Docker Phase 5](docs/PHASE5.md)
- [Single-root environment](docs/ROOT_ENV_MIGRATION.md)
- [Deployment](docs/DEPLOYMENT.md)

Historical phase documents remain for reference; the current authentication guide supersedes their older environment/password-recovery statements. Username login and unlinking are optional and not implemented. No production deployment or delivery-status-email feature is claimed. Razorpay checkout is available when credentials are configured.

## Phase 6 — local gateway and isolated payment simulation

Use one **root** `.env`. `npm run dev` starts backend, frontend and the local mock payment simulator. For online test or live checkout, configure `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in that private file; the backend verifies the payment before placing an order. `docker compose up -d --build` starts the nginx public gateway on `http://localhost:8080` plus internal web/API/payment/Redis/Mongo services and passes the Razorpay credentials only to the API container. See `docs/PAYMENT_SERVICE.md`, `docs/PHASE6.md`, `docs/PHASE6_CHECKLIST.md`, and `docs/CI_CD.md`. Do not use `docker compose down -v` during ordinary work.

## Restore the original three demo products (remove former Men's catalogue from the shop)

The bundled source includes only **Relaxed Cotton Tee**, **Soft Knit Pullover**, and **Structured Tote**. If you previously imported the 75 Men's products into MongoDB, see [docs/THREE_PRODUCT_CLEANUP.md](docs/THREE_PRODUCT_CLEANUP.md). The cleanup is a deliberate, preview-first operation; it archives earlier items without deleting orders or resetting the existing demo stock. It is not run by `npm run dev` or Docker startup.

## New Men clothing additions (13 Topwear + 1 Bottomwear)

See [MENS_CLOTHING_IMPORT.md](docs/catalogue/MENS_CLOTHING_IMPORT.md) for the product image inventory, safe Atlas importer, and local setup. The earlier Footwear additions remain intact.

## New Men Collections

See [MENS_FINAL_IMPORT.md](docs/catalogue/MENS_FINAL_IMPORT.md) for the new Bottomwear, Winterwear and Accessories products, price-pending rules and the safe Atlas preview/apply commands.


## Cinematic three-model hero (frontend Phase 2)

The homepage now connects the existing logo fragment introduction with a seamless Women–Men–Kids photo campaign. See [`docs/GAZU_CINEMATIC_MODEL_HERO.md`](docs/GAZU_CINEMATIC_MODEL_HERO.md) for animation stages, image-source limitations, accessibility and replay instructions.


### THIS SUMMER rolling gallery (Phase 3)

The homepage now uses the reference-inspired, right-moving GSAP fashion-photo strip under the existing hero. See [`docs/GAZU_THIS_SUMMER_GALLERY.md`](docs/GAZU_THIS_SUMMER_GALLERY.md) for source-video measurements, image mapping, accessibility behavior and verification. Run `npm run test:summer` for the standalone tests.


### Phase 4 — DRESS LIKE animation

The homepage now uses the original GAZU editorial photo in the reference-inspired **DRESS LIKE** section, revealed on scroll. Phases 1–4 discrete animations share a 0.7-second duration; the continuous THIS SUMMER track keeps its original speed.

```bash
npm run test:dress-like
npm run dev
```

See [Phase 4 DRESS LIKE implementation and testing guide](docs/GAZU_DRESS_LIKE_PHASE4.md).

### Phase 5 — Editorial hero and fashion category cards

The cinematic Women/Men/Kids hero now rises from a white intro using 0.7-second discrete GSAP reveals. Three portrait collection links beneath DRESS LIKE have independent grayscale/white-label hover and focus transitions. The existing shop, authentication, cart and backend are unchanged. See [`docs/GAZU_PHASE5_EDITORIAL_CATEGORIES.md`](docs/GAZU_PHASE5_EDITORIAL_CATEGORIES.md) for details and tests.


## Wave 2 (Phases 5–9) — Intelligent fashion shopping

See [`WAVE2_6_WORKSTREAMS_README.md`](docs/archive/wave2/WAVE2_6_WORKSTREAMS_README.md) for the five feature workstreams, Agent 6 integration, API routes, staging-only preview and unit/integration/E2E/TDD testing instructions. `npm run test:wave2` is dependency-free. `npm run wave2:staging` launches an isolated preview on ports 8002 and 5174. Do not run against the original MongoDB database.

## Wave 3 — Customer & Business Intelligence

See [`WAVE3_6_SUBAGENTS_README.md`](docs/archive/wave3/WAVE3_6_SUBAGENTS_README.md) and [`WAVE3_VERIFICATION_REPORT.md`](docs/archive/wave3/WAVE3_VERIFICATION_REPORT.md). Five separate feature workstreams were integrated: verified size fit, authenticated order support, multilingual/voice chat, admin AI review and forecasting. The staging preview uses `npm run wave3:staging`. Unit/TDD, HTTP integration, React component and Playwright E2E test files are included; run the dependency-based suites on your Mac before claiming completion.


## Historical documentation

Older wave reports, catalogue import notes, and change notes are organized under [Documentation archive](docs/DOCUMENTATION_INDEX.md). The project root intentionally keeps only `README.md` and `CHANGELOG.md`.

## Secure local HTTPS development

On macOS: `brew install mkcert`, then `npm run https:setup` and `npm run dev:https`. Full guide: [Local HTTPS](docs/guides/LOCAL_HTTPS.md).
