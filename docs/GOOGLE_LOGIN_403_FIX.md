# Google login challenge 403 — targeted fix

## Root cause

`POST /api/auth/google/challenge` previously required the request Origin to match `CLIENT_ORIGIN` exactly. If the single root `.env` had `CLIENT_ORIGIN=http://localhost:8080` (Docker) while the developer opened Vite at `http://localhost:5173`, the browser correctly sent an Origin that did not match. The API returned HTTP 403 with `Sign-in must start from the GAZU website.`

## Implementation

- Added `backend/src/config/allowedOrigins.js` with an exact-match origin policy shared by the Google challenge handler and Express CORS.
- In `NODE_ENV=development`, permits the configured `CLIENT_ORIGIN` and the local Vite `http://localhost:${FRONTEND_PORT || 5173}`. This supports switching between the Vite and Docker sites without replacing the root environment file.
- In production, permits only the configured `CLIENT_ORIGIN`. No wildcard origin acceptance and no removal of the JSON request check, nonce, one-time challenge, cookies or Google ID-token verification.
- Added `backend/tests/googleOriginPolicy.test.js` for local, Docker and production behavior.

## Run

1. Extract into a separate folder and restore your private root `.env` (do not share credentials).
2. Run `npm ci` and `npm run setup`.
3. Run `npm run env:check` then `npm run dev`.
4. Open `http://localhost:5173/account`. Confirm the POST `/api/auth/google/challenge` is HTTP 200 and the real Google button appears.
5. If HTTP 403 remains, check that the browser's origin and backend `NODE_ENV` / `CLIENT_ORIGIN` are correct, and ensure you restarted Express after editing configuration.
6. Run `node --test backend/tests/googleOriginPolicy.test.js`, the backend suite, frontend suite, and frontend production build.
7. Verify Google Cloud authorized JavaScript origins separately (5173 and 8080).

## Limitations

The patch fixes the source-level origin mismatch shown in the screenshots. Real Google account chooser, email OTP delivery and live MongoDB authentication were not verified in this build environment. The user must test with their own credentials and services.
