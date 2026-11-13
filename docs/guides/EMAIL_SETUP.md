# Email setup

Use only the existing root `.env`: `EMAIL_USER`, `EMAIL_PASS`, optional `EMAIL_FROM` and `EMAIL_SERVICE=gmail`. Keep credentials private. No service-level environment file or Google Client Secret is required. See [the authentication guide](../AUTH_UPGRADE.md) for OTP, recovery, SMTP failure handling and manual inbox checks. Automated tests intercept mail and do not establish real Gmail delivery.
