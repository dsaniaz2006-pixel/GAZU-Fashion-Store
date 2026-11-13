# Payment service

The internal payment simulator remains available for local tests. Its private `POST /internal/decision` endpoint is authenticated with `X-Service-Key` (at least 32-character shared key). JSON: `{"idempotencyKey":"UUID","outcome":"success|failure","amountPaise":129900}`. Amount comes from Express, never from React. Returns 200 `{"approved":true|false,"simulated":true,"status":"approved|declined","transactionId":"UUID"}`; 400 invalid, 403 unauthorized, 409 conflicting replay, 503 journal unavailable. `GET /health` is available to private Docker service clients. Persist journal on Docker named `payment-journal` volume. No real transactions or sensitive payment data are accepted.

`POST /api/payments/mock/checkout` stays under JWT-authenticated Express API. Request is the existing `{requestId,shipping,outcome}` contract; success returns an order (201), exact completed retry returns order (200); simulated decline 402, conflicting UUID 409, service failure 503. Use the same UUID on retries, including after a timeout. COD does not depend on the simulator.

The MongoDB PaymentAttempt stores the recovered decision and the order ID. A simulated approval does not mean a real payment. See `PHASE6.md` for known unresolved-attempt cases.

## Razorpay Checkout

Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in the private root `.env`. The API returns only the key ID to the browser. The authenticated `/api/payments/razorpay/order` endpoint calculates the amount from the customer's current cart and creates the Razorpay order. Checkout.js opens the payment window; the browser then posts the gateway response to `/api/payments/razorpay/verify`. The backend verifies the HMAC signature, checks the payment against the stored order amount and currency, captures authorized payments, and creates the store order only after capture is confirmed. Both endpoints support retrying with the same checkout reference. Never expose the secret in Vite variables or frontend code.
