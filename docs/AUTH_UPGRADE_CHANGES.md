# Authentication upgrade: file-by-file changes

Source comparison: GAZU_Fashion_Store_Root_Env_Fixed.zip. Only authentication, its configuration, tests and documentation were changed. Product/order/review/cart/checkout/cache application files, React routing/layouts, payment service source, Dockerfiles, Mongo initialization and existing data volume definitions remain unchanged. No source files were deleted. Existing uploaded asset retained; test uploads, real environment files, dependencies, Git metadata and build artifacts are excluded.

| File | Change | Purpose |
| --- | --- | --- |
| `.env.example` | Modified | Document single public Client ID and remove unused Client Secret placeholder. |
| `EMAIL_SETUP.md` | Modified | Replace obsolete backend environment instructions with single-root SMTP guidance. |
| `README.md` | Modified | Current authentication setup, tested results, Docker and limitations; remove obsolete setup claims. |
| `backend/.env.example` | Modified | Convert legacy service template to a root-only pointer; no additional environment file required. |
| `backend/package-lock.json` | Modified | Lock official Google verifier and its transitive dependencies. |
| `backend/package.json` | Modified | Add official google-auth-library dependency, no other direct dependency changes. |
| `backend/src/config/env.js` | Modified | Derive backend audience from root VITE_GOOGLE_CLIENT_ID and reject conflicting IDs. |
| `backend/src/config/logger.js` | Modified | Redact Google credentials, nonce, recovery state and provider-subject fields. |
| `backend/src/middleware/auth.js` | Modified | Validate subject shape; enforce disabled accounts and session-version revocation; preserve roles/OTP guard. |
| `backend/src/models/GoogleChallenge.js` | Added | Add expiring browser-binding hashes/nonces and TTL cleanup for Google sign-in. |
| `backend/src/models/User.js` | Modified | Optional local password for Google-only accounts, unique partial Google subject index, disabled/session/recovery metadata. |
| `backend/src/routes/auth.js` | Modified | Preserve manual routes; add Google challenge/login/link/methods and recovery routes; issue session after OTP activation; no-store responses. |
| `backend/src/server.js` | Modified | Await GoogleChallenge initialization before accepting requests. |
| `backend/src/services/authSession.js` | Added | Reuse one public-user/JWT formatter with session-version claim. |
| `backend/src/services/emailOtp.js` | Modified | Deny disabled activation and return the atomically verified user for session issuance; preserve OTP controls. |
| `backend/src/services/emailService.js` | Modified | Retain SMTP/root configuration; add escaped HTML fallback and recipient-acceptance validation. |
| `backend/src/services/googleIdentity.js` | Added | Official ID-token verification, required claims, exact-Origin JSON checks, HttpOnly binding and atomic nonce consumption. |
| `backend/src/services/passwordRecovery.js` | Added | Purpose-protected recovery codes, limits, one-time transactional reset, session revocation and security notification. |
| `backend/tests/authUpgrade.test.js` | Added | 26 Google, recovery, linking, concurrency, signature, SMTP and redaction regression tests with isolated fixtures. |
| `docker-compose.yml` | Modified | Remove unused Google Client Secret injection; existing single-ID mapping and isolated services retained. |
| `docs/API.md` | Modified | Document auth endpoint schemas/access/results/errors and additive activation session response. |
| `docs/ARCHITECTURE.md` | Modified | Link current authentication architecture and preserve historical phase records. |
| `docs/AUTH_UPGRADE.md` | Added | Full architecture, root configuration, Mac/Docker setup, security, tests, manual acceptance and Phase 6 readiness. |
| `docs/AUTH_UPGRADE_AUDIT.md` | Added | Pre-implementation source audit, state design and incremental plan. |
| `docs/AUTH_UPGRADE_CHANGES.md` | Added | This file-by-file comparison against the newest supplied ZIP. |
| `docs/AUTH_UPGRADE_CHECKLIST.md` | Added | Implementation/testing status with explicit live-service limitations. |
| `docs/CHANGES.md` | Modified | Link the current authentication change report. |
| `docs/EMAIL_OTP.md` | Modified | Correct root configuration and document additive activation session behavior. |
| `docs/ROOT_ENV_MIGRATION.md` | Modified | Replace obsolete absent-Google/Client-Secret guidance with current single-ID design. |
| `docs/TESTING.md` | Modified | Link final authentication test record without conflating historical results. |
| `docs/auth-screenshots/account-security.png` | Added | Browser verification screenshot using simulated GIS and disposable test data, not live Google proof. |
| `docs/auth-screenshots/google-otp.png` | Added | Browser verification screenshot using simulated GIS and disposable test data, not live Google proof. |
| `docs/auth-screenshots/recovery-mobile.png` | Added | Browser verification screenshot using simulated GIS and disposable test data, not live Google proof. |
| `docs/auth-screenshots/sign-in.png` | Added | Browser verification screenshot using simulated GIS and disposable test data, not live Google proof. |
| `frontend/.env.example` | Modified | Convert legacy service template to a root-only pointer. |
| `frontend/src/api.js` | Modified | Do not expire a valid GAZU session on Google/link credential errors. |
| `frontend/src/components/AccountSecurity.jsx` | Added | Provider availability, password-confirmed linking and password setup/change entry. |
| `frontend/src/components/GoogleSignIn.jsx` | Added | Load real GIS script/button, bind server nonce, handle loading/retry/duplicate callback without persisting credentials. |
| `frontend/src/components/PasswordRecovery.jsx` | Added | Controlled request/code/reset UI, confirmation, show/hide and recoverable errors. |
| `frontend/src/context/AuthContext.jsx` | Modified | Clear pending cooldown on login and disable Google automatic selection on logout. |
| `frontend/src/pages/Account.jsx` | Modified | Integrate Google, session on OTP, confirmation/show-password, recovery and settings; persist only pending email/cooldown. |
| `frontend/src/styles.css` | Modified | Small auth-only monochrome layout/focus additions; storefront styles retained. |
| `frontend/src/tests/authUpgrade.test.jsx` | Added | 8 auth UI tests for GIS callbacks, nonce, errors, activation, confirmation, recovery and cooldown. |
| `frontend/src/tests/otp.test.jsx` | Modified | Supply the new mandatory confirmation field in registration UI fixtures; preserve existing scenarios. |
| `payment-service/.env.example` | Modified | Convert legacy service template to a root-only pointer. |
| `scripts/auth-env.test.mjs` | Added | 3 tests for public-to-server audience mapping, mismatch rejection and Compose mapping. |
