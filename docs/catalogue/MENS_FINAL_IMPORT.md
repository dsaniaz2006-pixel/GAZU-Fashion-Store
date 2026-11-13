# GAZU Men — Bottomwear, Winterwear & Accessories (November 6, 2026)

## Contents and provenance

This update is based on **19 supplied screenshots** (two accessories card-holder pages, ten bottomwear/editorial screenshots, six winterwear screenshots, and one sunglasses screenshot). Every new product image was individually cropped and saved as local WebP.

- **12 newly indexed Bottomwear products**: jeans, cargos and trousers (including four corduroy items lacking visible prices).
- **15 newly indexed Winterwear products**: denim jackets, faux-suede/leather-effect jackets, jumpers, cardigans and transitional jackets.
- **5 newly indexed Men's Accessories**: two leather card holders and three sunglasses.
- **4 additional Bottomwear editorial images**: Khaki, Cargo, Linen and Denim. The screenshots are category imagery without product names/prices, so these are visual browse tiles, **not products**.
- The separately supplied **Levi's 568 Blue Loose Fit Mid Rise Jeans** image is already part of the previous Topwear/Bottomwear import. It remains there and is **not duplicated**.

All product records use the original GAZU ProductCard, checkout, Quick View, wishlist and hover animations. Existing 14 Footwear and 13 Topwear + 1 Bottomwear entries stay untouched. After every import, the full new catalogue holds **60 distinct additions** (14 footwear + 14 earlier clothing + 32 final clothing/accessories), plus pre-existing original GAZU stock.

### Critical price note

The 4 corduroy products' screenshot contains **no visible prices**. They are stored as price-pending, `quantity: 0`, `inStock: false`, `tag: "PRICE PENDING"`. A 1-paise internal placeholder is **not a selling price**; GAZU hides it from customer product cards/details. Server cart, checkout and mock payments reject products still tagged `PRICE PENDING` even if their stock is accidentally toggled. Admin must enter a verified rupee price, remove the pending tag, enter real quantity, and mark in stock before sale.

For all other new listings, stock of 10 is **demonstration-only**, not a claim of physical stock. Verify inventory in Admin before taking real orders. If reference displays a price range, the starting price is used. Ratings/comments are *not* imported as genuine customer reviews.

## Running on macOS

1. Unzip the new complete project and open its inner `gazu-store` folder in VS Code.
2. Copy the root `.env` from your previous working version. **Do not create a new Atlas database or overwrite its data.** Set `GAZU_DB_MODE=atlas` and ensure `MONGODB_URI` is your intended Atlas deployment.
3. From the project root:

```bash
npm ci
npm run setup
npm run env:check
```

4. If you've already imported earlier Footwear and Topwear, you only need the **new** addition:

```bash
npm run catalogue:mens-final -- --target=atlas
```

This previews the collection without changing MongoDB. Verify the database name and products, then apply:

```bash
npm run catalogue:mens-final -- --target=atlas --apply --confirm=ADD_MENS_FINAL
```

5. If you have **not** imported the earlier collections, first preview and apply both:

```bash
npm run catalogue:footwear -- --target=atlas
npm run catalogue:footwear -- --target=atlas --apply --confirm=ADD_FOOTWEAR
npm run catalogue:mens-clothing -- --target=atlas
npm run catalogue:mens-clothing -- --target=atlas --apply --confirm=ADD_MENS_CLOTHING
```

6. Start GAZU:

```bash
npm run dev
```

Open http://localhost:5173/shop?category=Men&type=Bottomwear or change `type=` to `Winterwear`, `Accessories`, `Footwear` or `Topwear`.

**Important:** Import commands are additive and skip matching names; they do not delete, replace, unarchive or re-price existing database records. If you update the ZIP again, running the import twice skips existing products. If you use Docker, read `--help` and use the isolated Docker target instead of Atlas.

### Check catalogue without Atlas

```bash
node --test backend/tests/footwearCatalogue.test.js backend/tests/mensClothingCatalogue.test.js backend/tests/mensFinalCatalogue.test.js
```

The screenshot images are references for this project. Before selling branded products publicly, confirm you have permission to use the photography, correct stock and authentic product availability.
