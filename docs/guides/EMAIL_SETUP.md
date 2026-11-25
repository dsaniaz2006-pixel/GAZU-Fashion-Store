# GAZU email setup and deliverability

## Current production arrangement

The current Render configuration uses the `apps_script` provider. The backend sends the recipient, subject, plain-text body, and HTML body to a Google Apps Script web app over HTTPS. The Apps Script project then sends using the Google account that owns/runs the script.

The Apps Script endpoint accepting a request means the message was submitted to Google's mail service. It does not confirm Inbox placement or final delivery.

The Apps Script source and its deployment settings are managed outside this repository. Changes to this repository cannot change the Google account used as the sender, its account reputation, or the Apps Script deployment's sender settings.

## Why a new GAZU customer may see Spam

There is currently no GAZU-owned sending domain. Therefore GAZU cannot publish its own SPF, DKIM, or DMARC DNS records, establish an authenticated brand sender such as `support@your-domain`, or monitor a GAZU sending domain in Google Postmaster Tools.

When Apps Script sends through a personal Gmail account, Google controls the Gmail sender authentication. The app cannot add SPF/DKIM/DMARC records to `gmail.com` or force Gmail to place a message in Inbox. Switching from Apps Script to Gmail API would still send as the Gmail account and would not, by itself, solve sender reputation or Inbox placement.

## Changes made in the application

- The new-customer welcome message is now a short account-verification notification, not a promotional campaign.
- The subject is factual and does not use repeated punctuation or promotional wording.
- The message contains a plain-text version and a matching HTML version, with one clear link to the store.
- The app continues to send the welcome message only after the customer verifies their email.
- The application does not claim that provider acceptance means Inbox delivery.

These changes improve message clarity and consistency; they cannot guarantee that Gmail or another recipient provider will avoid Spam.

## Recommended permanent fix

1. Purchase a domain for GAZU (for example, a domain you control).
2. Choose a transactional email provider such as Resend or Brevo.
3. Verify the domain with that provider.
4. Publish the exact SPF and DKIM DNS records supplied by the provider.
5. Publish a DMARC record, initially with a monitoring policy such as `p=none`, and review reports before considering enforcement.
6. Configure the provider's verified sender address for account and order notifications.
7. Add the domain to Google Postmaster Tools and monitor authentication, reputation, and user-reported spam rate.
8. Send low-volume tests to Gmail, Outlook, and other providers; inspect message headers for SPF, DKIM, and DMARC results.

Do not copy generic SPF/DKIM values from examples. Use the exact DNS records generated for the selected provider and domain. Avoid publishing multiple SPF records for the same hostname.

## Operational practices

- Send only account, verification, and order messages users expect.
- Keep the sender identity consistent for each message category.
- Do not send promotional campaigns from the transactional sender.
- Do not repeatedly resend after an ambiguous timeout; this can create duplicates.
- Ask customers who find a legitimate message in Spam to mark it as `Not spam` and add the sender to contacts.
- Keep test messages limited to addresses controlled by the project team.

## Required Render configuration for the current provider

Keep the existing `EMAIL_PROVIDER=apps_script`, `GAZU_APPS_SCRIPT_URL`, and `GAZU_EMAIL_SECRET` values in Render. Never commit secrets or paste them into issue comments. No Render environment variable needs to change for the copy/template improvement in this branch.

Automated tests intercept the email request. They verify application behavior, not real-world Gmail Inbox placement.
