# GAZU Environment Configuration

## One root `.env`

The project uses a single **private** `.env` in the repository root and commits only `.env.example`. The backend loads this file through `backend/src/config/env.js`; Vite reads approved public `VITE_` variables via its configuration. Do not create a public `frontend/.env` containing server credentials.

Initialize a fresh installation by copying the example and supplying your own values. **Do not overwrite an already configured `.env`.**

```bash
cp .env.example .env
npm run env:check
```

Do not paste or commit real values of `MONGODB_URI`, `MONGODB_STAGING_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `EMAIL_PASS`, `PAYMENT_SERVICE_SECRET` or `RAZORPAY_KEY_SECRET`.

## Configuration reference

| Setting | Meaning |
| --- | --- |
| `NODE_ENV`, `PORT`, `FRONTEND_PORT` | Runtime mode and local development ports (default API `8000`, Vite `5173`) |
| `API_PROXY_TARGET`, `VITE_API_URL` | Vite API proxy destination and browser API base (default `/api`) |
| `CLIENT_ORIGIN` | Browser origin accepted by the backend's CORS/Google flow |
| `GAZU_DB_MODE`, `MONGODB_URI` | Database mode and normal store database connection |
| `MONGODB_STAGING_URI` | Separate limited-permission AI staging database |
| `JWT_SECRET`, `OTP_SECRET` | Authentication and verification secrets |
| `VITE_GOOGLE_CLIENT_ID` | Public Google **web** OAuth client ID; the backend checks its audience |
| `EMAIL_SERVICE`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` | Server-side transactional email settings |
| `PAYMENT_SERVICE_URL`, `PAYMENT_SERVICE_SECRET` | Internal mock payment service connection and shared secret |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Server-side Razorpay test/live credentials; only the public key ID is returned to checkout |
| `REDIS_URL`, `CACHE_ENABLED` | Optional cache configuration |
| `GAZU_AI_PROVIDER`, `GEMINI_API_KEY`, `GAZU_AI_MODEL` | AI text provider settings; key is server-only |
| `GAZU_AI_EMBEDDING_MODEL`, `GAZU_AI_VECTOR_ENABLED`, `GAZU_AI_AUTO_INDEX` | Embedding/vector features and auto-index guard |

The complete set and intended defaults are in the root `.env.example`; avoid adding new settings to prose without updating that file and checking all code readers.

For Razorpay, set both `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in the private root `.env`. The backend creates orders, verifies the payment signature and confirms/captures the payment with Razorpay before creating a paid store order. Never prefix the secret with `VITE_` or place either value in frontend code. If either setting is absent, Razorpay is not offered and COD remains available.

## Typical modes

- **Local full site:** `npm run dev` from the project root; site `http://localhost:5173`, API `http://localhost:8000`.
- **Wave 3 AI staging:** `npm run wave3:staging`; site `http://localhost:5174`, API typically `http://localhost:8002`, and a validated staging database URL. The launcher requires root `.env`.
- **Docker:** `docker compose` uses its separate Compose-provisioned database and ports as documented in `docs/DEPLOYMENT.md`; never point a local/production Atlas connection at an unintended Compose service.

## Google sign-in

A Google web OAuth client used at `http://localhost:5173` and `http://localhost:5174` needs those **exact Authorized JavaScript origins** registered in Google Cloud. The client ID in `VITE_GOOGLE_CLIENT_ID` must match the configured client. An `origin_mismatch` error occurs in Google's origin check; a local HTTP `405` requires checking the correct Node server and proxy instead. Avoid exposing any client secrets in the browser.

## Validation and safety

```bash
npm run env:check
curl -i http://localhost:8000/api/health
```

A `GET /api/health` response identifies the GAZU backend; a wrong port can cause 401/405/ECONNREFUSED errors if another project uses it. Do not silently modify existing database URLs to resolve frontend issues.

See `docs/ROOT_ENV_MIGRATION.md`, `docs/DEPLOYMENT.md` and `.env.example` for additional details.
