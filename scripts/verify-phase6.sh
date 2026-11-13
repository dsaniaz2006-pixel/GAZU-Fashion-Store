#!/usr/bin/env bash
set -euo pipefail
port="${GAZU_WEB_PORT:-8080}"
base="http://127.0.0.1:${port}"
curl --fail --silent --show-error "${base}/healthz" >/dev/null
curl --fail --silent --show-error "${base}/api/health" | grep -q '"mongo":"up"'
curl --fail --silent --show-error "${base}/shop" | grep -q '<html'
curl --fail --silent --show-error "${base}/api/products?q=cotton&page=1" >/dev/null
curl -sS -o /dev/null -w '%{http_code}' "${base}/internal/decision" | grep -q '^404$'
curl -sS -o /dev/null -w '%{http_code}' -X POST "${base}/api/payments/mock/checkout" -H 'Content-Type: application/json' -d '{}' | grep -q '^401$'
docker compose exec -T mongo mongosh --quiet --eval 'if(!db.hello().isWritablePrimary)quit(1)'
docker compose exec -T redis redis-cli ping | grep -q PONG
docker compose exec -T payment-service node -e "fetch('http://127.0.0.1:4001/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
printf 'Phase 6 gateway, authentication boundary, Mongo primary, Redis and payment health checks passed.\n'
printf 'Live Google OAuth, SMTP delivery and manual order checkout still require local verification.\n'
