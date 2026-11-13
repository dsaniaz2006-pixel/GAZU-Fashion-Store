# Phase 5 file-by-file changes

- **docker-compose.yml**: Phase 5 four-service default, transient replica-set initializer, private network, named data/upload volumes, readiness checks; removes Phase 6 services from the *default orchestration only*.
- **docker/mongo/init-replica.sh**: new idempotent replica-set initialization and primary election wait (never resets data).
- **backend/Dockerfile**: multi-stage npm install and non-root Node 22 runtime, persistent upload directory.
- **backend/.dockerignore**: excludes development modules, secrets, generated data and tests from image context.
- **frontend/Dockerfile**: multi-stage Vite build, non-root nginx runtime on port 8080.
- **frontend/nginx.conf**: SPA fallback, same-origin API/upload proxy, lightweight health endpoint and cache headers.
- **frontend/.dockerignore**: excludes modules, compiled output, and secrets.
- **.env.example**: safe local Compose variables (only placeholders).
- **docs/PHASE5.md**, **docs/PHASE5_CHECKLIST.md**: new architecture, setup, and verification.
- **docs/TESTING.md**, **docs/ARCHITECTURE.md**, **README.md**: Phase 5 pointers.

No changes were made to business logic, payment-service code, gateway code, React design, or MongoDB data.
- **scripts/verify-phase5.sh**: new non-destructive local Docker smoke-check script (HTTP readiness, replica PRIMARY, Redis and cache headers).
