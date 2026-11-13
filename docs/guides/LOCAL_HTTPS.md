# Local HTTPS for GAZU (macOS)

This covers **local development only**. It does not make a deployed storefront production-secure by itself.

## Install trusted development certificates

1. Install Homebrew if needed: https://brew.sh/
2. `brew install mkcert`
3. From the GAZU project root, run `npm run https:setup`. `mkcert -install` adds a local development CA to the machine's trust store. **Only do this on a trusted personal Mac.**
4. Copy the old root `.env` to the project root (never commit it). Run `npm ci && npm run setup` once.
5. Start the **complete original store**: `npm run dev:https`.
6. Open **https://localhost:5173**. Backend health: **https://localhost:8000/api/health**. Note HTTPS, not HTTP.
7. Optional isolated staging: `npm run wave3:staging:https` and open **https://localhost:5174**. Staging uses `MONGODB_STAGING_URI` and does not alter the original database.

A `certs/` directory is created locally and is ignored by Git and deliberately omitted from the distributed ZIP. **Never send anyone your localhost private key or CA files.**

## Google sign-in

In Google Cloud Console, update **Authorized JavaScript origins** for the **correct OAuth Web client**:
- `https://localhost:5173`
- `https://localhost:5174` (if you run staging)

HTTP and HTTPS are different OAuth origins. Do not add a trailing slash. Ensure root `VITE_GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_ID` refer to the same OAuth client.

## Architecture and trust

- Browser to Vite: **HTTPS** with a localhost certificate.
- Browser to backend via Vite proxy: **HTTPS**, verified using mkcert's local root CA via `NODE_EXTRA_CA_CERTS`.
- Express backend: **HTTPS** on loopback (`127.0.0.1`).
- Mock payment-service is still **HTTP on loopback only** when launched by `dev:https`; it is never a real card processor. The backend-to-mock-service hop stays local. Do not send real financial details.
- Existing `npm run dev` is intentionally still HTTP for compatibility; use **`npm run dev:https`** for secure local development.
- HTTPS Google challenge cookies have the `Secure` flag.
- Do not set `NODE_TLS_REJECT_UNAUTHORIZED=0`, do not copy certificates into Git, and do not bypass browser certificate warnings.

## Troubleshooting

- **Certificate error**: Rerun `npm run https:setup`, restart your browser, ensure you're using `https://localhost` (not a LAN IP). If HTTPS certificates are still untrusted, check the mkcert trust store configuration.
- **OAuth origin_mismatch**: Register `https://localhost:5173` / `https://localhost:5174` on the OAuth client actually used by GAZU.
- **Proxy ECONNREFUSED**: Confirm Node backend started on 8000/8002 and no Python/RepoLens process occupies the port. Frontend may start before DB connection is ready.
- **Port occupied**: `lsof -nP -iTCP:8000 -iTCP:5173 -sTCP:LISTEN`; stop the confirmed old process from its terminal.
- **Backend request**: `curl --cacert "$(mkcert -CAROOT)/rootCA.pem" -i https://localhost:8000/api/health`.
- **Tests**: `npm run test:https && npm run verify:refactor && npm test && npm run build`.

## Production deployment

A public production storefront must use a domain with a publicly trusted certificate and HTTPS termination at a secure load balancer/reverse proxy (for example Caddy, Nginx or a managed hosting provider). Configure secure cookies, HSTS, CORS, CSP, CSRF, session expiration, secrets management, rate limiting, dependency scanning, monitoring and backup policies. Do not reuse the local mkcert key for production, and do not expose the local mock payment service publicly.
