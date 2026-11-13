# Phase 1 audit, before code changes

Source: the newly supplied gazu-store.zip, inspected 4 November 2026. This is the frontend architecture Phase 1, distinct from the earlier email phases. No source or backend behavior is inferred from older ZIPs.

| Requirement | Existing file | Current implementation | Status | Required changes | Risk |
| --- | --- | --- | --- | --- | --- |
| React Router | frontend/src/App.jsx | All requested URLs, nested guards and admin routes | Completed | Preserve installed Router 7 and URLs | Medium |
| Storefront layout | App.jsx | Header/footer inline with routes and state | Partial | Extract shared Outlet layout and presentation provider | Low |
| Account layout | App.jsx | Bare Outlet, no account navigation | Missing | Named account layout with account/orders navigation | Low |
| Admin layout | App.jsx | Inline component with links and Outlet | Partial | Extract, retain nav and style, active links | Low |
| 404 and SPA fallback | App.jsx, frontend/nginx.conf, public/_redirects, vercel.json | Fallbacks already present | Completed | Preserve; test deep URLs | Low |
| Authentication | context/AuthContext.jsx | Tab sessionStorage JWT, user restoration and events | Partial | Expose session/loading/error, protect against stale restoration/error responses, retry transient restoration failures | High |
| Route guards | routes/Guards.jsx | Protected and admin checks, pathname-only destination | Partial | Preserve query/hash, handle restoration errors/loading consistently | Medium |
| Registration OTP | pages/Account.jsx, backend/routes/auth.js | Working API integration, duplicate recovery control inside/outside form | Broken | Remove duplicated control and unintended form submit; lock duplicate operations | Medium |
| Forgot/reset password OTP | All source inspected; no matching routes/models/UI | Not implemented in this ZIP; README also says absent | Missing | Explicit scope limitation; no invented backend/UI endpoints in Phase 1 | High |
| Cart reducer | context/cartReducer.js | Array reducer with unchecked quantities and duplicated loading/error state outside reducer | Partial | Unified items/loading/error state, validated actions, authoritative server sync | High |
| Cart requests | context/CartContext.jsx | Generation ignores old account successes, but stale errors and initial GET can overwrite mutations; no loading view | Broken | Isolate sessions and requests, initial loading, retry, explicit concurrent-operation guard | High |
| Checkout | pages/Checkout.jsx | Controlled form, request UUID, COD/mock, orderNumber display | Partial | Use shared cart loading/operation lock; extract order summary; preserve request contract and retry UUID | High |
| Orders | pages/Orders.jsx | Customer/admin/detail shared page, orderNumber fallback, Mongo IDs in URLs | Partial | Stale-response-safe fetch and focused OrderCard; retain status behavior | Medium |
| Fetch/debounce | hooks/useFetch.js, useDebounce.js | Stale completion flag, no cancellation/retry, debounced query | Partial | AbortSignal, immediate request identity masking, retry and session scoping | Medium |
| Local preferences hook | hooks/ | Missing | Missing | Safe localStorage hook used only for catalogue sort preference | Low |
| Product search | pages/Shop.jsx | URL query, category/sort/pagination, per-keystroke history pushes | Partial | Keep URLs authoritative, replace typing history, persistent default sort, loading during debounce | Medium |
| Admin products | pages/Admin.jsx | Working CRUD/upload; own fetch; unused Orders import, stale upload help copy | Partial | Shared fetch, reload/error/empty states, operation lock, focused inventory list | Medium |
| Other pages/components | components/, pages/ProductDetail.jsx, Stats.jsx | Existing design and functionality, unused imports, isolated async errors | Partial | Preserve visuals; remove verified dead imports, use common states/retry | Low |
| ErrorBoundary | components/ErrorBoundary.jsx | Existing reload fallback | Completed | Add regression test | Low |
| Backend compatibility | backend/models/Order*, services/checkout.js, orderNotifications.js, routes/ | Professional numbering and email integration exist | Completed | Preserve backend source byte-for-byte; run tests and add compatibility assertions only | High |
| Frontend tests | src/tests/app.test.jsx, otp.test.jsx | 10 tests, limited state/routing/checkout coverage | Partial | Add auth/cart races, routes/history, errors, numbering, checkout/admin tests | Medium |
| Startup/deployment/docs | root scripts, docs/ | Existing dev/build/test scripts and configs; older records | Partial | Verify isolated root dev, report actual results, document phase scope and manual checks | Low |

## Refactoring sequence

1. Preserve supplied source in its ZIP and work in gazu-phase1, omitting private environment files and installed dependencies.
2. Establish baseline build/tests. Retain existing Router, React, fetch, CSS and Tailwind packages; no dependency upgrades.
3. Extract layouts/presentation state. Improve auth restoration and route guards.
4. Unify cart reducer/loading/errors and request sequencing. Preserve server prices and checkout contract.
5. Improve fetch and preference hooks; extract reusable order components; fix duplicate OTP controls.
6. Extend frontend and backend regression tests, verify root development startup against temporary MongoDB with mock email transport, document results and package.

No live MongoDB access, seeding, migration, real email or real purchases are required for this phase. Existing uploaded images will be retained in the deliverable.
