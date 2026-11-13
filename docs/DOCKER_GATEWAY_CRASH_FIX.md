# Phase 6 Docker gateway crash fix

Root cause: `gateway/Dockerfile` overwrote `/etc/nginx/nginx.conf` in the `nginxinc/nginx-unprivileged` image, discarding the base image's non-root-safe nginx PID and temp path configuration. This can cause the gateway to restart with exit code 1.

Fixed: retain the image's main nginx config and install GAZU's `server` and `upstream` directives via `/etc/nginx/conf.d/default.conf` (included by the base `http` context). No changes to existing API routes, Docker volumes, payment behavior or MongoDB.

From the Phase 6 project folder on macOS:

```sh
docker compose down
docker stop gazu-store2-web-1 2>/dev/null || true
docker compose build --no-cache gateway web
docker compose up -d
docker compose ps -a
docker compose logs --tail=60 gateway
curl -i http://localhost:8080/healthz
```

If the gateway still fails, inspect its log output. Keep the existing root `.env` private. For Google sign-in, `VITE_GOOGLE_CLIENT_ID` must be present in the root `.env` **at build time** and `http://localhost:8080` must be an authorized JavaScript origin in Google Cloud. The frontend Dockerfile/Compose already forward the build argument.

Never run `docker compose down -v`; it deletes persistent databases.
