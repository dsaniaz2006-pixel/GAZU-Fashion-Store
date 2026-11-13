# GAZU — original three-product catalogue

## Source audit
The uploaded `GAZU_Phase6_Docker_Gateway_Fixed(1)(2).zip` already contained **no** Men's 75-product source data, product-import script, SKU-specific frontend pages, or 75-product illustration files. Its only built-in catalogue was the three entries in `backend/src/seed.js`. The 75 items displayed in the user's screenshot are therefore most likely active MongoDB records from an earlier catalogue import. Unzipping older code does not delete MongoDB documents.

The code now has one shared source for the three demo records: `backend/scripts/threeProductCatalogue.js`. `backend/src/seed.js` will insert only missing demo products, even if old records exist; it does not overwrite existing demo stock, product IDs, prices or images.

## Exactly which three appear in a cleaned catalogue?

| Product | Category | Price | Image reference |
| --- | --- | ---: | --- |
| Relaxed Cotton Tee | Men | ₹1,299 | `photo-1521572163474-6864f9cf17ab` |
| Soft Knit Pullover | Women | ₹2,499 | `photo-1434389677669-e08b4cac3105` |
| Structured Tote | Accessories | ₹999 | `photo-1548036328-c9fa89d128fa` |

The photos are the original demo Unsplash references, not files from the removed Men's expansion. Source baseline stocks are 12, 8 and 5; live stock is NOT reset. The screenshots show different current stock figures because stock may have changed in MongoDB.

## Critical distinction: source code versus MongoDB

The cleanup command is **opt-in** and does not run automatically on server startup, app build or Docker startup. For safety, it does not physically delete historical product records: it sets `active:false` on former Men's items so they disappear from public product queries and the admin active-catalogue list. The existing API already rejects such items at checkout. Historical orders, reviews, stock values, customer accounts, order counters, and payment attempts are preserved.

A former Men's item is identified using its existing import SKU format, or (for SKU-less legacy imports) a `GAZU`-prefixed name with the old import's `department:men` and `mainCategory` fields. No list of 75 product names, prices or images is bundled. **If other active products are found, the script refuses to modify anything; inspect the printed names first.** Existing demo names are never targeted, and duplicate demo names stop the process. The script can also restore an inactive demo or add a missing one. It leaves an existing demo's manually edited stock untouched.

## Step-by-step on macOS — Atlas (local npm dev)

1. Extract the updated ZIP and open the `gazu-store` project root. Copy across your existing root `.env` securely; none is included in this ZIP. Verify `GAZU_DB_MODE=atlas` and your intended `MONGODB_URI` for the development/test database.
2. Install packages if needed: `npm ci && npm run setup`.
3. **Preview without writes:**
   ```sh
   npm run catalogue:three -- --target=atlas
   ```
4. Verify the printed database name, intended archival count (typically 75), the demo count, and that no unexpected active products are listed. Back up the database if you need a restore point.
5. **Apply only to the confirmed development database:**
   ```sh
   npm run catalogue:three -- --target=atlas --apply --confirm=KEEP_ONLY_THREE
   ```
6. Restart `npm run dev`, reload the shop, and check that only the three products above are active. Clear browser caches if needed. The cache is invalidated after the database transaction commits.

## Step-by-step — Docker isolated MongoDB

Docker Compose's `api` service uses `GAZU_DB_MODE=docker-local` and `mongodb://mongo:27017/gazu_store?replicaSet=rs0`, distinct from the Atlas URI in the root `.env`. Do **not** run the Atlas command expecting it to update Docker's local database.

```sh
docker compose up -d --build
docker compose exec api node scripts/keepOnlyThree.js --target=docker
docker compose exec api node scripts/keepOnlyThree.js --target=docker --apply --confirm=KEEP_ONLY_THREE
docker compose restart api
```

Open `http://localhost:8080` after the stack is healthy. The backend image now includes `backend/scripts/` so this one-time cleanup works inside the API container. Avoid `docker compose down -v`: that removes persistent data volumes.

## Verification

```sh
node --test backend/tests/threeProductCatalogue.test.js
npm test --prefix backend
npm test --prefix frontend
npm test --prefix payment-service
npm run build --prefix frontend
```

Inspect `/api/products?limit=12`: it should return `total:3` and only the three demo names once the migration has been applied. `/api/admin/products` should show the same three active records. Cart items referencing archived products are no longer purchasable and may require customer removal. Do not delete or rewrite historical orders to hide their purchased item descriptions.

## File changes

- `backend/scripts/threeProductCatalogue.js` — shared three-product reference data and conservative classifier for earlier imports.
- `backend/scripts/keepOnlyThree.js` — explicitly targeted, preview-by-default MongoDB archival tool; no automatic deletion.
- `backend/src/seed.js` — inserts only missing demo products, preserving existing stock.
- `backend/Dockerfile` — includes the cleanup script and shared catalogue data inside the container.
- `backend/tests/threeProductCatalogue.test.js` — validates three-product source and safe classification/plan behavior.
- `package.json` — adds `catalogue:three` script.

The server's auth, Google login, OTP, payment microservice, checkout transaction logic, Docker Compose, nginx gateway, Redis and GitHub Actions remain unchanged.

### Actual verification in the preparation environment (6 Nov 2026)

| Command | Actual result |
| --- | --- |
| `node --test backend/tests/threeProductCatalogue.test.js` | **7 passed, 0 failed** (isolated, no MongoDB required) |
| Node.js syntax checks for backend JS modules | **Passed** |
| `npm test --prefix backend` | **10 tests passed, 5 test files failed to load** because dependencies such as `mongoose` were absent; not a full regression pass |
| `npm test --prefix frontend` | **Blocked**: `vitest` not installed |
| `npm test --prefix payment-service` | **Blocked**: `supertest` not installed |
| `npm run build --prefix frontend` | **Blocked**: `vite` not installed |
| `docker compose` | **Not run**: Docker not installed in the preparation environment |
| Atlas and Docker archive command | **Not executed**: no live database or credentials were accessed |

The preview and apply commands have not been tested against the actual Atlas or Docker database. Run them only after inspecting the selected database and taking any needed backup.
