# GAZU — Dual Liquid Glass Navigation and Warm Grey Theme

## Scope
Updated the latest Liquid Glass Navbar project only. The existing primary Waterline pill remains at the **top left**. A second independent pill covers **Search, Sign In/Account, Wishlist, and Bag (live count)** at the **top right**; admins also see Admin. The GAZU wordmark stays centered. The right pill uses the same React/WebGL water shader and CSS fallback as the left.

## Navigation behaviour
- **Search** toggles the existing search panel, including clicking it again to close it. No new search endpoint was added.
- **Sign In / Account** navigates to the existing `/account` route.
- **Wishlist** navigates to `/wishlist`, with a dynamic saved-item count.
- **Bag** navigates to `/cart`, with a dynamic cart quantity.
- **Admin** is available only when logged in as an admin, using the existing `go("admin")` handler.
- Both liquid pills highlight the current destination, with no false highlight on unrelated routes. A unique SVG filter ID per pill prevents a shared refraction mask conflict.

## Warm Light Grey
The global paper surface is now **`#e5e4de`**, exactly the existing footer background. This color applies to the site shell, body, header, Shop and other normal page backgrounds, the Summer section, Dress Like, category cards' surrounding section, and Best of GAZU. Slightly lighter warm surfaces (`#f0eee8`) distinguish the brand strap and perk tiles. The existing pure-white cinematic logo intro, hero image areas, dark brand contrast sections and white controls are intentionally preserved for readability.

## Responsive behaviour
Desktop (>1340px) has both Waterline pills flanking the GAZU wordmark. At 1340px and smaller, the existing hamburger menu and compact Search/Account/Wishlist/Bag buttons replace the wide pills to avoid collisions. The mobile navigation and account functionality remain accessible. Reduced-motion preferences disable decorative WebGL-driven animation, while CSS fallback continues to work.

## Files changed
- `frontend/src/components/Header.jsx`: dual pill + mobile utility fallback.
- `frontend/src/components/ui/GazuLiquidUtilityNav.jsx`: **new** route-aware utility actions.
- `frontend/src/components/ui/liquidNavRoutes.mjs`: utility active-state helper.
- `frontend/src/components/ui/liquid-glass-navbar.tsx`: unique per-instance SVG refraction filter and repeatable selected-action callback.
- `frontend/src/styles.css`: warm paper palette, header/utility CSS, responsive treatment.
- `frontend/src/components/{summer/SummerGallery.css,dress-like/DressLikeSection.css,categories/FashionCategorySection.css}`: section backgrounds.
- `scripts/liquid-utilities.test.mjs`: **new** focused checks.
- `scripts/liquid-navbar.test.mjs`: accessibility-label assertion updated for configurable labels.
- `package.json`: adds `test:liquid-utilities`.

## Running on your Mac
Preserve your private root `.env` outside the ZIP, then from the extracted `gazu-store` directory:

```bash
npm ci
npm run setup
npm run test:liquid-nav
npm run test:liquid-utilities
npm run build --prefix frontend
npm run dev
```

Visit `http://localhost:5173`. Check both header pills on a wide browser, Search opening/closing, sign-in, wishlist counts, bag counts and the hamburger fallback on a narrow viewport. Inspect DevTools Console and test both light and reduced-motion preferences. All source-only checks can run without a database, but account and cart interactions need the existing backend running.

## Verification limits
The source-only tests and syntax checks are reported separately. Runtime React interaction, CSS visual rendering, WebGL shader quality, full Vite build, and backend integrations must be checked on a machine with the required npm packages and services installed; no claims of successful live verification are made without those results.
