# Keep the GAZU Render backend awake

## What this adds

The GitHub Actions workflow at `.github/workflows/render-keepalive.yml` sends an inbound request to:

`https://gazu-backend.onrender.com/api/health`

It runs every five minutes and verifies the JSON health response. If Render is still starting, the workflow retries for up to roughly four minutes. It also supports a manual run from the GitHub Actions tab.

Render Free web services spin down after 15 minutes without inbound HTTP or WebSocket traffic. A request to the service wakes it; Render says startup takes about one minute. The workflow is intended to keep this single backend receiving periodic inbound traffic.

## Enable it

1. Merge the change containing this workflow into the repository's default branch (`main`). GitHub scheduled workflows only run from the default branch.
2. Open the repository's **Actions** tab.
3. Select **Keep Render backend awake**.
4. Confirm the workflow is enabled. Use **Run workflow** once for an immediate test.
5. Open the run and confirm the step reports `GAZU Render backend is healthy (HTTP 200)`.

No Render environment variable, database migration, API key, or secret is required for this health check. It uses the existing public health route and does not modify MongoDB data.

## Free-plan limits and reliability

- Render includes 750 Free instance hours per workspace per calendar month. A single service running continuously for a 31-day month uses about 744 hours, so this can fit if it is the only Free instance consuming those hours. Other Free services in the same workspace share the allowance.
- Render may restart Free services at any time, and scheduled GitHub Actions can be delayed or dropped during periods of high GitHub load. This is best-effort keep-alive, not an uptime guarantee.
- If the workflow repeatedly fails, the service may be suspended, the Render deploy may have failed, or the API may not be reaching a healthy startup state. Check Render **Events** and **Logs**; repeated pings cannot repair a failed deployment or unavailable MongoDB connection.
- For always-on service with no dependency on a scheduled workflow, move the Render web service to a paid compute plan. Render says paid compute plans do not spin down.
- An alternative external monitor is UptimeRobot's Free plan, which checks every five minutes. Configure an HTTP(s) monitor for the same health URL. It can provide an independent monitor and alert, but it does not override Render suspensions or startup failures.

## Frontend cold-start handling

The frontend HTTP client retries only safe `GET` requests when Render's proxy returns HTTP 502/503/504 or a non-GAZU HTML warm-up page with HTTP 200. It never automatically repeats `POST`, `PATCH`, or `DELETE` operations. This protects registration, cart changes, checkout, and payment requests from accidental duplicate submission.

The retry delays span about one minute. A final failure remains visible with the existing Retry action.
