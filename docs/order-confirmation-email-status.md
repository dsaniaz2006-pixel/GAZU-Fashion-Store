# Order confirmation email status

The checkout flow exposes the order confirmation email submission state to the customer and to the admin order views.

## Customer-facing states

- `pending`: no submission result is available yet.
- `sending`: the confirmation email submission is in progress.
- `submitted`: the email provider accepted the submission. This does not guarantee Inbox delivery; customers should also check Spam and Promotions.
- `failed`: the email submission failed. The order remains placed; email failure must not be represented as payment or order failure.

## Checkout paths

The checkout response includes the confirmation email status for Cash on Delivery, mock payment, and Razorpay verification. The success page uses that status to explain what the customer should check next.

## Operational note

Provider acceptance is not proof of final delivery. Use the term “submitted”, not “delivered”, unless delivery confirmation is available from the provider.
