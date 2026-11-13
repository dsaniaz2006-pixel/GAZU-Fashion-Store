# GAZU Product Shelf UI integration

## Source and scope

Reference: https://21st.dev/@aakashmehra/components/skincare-product-shelf (MIT-listed component, creator @aakashmehra).
The supplied snippet is only a usage demo. Its underlying source implementation was not supplied; therefore, this is a custom React/CSS adaptation of the interaction and visual language for GAZU, not a verbatim copy of the source component.

Reference video inspection: an off-white, multi-row shelf view that opens into a spacious, two-column product information layout; an expansive product image is shown beside title, reviews, price, quantity, add-to-bag and expandable detail areas.

## Actual implementation

- `frontend/src/components/ui/skincare-product-shelf.jsx`: product shelf driven exclusively by `GET /api/products` pagination results; clickable shelf product that expands into its own item view; actual stock, price, reviews summary, wishlist, live add-to-bag, and navigation to full review page.
- `frontend/src/components/ui/skincare-product-shelf.css`: warm-ivory shelves, object-fit image treatment, active-detail panel and responsive behavior.
- `frontend/src/pages/Shop.jsx`: selectable Shelf/Grid views. Search, category, sorting, and pagination remain backed by the server; the original grid stays available.
- `frontend/src/pages/ProductDetail.jsx` and `ProductDetail.css`: full visual redesign of the **existing route**, not a second product route. Main product image, optional real gallery images, rating summary, price, description, colour/style/stock fields, backend-supported quantity selector, cart action, product information accordions, existing write/delete review forms, review list and pagination.
- `frontend/src/context/CartContext.jsx`: optional quantity argument to `cart.add(product, quantity)`, using the existing backend `POST /cart/items` schema. Existing one-unit callers work unchanged.
- `scripts/product-shelf.test.mjs`: dependency-free source regression checks.

**Source of truth:** GAZU's MongoDB Product and Review records, not demo cosmetics or invented size/price/stock information. There are no imaginary product variants, ingredients, ratings, delivery promises, product photographs, or extra inventory records.

## Behavior and limitations

The original Product Shelf component uses detailed 3D-looking skincare SVGs; GAZU now displays the actual fashion inventory images instead. The shelf-to-detail movement is a light CSS transition, **not** the original 3D bottle turn. A real backend product has one `img` field; multiple thumbnails render only if an actual `images` array exists in the API response. No fake back or side views are generated.

Full reviews remain in `/product/:id` and are connected to the existing Product Review API. Price pending and out-of-stock products are non-purchasable. A guest Add-to-bag routes to Sign In using the existing storefront flow.

This is a frontend feature plus one backward-compatible client-side cart quantity argument; no Express routes, schemas, MongoDB records, OAuth, payments or Docker configuration are changed.

## Run on macOS

1. Preserve and copy your existing private root `.env` into the extracted `gazu-store` directory; do not include it in source control.
2. Run `npm ci`, `npm run setup`, `npm run test:product-shelf`, `npm test --prefix frontend`, and `npm run build --prefix frontend`.
3. Start with `npm run dev` and open http://localhost:5173/shop . Choose `Shelf view`, open a product, and follow its `Item details & reviews` link.
4. Verify signed-in add-to-bag for quantity 1 and greater, review submission, duplicate-review warning, deletion, search/filter/sort/pagination, mobile responsiveness, browser errors, and reduced motion.
5. In Docker, build the frontend with `docker compose up -d --build` and open http://localhost:8080/shop .

## Tests

See the accompanying response for checks actually executed in this environment. Live MongoDB, external images, OAuth, payment flows and full browser checks must be confirmed on the user's system.
