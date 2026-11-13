# Authentication audit before implementation

Source: GAZU_Fashion_Store_Root_Env_Fixed.zip, 5 November 2026. This newer Phase 5 archive replaces the earlier Phase 2 work as the implementation base. Blueprint checked against the previously extracted local text; its original WhatsApp temporary PDF path no longer exists.

| Requirement | Existing file | Current status | Action required | Risk |
| --- | --- | --- | --- | --- |
| Manual registration/login | routes/auth.js | Working | Preserve email login, add confirmation UI and Google-only guard | High |
| Registration OTP | services/emailOtp.js, models/EmailOtp.js | Working | Reuse five-minute HMAC codes, five attempts, cooldown/send cap; issue session on successful activation | High |
| Google identity | No integration source | Missing | Official GIS button, nonce-bound server challenge, google-auth-library verification | High |
| User providers/status | models/User.js | Partially implemented | Optional local password, unique Google sub, disabled state and session version; retain emailVerified and IDs | High |
| Account linking | No route | Missing | Existing session plus password reauthentication plus verified same-email Google credential; no automatic merge | High |
| Username login | No field/index/UI | Missing | Keep explicitly email-only login; username optional and not added | Low |
| Password recovery | All auth/routes/models inspected | Missing | Add expiring one-time protected recovery code, per-account/IP limits and session invalidation | High |
| SMTP | services/emailService.js | Partially implemented | Preserve transport/root config; check SMTP acceptance, safe diagnostics and branded fallback templates | High |
| AuthContext/guards | frontend/context/AuthContext.jsx, routes/ | Working | Reuse token/session flow, Google logout auto-select handling, pending verification UI | High |
| Account UI | pages/Account.jsx | Partially implemented | Real Google button, confirmation/show-password controls, recovery/settings; retain existing page design | Medium |
| Root environment | config/env.js, vite.config.js | Partially implemented | Derive backend GOOGLE_CLIENT_ID from root VITE_GOOGLE_CLIENT_ID; no new .env files | High |
| Docker | Compose, frontend/Dockerfile | Partially implemented | Existing client ID build arg/API mapping retained; remove unused client-secret configuration | Medium |
| Logs | config/logger.js, requestLogger.js | Working | Keep request IDs and redact credential/nonce/recovery fields | High |
| Orders/cart/reviews/cache | Existing models/routes/services/tests | Working in prior delivery, not verified in this run yet | Preserve source and run regressions | High |
| Real Google/Gmail/Docker | External services | Not verified | Test isolated mocks locally; document live checks honestly | Medium |

## State design

Existing emailVerified remains the activation flag. A new optional disabled flag is independent of provider identity. Providers are derived from passwordHash/googleSub rather than storing a second potentially inconsistent provider list. Google sub is reserved on a pending account but cannot authenticate until GAZU verification succeeds. No random password is generated. Existing accounts keep their Mongo ID, role, cart and references.

New Google identity -> pending -> existing email OTP -> active session. Verified linked identity -> direct session. Existing unlinked email -> conflict with instructions to sign in and link; never merge. Disabled -> deny sign-in and protected access. Recovery for active users (including Google-only users setting a local password) -> single-use code -> password update and session-version increment -> fresh sign-in. No unlink endpoint is needed or introduced.

## Plan

Verify baseline, add Google challenge/verifier, extend account state without migration, integrate first-time OTP and returning sign-in, add explicit password-confirmed linking and recovery, extend the existing Account UI, test isolated flows and regressions, document and package. No live database, real email, private environment read, seed or migration is needed.
