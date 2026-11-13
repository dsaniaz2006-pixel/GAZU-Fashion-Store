#!/usr/bin/env bash
# Non-destructive Phase 5 container smoke checks (requires Docker Desktop and configured .env).
set -euo pipefail
command -v docker >/dev/null || { echo 'Docker Desktop CLI required' >&2; exit 1; }
command -v curl >/dev/null || { echo 'curl required' >&2; exit 1; }
docker compose config --quiet
docker compose ps
printf '\nAPI health (must be HTTP 200 with mongo up):\n'
port="${GAZU_WEB_PORT:-8080}"
curl --fail --silent --show-error "http://localhost:${port}/api/health"
printf '\n\nMongo replica set PRIMARY (expect 1):\n'
docker compose exec -T mongo mongosh --quiet --eval 'print(rs.status().myState)'
printf '\nRedis ping (expect PONG):\n'
docker compose exec -T redis redis-cli ping
printf '\nProduct caching response headers (first/second request):\n'
for i in 1 2; do curl --silent --show-error -D - -o /dev/null "http://localhost:${port}/api/products" | grep -Ei '^(HTTP/|X-Cache:|X-Request-ID:)' || true; done
printf '\nCheck full app, checkout, OTP, uploads and persistence manually using docs/PHASE5_CHECKLIST.md.\n'
