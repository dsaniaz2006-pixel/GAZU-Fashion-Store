# Phase 6 source changes

| File | Action | Reason |
|---|---|---|
| `payment-service/src/app.js` | Reworked | Private validated, authenticated and durable idempotent simulation decisions, safe errors, trace IDs, health |
| `payment-service/src/server.js` | Updated | Root environment and graceful stop |
| `payment-service/tests/app.test.js` | Expanded | Service HTTP auth, repeatability, conflict, concurrency, trace, negative routing tests |
| `backend/src/models/PaymentAttempt.js` | Added | Durable user-scoped unique checkout attempt state and reconciliation record |
| `backend/src/services/mockPayment.js` | Added | Secure payment orchestration, server-authoritative quote, lease, recovery, notification |
| `backend/src/routes/payments.js` | Updated | Reused authenticated API contract, delegates mock requests to orchestrator |
| `backend/src/services/checkout.js` | Updated | Optional cart/total snapshot checks inside existing transaction; COD unchanged |
| `backend/src/server.js` | Updated | Initialize unique PaymentAttempt index |
| `backend/tests/api.test.js` | Updated | Isolated payment HTTP service, mock payment regression, retry, outage/COD tests |
| `frontend/nginx.conf` | Updated | Internal static SPA serving only; gateway performs API routing |
| `gateway/nginx.conf`, `gateway/Dockerfile`, `gateway/.dockerignore` | Reworked/added | Single public nginx gateway and secure origin routing |
| `docker-compose.yml` | Updated | Internal payment service, public gateway, health checks and persistent payment journal |
| `package.json` | Updated | Starts payment service in existing root `npm run dev` |
| `.env.example` | Updated | Payment URL, secret, timeout, persistent journal examples |
| `.gitignore`, `payment-service/.dockerignore` | Updated | Exclude payment journal and secret files |
| `.github/workflows/ci.yml` | Reworked | Two nondeploy CI jobs for services, build and isolated Docker smoke |
| `scripts/verify-phase6.sh` | Added | Non-destructive gateway and services smoke verification |
| `docs/PHASE6*.md`, `docs/PAYMENT_SERVICE.md`, `docs/GATEWAY.md`, `docs/CI_CD.md` | Added | Phase 6 architecture and runbooks |
| `docs/TESTING.md`, `README.md`, `docs/ARCHITECTURE.md`, `docs/API.md` | Appended | Phase 6 configuration and status |

No new npm packages were introduced; previous feature code was retained.
