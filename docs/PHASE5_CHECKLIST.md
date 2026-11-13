# Phase 5 completion checklist

Check manually on your Mac (a static source change is not proof of operation):

- [ ] `docker compose config --quiet` passes
- [ ] `docker compose build` succeeds (both Dockerfiles)
- [ ] `docker compose up -d` boots mongo, mongo-init, redis, api, web
- [ ] `docker compose ps` reports web/api/mongo healthy; mongo-init exited 0
- [ ] `rs.status().myState` is `1` (PRIMARY)
- [ ] `http://localhost:8080` shows production React build
- [ ] Refresh direct product and admin route successfully
- [ ] `/api/health` returns 200 and Mongo `up`
- [ ] Redis `HIT`/`MISS` seen; product changes invalidate
- [ ] Redis shutdown does not stop browsing
- [ ] Review and checkout flows still work
- [ ] COD, mock payments, stock protection, idempotency and order numbers verified with disposable data
- [ ] Registration, OTP, email notifications verified with test mailbox only
- [ ] Product image remains after API restart
- [ ] Mongo orders remain after database restart
- [ ] `X-Request-ID` and Winston/Morgan logs present, without secrets
- [ ] `npm test --prefix backend` passes
- [ ] `npm test --prefix frontend` passes
- [ ] `npm test --prefix payment-service` passes (legacy source test; service not deployed in Phase 5)
- [ ] `npm run build --prefix frontend` passes
- [ ] No volumes destroyed and no live Atlas data modified

**Current environment:** Docker unavailable; all live-container checks above remain unverified.
