# Men's Footwear — added from your screenshots (14 products)

The images supplied contain **14 distinct products**, not 15: five Jordan/Nike shoes, two loafers, one Chelsea boot, four PUMA sneakers and two adidas shoes. Each collage image was cropped into a separate WebP product image. The source screenshots are not included in the release ZIP; the cropped assets are in `frontend/public/products/men-footwear/`.

The new products are **Men → Footwear** (`category: "Men"`, `type: "Footwear"`) and inherit the existing GAZU `ProductCard` design, hover zoom, Quick View, wishlist and Add to Bag. Discounted items show both prices. The supplied screenshot prices were used, and demo stock defaults to **10 each** until an administrator changes it. Only one photo per product is available; no extra colours or angles were invented.

## Add the 14 products to an EXISTING MongoDB database (Atlas)

1. Extract this ZIP to a **new** project folder. Copy your existing **root `.env`** file into the new folder (it is intentionally not included in shared ZIPs). Check that `GAZU_DB_MODE=atlas` and `MONGODB_URI` points to the correct database.
2. From the project root, install dependencies if needed: `npm install`, `npm ci --prefix backend`, `npm ci --prefix frontend`, `npm ci --prefix payment-service`.
3. Preview what would be created (no writes):
   `npm run catalogue:footwear -- --target=atlas`
4. When the list and target database are right, add only missing products:
   `npm run catalogue:footwear -- --target=atlas --apply --confirm=ADD_FOOTWEAR`
5. Start normally using `npm run dev`. Open **MEN → FOOTWEAR**, or `/shop?category=Men&type=Footwear`.

The importer is **additive and idempotent**: no unrelated products, orders, users or carts are changed; it never overwrites existing product fields or reactivates archived products. A rerun will only create still-missing entries. Prices, inventory and sale prices can be edited in Admin.

For a **fresh** database, `npm run seed --prefix backend` creates the three original demo products AND the 14 new footwear products along with the configured admin account. Do **not** rerun `catalogue:three` after adding footwear: that older cleanup is designed for the historical three-product-only dataset and will refuse unknown active products.

For Docker-local mode, use the `--target=docker` commands shown in `node backend/scripts/addFootwear.js --help` inside the API container, and rebuild the frontend image to include the new WebP assets.

If the products do not appear, confirm the database import succeeded, restart the backend (to refresh catalogue cache), and hard-refresh the browser. The local footwear images are served by the **frontend**, not through backend `/uploads`.
