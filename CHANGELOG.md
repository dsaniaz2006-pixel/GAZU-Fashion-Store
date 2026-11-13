# GAZU Changelog

This document tracks *documented* changes. It is not a claim that live production verification has been completed. For historical details, see [`docs/GAZU_REFACTOR_CHANGELOG.md`](docs/GAZU_REFACTOR_CHANGELOG.md) and the wave-specific reports.

## 2026-11-12 — Documentation organization

- Added `docs/DATABASE.md`, `docs/ENVIRONMENT.md`, and `docs/AI_FEATURES.md`.
- Added this root changelog and linked the documentation index from `README.md`.
- Kept the existing architecture, API, testing, feature, and historical documentation in place.
- No runtime source code, application routes, product data, or environment secrets changed.

## Prior development — Waves 1–3 and compatibility-first refactor

- Wave 1: catalogue AI tagging, embeddings, vector search, shopping search and supporting infrastructure.
- Wave 2: stylist, outfit builder, shopping assistant, visual matching and discovery.
- Wave 3: verified fit guidance, order support, multilingual assistant, admin review and inventory forecasts.
- The compatibility-first refactor modularized API calls, wishlist handling and Wave 3 routers while retaining existing public routes. See [`docs/GAZU_REFACTOR_CHANGELOG.md`](docs/GAZU_REFACTOR_CHANGELOG.md).
- Reported live test completion varies by feature. Refer to the existing verification reports; do not assume all browser and third-party integration checks passed.
