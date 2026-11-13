# Men's Clothing — 13 topwear + 1 bottomwear product (November 2026)

This ZIP extends the **same GAZU project** from the previous footwear release. The previous **14 Men → Footwear** assets/catalogue entries and the **3 original demo products** are preserved; **nothing has been erased**.

Eight user-supplied screenshots were cropped into **14 unique individual WebP images**: 13 tops (shirts and polos) plus 1 pair of jeans. The models and clothes remain as in the source photographs; product-label text, screenshot browser bars and collage framing are not included in product images. See `frontend/public/products/men-topwear/` and `frontend/public/products/men-bottomwear/`.

## Contents and order

**Men → Topwear**: Navy Featherweight Mesh Shirt (Big & Tall), Tan Stretch Poplin Shirt, White Featherweight Mesh Shirt; Cream Tipped Polo, Green Rugby Polo, Navy Textured Long Sleeve Polo, Navy Contrast Collar Polo; Green Johnny Collar Polo; White Slim Fit Oxford Shirt, Tan Gingham Oxford Shirt, Blue Checked Oxford Shirt, Navy Checked Oxford Shirt, Green Checked Oxford Shirt.

**Men → Bottomwear**: Levi's 568 Blue Loose Fit Mid Rise Jeans.

The existing Men → Footwear collection has **14 products** and remains available. The original three demo products remain untouched. The categories appear as **MEN → TOPWEAR / BOTTOMWEAR / FOOTWEAR** in the header and filter buttons on `/shop?category=Men`.

Each new product is part of the same database-backed catalogue and inherits original GAZU ProductCard hover zoom/grayscale transition, Quick View, wishlist, Add to Bag, price formatting, and Admin CRUD. Colour-variant images, extra sizes, and alternate camera angles **were not invented**. Where a screenshot listed a price *range*, the product uses the **lowest listed price**, and the range is recorded in the description. Marked discounts use the screenshot sale price and old price. The generic three checked Oxford shirts are differentiated by colour to avoid identical product names.

All **stock quantities are illustrative (10 per product)**. The administrator must set actual quantities and verify prices, product authenticity, and permission to use third-party photographs/brand names before public sales.

## First-time local run on your Mac (existing Atlas database)

1. Extract the ZIP. Open the `gazu-store` folder in VS Code.
2. Copy your **previous root `.env`** into the new `gazu-store/` directory; it isn't in the ZIP. Verify `GAZU_DB_MODE=atlas` and the correct `MONGODB_URI`. Keep passwords/secrets private.
3. From the project root, run `npm ci` and `npm run setup` (or install each service with `npm ci --prefix backend`, `npm ci --prefix frontend`, and `npm ci --prefix payment-service`).
4. Check configuration: `npm run env:check`.
5. **Preview only** (no DB writes): `npm run catalogue:mens-clothing -- --target=atlas`.
6. If the database name and 14 products are correct, apply: `npm run catalogue:mens-clothing -- --target=atlas --apply --confirm=ADD_MENS_CLOTHING`.
7. Run `npm run dev` and open http://localhost:5173/shop?category=Men&type=Topwear . Check Bottomwear at http://localhost:5173/shop?category=Men&type=Bottomwear . Footwear remains http://localhost:5173/shop?category=Men&type=Footwear .

**The import is idempotent and additive.** Existing items (including archived items), carts, user accounts and past orders are not altered. A rerun creates missing items only. For first-time projects with an *empty* database, `npm run seed --prefix backend` creates original demos, Footwear, Topwear and Bottomwear; on an existing database use the additive import instead. **Do not run the older `catalogue:three` command** after adding products.

For Docker-local setups, use `--target=docker` via the API container (see `node backend/scripts/addMensClothing.js --help`) and rebuild frontend image so new static WebP assets are served.

## Technical notes

- Catalogue: `backend/scripts/mensClothingCatalogue.js`
- Safe one-time/idempotent importer: `backend/scripts/addMensClothing.js`
- Regression tests: `backend/tests/mensClothingCatalogue.test.js`
- Existing `backend/src/models/Product.js` supports `category` and free-text `type`; `Men`, `Topwear`, `Bottomwear`, and `Footwear` map into current search endpoint.
- Local image URLs use `/products/men-topwear/` and `/products/men-bottomwear/`, served by Vite. They are validated along with existing footwear images.
- Existing `ProductCard.jsx` and product-detail pages are reused, **not replaced**.

If the website doesn't show the new 14 items, confirm the *apply* step succeeded, restart the backend to clear any in-process caches, select the appropriate Men type filter, and hard-refresh the browser.
