# Phase 6 checklist

## Verified in this workspace
- [x] JavaScript syntax checks (changed backend, payment files)
- [x] Compose YAML structural parse
- [x] Shell syntax check for Phase 6 verification script
- [x] Pure Vite environment policy tests (3 passed)
- [x] ZIP archive integrity check (after packaging)

## Still required on local Mac / GitHub
- [ ] `npm ci` for all services (offline package cache incomplete here)
- [ ] `npm test --prefix payment-service`
- [ ] `npm test --prefix backend` against disposable replica set
- [ ] `npm test --prefix frontend` and `npm run build --prefix frontend`
- [ ] `docker compose config --quiet` and `docker compose build`
- [ ] `docker compose up -d --build` and `docker compose ps -a`
- [ ] `bash scripts/verify-phase6.sh`
- [ ] Valid mock payment, decline, conflict, lost-response retry and payment service restart
- [ ] COD while payment service is stopped
- [ ] Transaction rollback, stock, unique GAZU order number, emails and cache invalidation
- [ ] Direct browser refresh of React nested pages, upload persistence, request IDs
- [ ] Google registration/linking/OTP, password reset and session persistence
- [ ] GitHub Actions green runs and no secrets printed

**Phase 6 completion cannot be declared until those runtime checks pass.**
