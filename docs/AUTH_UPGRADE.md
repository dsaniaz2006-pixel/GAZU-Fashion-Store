# Authentication upgrade before Phase 6

Implemented 5 November 2026 from `GAZU_Fashion_Store_Root_Env_Fixed.zip`. The earlier Phase 1/2 work was not substituted for this newer source. See [audit](AUTH_UPGRADE_AUDIT.md), [file changes](AUTH_UPGRADE_CHANGES.md), and [checklist](AUTH_UPGRADE_CHECKLIST.md).

## What changed

Google Identity Services (GIS) now renders the supported Google button on sign-in, registration and linking screens. The Express API verifies ID tokens with `google-auth-library` (new backend dependency, version 11.3.3 in the lockfile). No Google Client Secret, authorization-code exchange, access-token login, redirect endpoint or additional Google scopes are used.

New Google accounts must pass GAZU email OTP before a session is issued. Returning verified Google identities sign in by stable Google `sub`. Matching an existing unlinked email does not merge or recreate the account. Authenticated verified password users can explicitly link Google by confirming their current password and selecting the same-email Google identity. No unlink operation is introduced.

The inspected source had no password-reset implementation, so recovery was added: a six-digit, ten-minute, one-time code permits an active user to change or set a GAZU password. Google-only users can use the same verified-email recovery to add password login. Registration confirmation and show/hide controls were added. Username login is not implemented or advertised; the existing email login remains the contract.

## Single-root environment: use your existing file

Keep your existing private **project-root `.env`**. Do not create `backend/.env`, `frontend/.env`, or another credentials file. This ZIP contains placeholders only. Do not overwrite your existing root file with the template.

Your existing setting is sufficient:

```dotenv
VITE_GOOGLE_CLIENT_ID=YOUR_WEB_APPLICATION_CLIENT_ID.apps.googleusercontent.com
VITE_API_URL=/api
```

The Client ID is public. Vite reads it from the root file. The backend root loader derives `GOOGLE_CLIENT_ID` from this same value. If both are injected explicitly and disagree, startup fails rather than accepting a different audience. Docker maps `${VITE_GOOGLE_CLIENT_ID}` to API `GOOGLE_CLIENT_ID` and to the web build argument. No second Client ID entry is needed in your root file. Remove an obsolete, conflicting shell `GOOGLE_CLIENT_ID` override if necessary.

Keep your existing `JWT_SECRET`, optional `OTP_SECRET`, `MONGODB_URI`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`, Redis and other private configuration locally in that same root file. None needs the `VITE_` prefix. Do not put passwords or secrets in public Vite variables. A Google Client Secret is neither read nor required by this flow; its previous unused template and Compose entry were removed.

SMTP credentials are injected into the API by the existing Compose environment mapping. The email service validates the sender configuration, strips spaces from the App Password as before, and now checks whether SMTP accepted the recipient. It reuses the existing transport and supplies escaped branded HTML plus plain text. Acceptance does not guarantee inbox placement; delivery, spam filtering and Google account settings still need live verification by you.

## Google Cloud settings

Your Web application client is already configured. Verify its authorized JavaScript origins contain exactly the origins you use:

- `http://localhost:5173`
- `http://localhost:8080`

Do not append `/account` or `/api/auth/google`. This implementation uses the popup JavaScript callback, so no redirect URI or callback URL needs to be invented. For production, add the exact HTTPS storefront origin, set `CLIENT_ORIGIN` to it, and rebuild with the matching public Client ID. If using a different local port, Google must authorize that exact origin too.

In Google Cloud Console, select the project, open Google Auth Platform, confirm branding/support information and audience, add test users when the consent app is in testing mode, and inspect the Web application client under Clients. These are configuration checks, not a request for private credentials. The standard GIS identity flow only needs basic profile/email identity.

