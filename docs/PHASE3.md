# GAZU Phase 3 — CE-2 integration and UI polish

## Scope and audit
Based on the supplied Phase 2 ZIP and the Phase 3 prompt. No Phase 4/ETE functionality was added. The existing Phase 2 project already had routed pages, Context API, a debounced Shop, server search/filter/sort/pagination, a reviews backend and basic review form, a multer upload endpoint, XMLHttpRequest upload progress, Tailwind styling, and an admin stats page. Therefore the work is incremental rather than a rebuild.

| Requirement | Source | Initial status | Phase 3 action | Risk |
|---|---|---|---|---|
| Review CRUD and display | frontend/src/pages/ProductDetail.jsx; backend/src/routes/{products,reviews}.js | Partially completed | Accessibility, dated reviews, star selection, validation, duplicate warning and empty states | Medium, UI regression |
| Debounced search | frontend/src/pages/Shop.jsx; hooks/useDebounce.js; hooks/useFetch.js | Completed | Reused existing debounce and request cancellation | Low |
| Filters, sorting, pagination | frontend/src/pages/Shop.jsx; backend/src/models/Product.js | Completed | Hardened malformed page display | Low |
| Upload API | backend/src/routes/uploads.js; backend/src/app.js | Completed | Preserved file validation, auth, unique paths, size limit and static serving | Low; disk persistence |
| Upload UI | frontend/src/pages/Admin.jsx; frontend/src/api.js | Partially completed | Separated file selection and upload, preview before submission, actual XHR progress and retry | Medium |
| Admin stats | frontend/src/pages/Stats.jsx; backend/src/services/stats.js | Partially completed | Separated mock totals from collected revenue and clarified reporting | High, accounting language |
| Tailwind/responsive polish | frontend/src/styles.css | Completed | Added focused accessible styles without redesign | Low |
| Frontend tests | frontend/src/tests/ | Partially completed | Added phase3.test.jsx | Blocked at execution by dependency install |
| Backend tests | backend/tests/ | Partially completed | Existing API tests preserved | Blocked at execution by dependency install |
| CE-2 readiness | docs/ | Not verified | Added Phase 3 reports and manual checklist | Runtime verification needed |

## Customer workflows
1. Open /shop and search using the existing 300 ms debounce, category select, sort and server pagination. The browser URL retains filters and page.
2. Open /product/:id. The page displays the average rating, public review name, comment and date. Signed-in users choose 1–5 stars and submit a controlled comment; the response reloads the product and reviews. HTTP 409 yields a user-friendly duplicate message. Author and admin deletion controls use the existing protected delete endpoint.
3. The /admin/products editor allows selecting JPEG/PNG/WebP up to 5 MB, previewing it, uploading using XMLHttpRequest real bytesTransferred/total progress and then saving the returned /uploads/... image link with the product. On upload errors, the file remains selected for retry.
4. /admin/stats shows collected COD revenue and mock-payment simulation totals on separate cards, plus orders by status, top products and low stock.

## Security and storage
All access checks remain server-side. Existing routes require JWT, admin role for uploads/statistics, ownership or admin role for review deletion. The backend checks image signatures and generates UUID filenames. Uploaded files are stored under UPLOAD_DIR (default data/uploads), outside source code, and must be migrated to durable object storage before deployment to ephemeral platforms. Never commit .env or upload private secrets. Existing transaction-safe checkout, OTP, sequential order number and email logic were not rewritten.

## Test reality
- `npm ci --prefix frontend --offline --no-audit --no-fund`: BLOCKED (npm cache missing yallist 3.1.1 archive).
- `npm ci --prefix backend --offline --no-audit --no-fund`: BLOCKED (npm cache missing zod 4.6.7 archive).
- `npm test --prefix frontend`: BLOCKED (`vitest: not found`).
- `npm test --prefix backend`: BLOCKED (ERR_MODULE_NOT_FOUND for `mongoose`, 0 of 3 test files passed).
- `npm run build --prefix frontend`: BLOCKED (`vite: not found`).
- Existing backend source checked using `node --check`, but JSX cannot be validated without the Vite dependency tree.
- Live MongoDB / SMTP / customer/admin browser end-to-end checks NOT EXECUTED.

## macOS verification
Use Node 22.22.2+ or Node 24.15+ to meet all relevant dependency engine requirements (see npm warnings). In an environment with npm registry access:

```bash
npm ci
npm run setup
npm test --prefix frontend
npm test --prefix backend
npm run build --prefix frontend
npm run dev
```

Configure local backend `.env` from `.env.example` without overwriting existing credentials. Use a disposable MongoDB replica-set test database for integration tests and stub outgoing emails. Never run destructive tests against production Atlas. Browse /shop, /product/:id, /admin/products and /admin/stats. Verify customer restrictions, duplicate review errors, actual upload bytes, saved image URLs, status totals, and COD vs mock figures.

## CE-2 / ETE boundary
Phase 1 router/context, Phase 2 advanced MongoDB and Phase 3 integration source are present. **CE-2 is not certified complete** until dependencies are installed, tests and build pass, and end-to-end flows are manually verified. Phase 4+ logging/caching, Docker, microservice/gateway, CI and deployment are out of scope and unchanged.
