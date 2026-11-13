> Current behavior: [AUTH_UPGRADE.md](AUTH_UPGRADE.md). Successful verification now also returns a GAZU session. Both Google and password registration use this OTP service.

# Registration email verification

## Start here

The original ZIP remains unchanged. This update does not seed, delete collections, connect to your live database, or automatically migrate customers. Private `.env` files are excluded from the delivery ZIP.

1. Extract the updated project into a new folder. Keep your existing single root `.env` in the project root. Do not create a backend environment file. Keep the current MongoDB URI, JWT secret and Gmail App Password unchanged. Do not paste the password into chat or commit it.
2. Run `npm ci` at root, then `npm run setup`. Nodemailer was updated to the patched version in the lockfile; `npm ci` installs it.
3. Check the existing sender settings:

```dotenv
EMAIL_SERVICE=gmail
EMAIL_USER=gazufashionstore@gmail.com
EMAIL_PASS=your_existing_google_app_password
EMAIL_FROM="GAZU Fashion Store <gazufashionstore@gmail.com>"
```

4. Optionally set `OTP_SECRET` to an independent random secret with at least 32 characters. If omitted, the application uses the existing JWT_SECRET. Rotating the OTP key invalidates pending codes. Never expose either key in frontend variables.
5. Restart backend/frontend with `npm run dev`. Do **not** run the seed script for this feature. Startup initializes the unique email OTP index and TTL index.
6. Register with an email inbox you control, enter the code within five minutes, then sign in. This update does not automatically sign in after verification.

For Docker, copy your current root `.env` and add the email settings there too. Compose explicitly passes them to the API. The API container must have SMTP network access. No credentials are baked into an image.

## Existing accounts

- Existing administrators remain able to log in without email verification, including admin documents with no emailVerified field. Public registration cannot assign an admin role.
- Existing customers without emailVerified must verify their email by default. They can sign in with the correct password to reach the verification screen, or choose **Already registered? Verify email**. Request a code there.
- Previously issued customer JWTs are checked against current verification state on every authenticated API request. An unverified customer's token cannot bypass verification.
- If you deliberately want to trust pre-existing customer emails without verification, an optional migration is supplied. First back up your database and review the dry run:

```sh
cd backend
node src/migrateLegacyEmailVerification.js
# Only if you intentionally accept those legacy emails as verified:
node src/migrateLegacyEmailVerification.js --apply
```

It updates only customers whose emailVerified field is absent. New accounts explicitly have false and are excluded. This migration has not been run against your database.

## Behavior and limits

- Cryptographically random six-digit code, including possible leading zeros.
- HMAC-SHA256 hash stored in MongoDB; plaintext code is used only to compose the email. No code, password, credential or email body is logged or returned by registration.
- Five-minute expiry checked during verification, independently of asynchronous TTL cleanup.
- At most five failed attempts per code. Transactions commit failed-attempt increments and serialize competing verification requests. A valid code can be consumed only once.
- Sixty-second resend cooldown and five sends per rolling one-hour account window. These controls are stored on User and survive OTP TTL deletion. They work across concurrent requests/API instances.
- IP rate limits supplement database account limits. IP limits are process-local; a distributed edge limiter is recommended for multi-instance public hosting. Proxy trust must be configured for the actual hosting topology, not blindly enabled.
- Resend replaces the old code. Unknown and already-verified accounts receive a generic response with no email. Cooldown differences can still disclose pending status; no claim of perfect account-enumeration resistance is made.
- Pending email, not password or code, is kept in sessionStorage so the same browser tab can resume after refresh. The backend always enforces limits even if the countdown resets after a reload. There is also an explicit recovery entry for another browser/session.
- Failed SMTP delivery leaves one pending account and provides a recovery screen. It does not issue a JWT or overwrite an account password. The user can resend after the cooldown. SMTP errors are redacted; send timeouts are bounded. Delivery is synchronous with explicit user retry, not a durable mail queue.

## API

| Route | Body | Result |
| --- | --- | --- |
| POST /api/auth/register | name, email, password | 201 requiresVerification, email, retryAfter, message; no JWT |
| POST /api/auth/verify-email | email, otp (six-digit string) | 200 success message; then sign in normally |
| POST /api/auth/resend-otp | email | 200 generic message, retryAfter |
| POST /api/auth/login | email, password | Existing JWT response only for verified customers or admins |

Errors: 400 invalid/expired code, 401 wrong credentials, 403 EMAIL_NOT_VERIFIED, 409 duplicate registration, 429 cooldown/send limit/attempt lock, 503 OTP_DELIVERY_FAILED. OTP errors include a stable code; relevant responses contain retryAfter and Retry-After. Delivery failures include requiresVerification/email to open recovery safely.

## Verification record

Automated tests use temporary MongoDB replica sets and mocked mail delivery. They verify code generation, hashes, expiry, replay, concurrent incorrect attempts, concurrent valid submissions, concurrent resends, hourly cap, old-code replacement, delivery-failure recovery, duplicate registration, malformed input, existing admin access, and denial of unverified JWTs. Frontend tests cover registration → OTP → sign-in, refresh recovery, unverified login, and delivery failure.

No real email was sent in this task, and live Gmail inbox delivery is not claimed. The sender account and App Password remain your existing configuration. Final manual check: receive the message in an inbox you control, reject an incorrect code, accept the correct code, sign in, and confirm your existing admin can still sign in. No password-reset feature is included in this phase.
