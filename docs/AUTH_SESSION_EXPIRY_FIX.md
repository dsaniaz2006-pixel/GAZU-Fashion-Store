# GAZU — Public homepage session-expiry banner fix

## Root cause

The browser restored an expired `gazu-token` on startup. When `/auth/me` returned HTTP 401, `frontend/src/api.js` immediately dispatched `gazu-session-expired`; `AuthContext.jsx` turned that event into the red `Your session expired. Please sign in again.` notice, and `StorefrontLayout.jsx` showed it over the entire public homepage. This also occurred when customers opened the homepage rather than a protected route.

## Changes

- `frontend/src/authSessionPolicy.mjs`: only 401 responses from the currently active logged-in session can initiate a global sign-out. Startup `/auth/me` and public authentication forms own their errors locally. A late 401 from a previous token cannot log out a new login.
- `frontend/src/api.js`: applies the policy to normal fetch requests and authenticated image uploads.
- `frontend/src/context/AuthContext.jsx`: invalid stored credentials are cleared silently and the user becomes a guest. Network outages remain retryable; protected routes continue to redirect to `/account`. Email-verification handling remains distinct.
- `frontend/src/layouts/StorefrontLayout.jsx`: account-related notices are shown only on account pages, not across the homepage, shop, lookbook or other public routes.
- Added `frontend/scripts/check-auth-session.mjs` (8 dependency-free Node tests) and `frontend/src/tests/authSessionRegression.test.jsx` (two browser-model Vitest tests requiring dependencies).
- Added `npm run test:session` at both the project root and frontend level.

## Replace the old running site

**Stop the old dev server first.** On the terminal currently running GAZU, press Ctrl+C. Don't leave the old ZIP's Vite server on port 5173, otherwise the browser will continue serving the old code.

1. Extract `GAZU_Phases7-12_Expired_Session_Banner_Fixed.zip` and open its `gazu-store` directory in VS Code.
2. Restore your existing **root `.env`** to the new directory. Do not copy it into `frontend/`.
3. In the new project root run:

   ```bash
   npm ci
   npm run setup
   npm run test:session
   npm run dev
   ```

4. Go to `http://localhost:5173/` and press Cmd+Shift+R on your Mac. An expired session should clear quietly; sign in when you open Account or try an authenticated action.
5. If you still see the exact old red banner, verify the server path with `lsof -nP -iTCP:5173 -sTCP:LISTEN` and make sure the older server isn't the one still running.

## Tests

- `npm run test:session`: 8/8 passed.
- `npm run test:sitewide-liquid`: 7/7 passed.
- `npm run test:editorial-expansion`: 5/5 passed.
- `npm run test:phases:unit`: 14/14 passed.
- `npm test --prefix frontend`: **not executed in the packaging environment**, due to missing npm dependencies. This runs the new React/Vitest tests when `npm run setup` succeeds on your Mac.

This is a frontend authentication-display bug fix, not an authentication bypass. No backend endpoints, user data, product images, cart/checkout, payment settings, passwords, order numbers or database records were modified.
