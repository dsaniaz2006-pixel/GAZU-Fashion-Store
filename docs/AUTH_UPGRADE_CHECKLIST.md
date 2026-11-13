# Authentication upgrade checklist

| Requirement | Status | Evidence / limits |
| --- | --- | --- |
| Source/blueprint audit | Complete | AUTH_UPGRADE_AUDIT.md; latest Phase 5 ZIP used |
| Existing password login/registration | Implemented, tested | Baseline plus regression suites |
| Google first-time OTP and returning login | Implemented, tested with signed local fixtures | Real Google consent/chooser requires manual acceptance |
| Official signature/audience/issuer/expiry checks | Implemented, tested | google-auth-library plus explicit claims and nonce checks |
| Browser binding, replay protection | Implemented, tested | HttpOnly SameSite cookie and consumed DB challenge |
| User identity/account compatibility | Implemented, tested | Same IDs, optional password, unique partial Google-sub index, disabled flag |
| Existing OTP/resend controls | Preserved, tested | Five-minute expiry, five attempts, cooldown/cap, failure recovery |
| Session after activation | Implemented, tested | Normal GAZU JWT returned only after GAZU OTP |
| Safe account linking | Implemented, tested | Password confirmation, session, fresh same-email Google proof; no auto-merge |
| Forgot/reset/set password | Implemented, tested | One-time protected code; old password/JWT rejected after reset |
| Username login/unlinking | Not implemented, optional | UI remains explicitly email-only; no only-provider unlink risk |
| Branded auth mail | Implemented, mocked tests | Existing service, HTML/plain text, SMTP acceptance check; inbox unverified |
| React account/recovery/settings | Implemented, tested | Google button callback, controlled forms, errors, refresh, mobile |
| Single root environment | Implemented, tested | Existing VITE_GOOGLE_CLIENT_ID drives both sides; no real .env added |
| Docker compatibility | Built and smoke-tested | Separate test stack/volumes/port; existing stack untouched |
| Phase 1–5 preservation | Regression-tested | Unrelated source preserved; checkout/OTP/cache/orders tests pass |
| Documentation and ZIP | Complete | Guide, API notes, file report, test record, placeholders and source |
| Live Google/Gmail/Atlas/production | Not verified | Manual acceptance checklist in AUTH_UPGRADE.md |

123 automated tests passed: backend 73, frontend 43, payment service 1, environment scripts 6. No actual customer emails or purchases were made.