Reference: [Google ID-token server verification](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token) and [GIS JavaScript API](https://developers.google.com/identity/gsi/web/reference/js-reference).

## Account state and database compatibility

| State / identity | Behavior |
| --- | --- |
| Existing password customer, emailVerified true | Existing email/password sign-in continues |
| Legacy admin | Existing password access remains; no role changes |
| New manual registration | Hash password, create pending customer, send GAZU OTP |
| New Google subject | Create pending customer with googleSub and no password, send GAZU OTP |
| Pending Google re-entry | Resume verification without automatically resending mail |
| Valid verification code | Atomically mark verified, consume code, return normal GAZU session |
| Returning verified Google sub | Direct session; no repeated registration OTP |
| Email exists but Google sub not linked | 409 with instruction to sign in and link |
| Disabled account | Deny login and protected API access |
| Successful recovery | Replace/add local password, consume recovery code, increment sessionVersion |

`emailVerified` remains the activation flag; no duplicate active/pending status field was introduced. `disabled` is an independent optional Boolean, default false. Provider availability is derived from `passwordHash` and `googleSub`, not a second provider list that can drift. Google profile claims never set roles. Google tokens are not persisted. A pending subject is reserved on the user but is unusable for full access until GAZU verification.

User additions: optional/select-hidden `googleSub`; `disabled`; `sessionVersion`; select-hidden `recoveryHash`; recovery expiry, attempts and send-window metadata. New accounts require a password unless a Google subject is supplied. Password-less existing document saves remain compatible with cart/OTP operations. Existing `_id`, role, cart, order/review relationships and email unique index remain. A unique partial index covers string Google subjects only. Old records without the field are unaffected. `User.init()` ensures this index before startup accepts requests; conflicting manually added subjects cause a safe startup failure. Do not drop indexes or delete users to resolve a conflict. No data migration, seeding or live database operation was performed.

New `GoogleChallenge` collection contains only a hashed browser binding, random nonce and expiry, with TTL cleanup. Recovery state is embedded in the same User document rather than adding a second OTP model. Registration continues using the existing EmailOtp collection. Expired credentials are rejected by application checks independently of TTL cleanup.

## Security mechanics

1. The browser loads GIS and POSTs a JSON challenge request from the exact configured storefront Origin.
2. The API stores a random challenge for ten minutes, sets a SameSite=Strict HttpOnly browser-binding cookie, and returns a nonce. In production the cookie is Secure. The cookie path is `/api/auth`.
3. GIS includes the nonce in its signed ID token. The callback posts the credential to GAZU without storing it in localStorage/sessionStorage.
4. The official Google library validates signature, issuer, audience and time. Additional checks require a valid email, true email_verified, nonempty sub, exact nonce and unexpired exp.
5. The API atomically consumes the browser challenge. Reuse, missing cookies, expired challenges, foreign Origins and non-JSON submissions fail. This is the custom JavaScript callback flow, not Google's HTML auto-POST flow; its browser-bound nonce replaces reliance on an assumed `g_csrf_token` field.
6. All new accounts still require GAZU OTP, including Gmail/Workspace identities. Third-party Google emails are not treated as proof of current mailbox control on registration. Returning users authenticate the previously GAZU-verified linked subject; token email changes never silently change the stored GAZU address.
7. Link Google requires the existing verified account, current password, fresh Google challenge, matching email and a conditional unique-subject update. Session-version checks prevent a concurrent password reset from being bypassed by an old linking attempt.

Registration OTP remains five minutes, maximum five attempts, 60-second resend cooldown and five sends/hour/account. Replacements invalidate old codes; transaction handling prevents concurrent success/replay and lost attempt counters. Pending email and resend deadline survive a tab refresh; passwords and Google credentials do not. Delivery failure leaves the account pending and returns the existing safe recovery error. Re-entering Google does not create automatic resend loops.

Recovery codes are purpose-separated HMAC hashes using OTP_SECRET or JWT_SECRET, valid for ten minutes with five attempts. Requests have a 60-second cooldown and five-per-hour account cap, plus 20 requests per IP per 15 minutes shared across recovery endpoints. Unknown, pending, disabled, throttled and SMTP-failed requests get the same response body/status. It does not claim mail was sent. Successful reset atomically clears the credential and increments sessionVersion. All previously issued JWTs then fail protected API checks, including legacy tokens whose missing version is treated as zero. A security notification is attempted after commit; notification failure does not undo a password change. Passwords remain bcrypt-hashed, 8 to 72 UTF-8 bytes; confirmation is required in the reset API and registration UI. Existing registration API clients may omit confirmation for compatibility.

Google challenge/sign-in/link requests share a 120-per-IP/15-minute limiter. Existing password and registration OTP IP limits remain. These IP limiters use the existing in-process store; multi-instance deployment needs a shared rate-limit store. Per-account OTP/recovery limits and challenge consumption remain database-backed.

Existing tab-scoped GAZU JWT storage and route guards are preserved. Logout clears the tab token and disables GIS automatic selection. There is no provider logout or unlink operation. Auth API responses are no-store. Structured logs never log bodies; credential/nonce/recovery/provider fields are redacted. Generic recovery responses reduce account disclosure, but the pre-existing registration-conflict and verification-throttle responses still reveal some account availability; they are retained for compatibility. SMTP response timing is not constant-time.

## Run on your Mac

1. Extract the ZIP and open the `gazu-store` folder.
2. Keep/copy your existing root `.env` locally into this folder. Do not copy it into service directories. If creating a completely new development installation, use root `.env.example` as a template and fill placeholders privately.
3. Use Node.js 22.12 or later and install from lockfiles:

```sh
npm ci
npm run setup
npm run env:check
npm run dev
```

Open `http://localhost:5173/account`. No seed or migration is needed. Local development retains the existing root MongoDB/Redis settings and port defaults. Transactions require Atlas or a replica set. Restart development processes after changing the root Client ID.

For your existing Docker stack, run from the same project folder/project name you already use so the intended named data volumes are retained:

```sh
docker compose config --quiet
docker compose up -d --build
docker compose ps
```

Open `http://localhost:8080/account`. Vite substitutes the public Client ID at image build time, so changing it requires rebuilding the web image; backend environment changes require recreating the API container. Compose continues using its isolated `mongo` replica set and `redis`, persistent upload and Mongo volumes, and existing ports. It does not switch Docker to your Atlas URI. Do not use `down -v` on your real store. Never share full `docker compose config` output because it resolves private values.

## Verification completed

- Baseline: 47 backend and 35 frontend tests passed before implementation.
- Final `npm test`: **73 backend, 43 frontend, 1 payment-service test passed**.
- `node --test scripts/*.test.mjs`: **6 passed**, covering root audience mapping, conflict rejection, Compose mapping and public-variable restrictions.
- `npm run build`: passed. A harmless sentinel check confirmed that only the public Client ID entered the JavaScript bundle; JWT/SMTP marker values did not.
- Actual root `npm run dev`: started and browser-tested on isolated ports 5176/8006 with a temporary replica set.
- Browser regression: manual registration/OTP/refresh/intended destination; first Google OTP; returning direct Google without new mail; session refresh/logout; Google-only password setup and password sign-in; email collision and explicit link; returning linked login; cart add; narrow mobile recovery. Zero page errors and no mobile horizontal overflow.
- Docker: isolated project `gazu-auth-check`, separate test volumes and host port 18080, built with fake public configuration. Mongo/Redis/API/web started healthy; same-origin API/challenge and client-ID injection checked. The existing store on 8080 was not modified.

The Google unit/integration tests exercise the official verifier with locally generated RSA keys and a mocked Google certificate response, including bad signature/audience/issuer/expiry/claims/nonce. The browser test simulates the external GIS button callback using locally signed credentials. Emails are intercepted, not delivered. Screenshots in `auth-screenshots` therefore show a test button, not proof of a live Google chooser. No real Google account login, Gmail inbox delivery, live Atlas, deployed HTTPS origin or production hosting is claimed. The actual shipping UI loads and renders Google's real GIS library.

## Manual acceptance checklist

Use test accounts in a development database and your configured SMTP sender. These manual checks send actual verification/security mail.

1. Open sign-in at 5173, confirm the genuine Google button appears, and cancel the chooser. The page should remain usable. Retry with an authorized Google test user.
2. New Google identity: verify no protected access before GAZU OTP; refresh the OTP screen; enter a wrong code, then the correct code; confirm automatic activation/login. Resend is disabled during cooldown.
3. Sign out and sign in with the same Google user: no new OTP; same account, orders and bag.
4. Register manually with confirmation; verify OTP; sign out; sign in with the original email/password. Existing users must not register again.
5. Use Google matching an unlinked password email: confirm conflict. Sign in with password, visit Account, enter current password and link same-email Google. Sign out and test Google. A different email or wrong password must fail.
6. Forgot password: request code, enter new password twice, reset, verify old password fails and old authenticated tabs require sign-in. Reuse/expiry/wrong-code attempts must fail. A Google-only verified account can set a GAZU password without changing its Google password.
7. Temporarily misconfigure SMTP only in a development environment: first registration stays pending with a meaningful delivery error, and resend limits still apply. Recovery always uses its generic response; check safe server diagnostics.
8. Confirm customer/admin guards, catalogue/reviews, cart, COD/mock checkout, GAZU order number, order history and order confirmation. Automated regressions cover these preserved features.
9. Repeat Google registration/login at 8080 after rebuilding Docker. Check both JavaScript origins in Cloud Console and that no extra service `.env` exists. Check upload/order persistence across a normal Compose restart.

## Scope and Phase 6 readiness

No Phase 6 gateway/payment-service deployment or CI redesign was added. Product/review/order/checkout/cache logic, React routes/layouts and data relationships remain. This source had no delivery-status email implementation; none is claimed as preserved or added. Existing COD order confirmations remain, including notification records and SMTP-failure isolation; mock checkout's prior notification behavior was not changed.

Remaining acceptance work is live Google consent/chooser and inbox delivery using your local configuration. Optional username login, unlinking, changing the account email, distributed IP rate-limit storage, production secret management and richer recovery abuse controls are not implemented. The authentication source, tests, Docker wiring and documentation are ready to carry into Phase 6 once those live acceptance checks pass.
