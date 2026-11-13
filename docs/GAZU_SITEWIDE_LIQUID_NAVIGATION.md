# GAZU — Site-wide Liquid Glass Navigation Upgrade

## Audit

The uploaded ZIP was `GAZU_Dual_Liquid_Glass_Warm_Grey_Updated(1).zip`.
It already contains two Waterline/Nimbus header navbars with unique SVG refraction
IDs, React Router navigation, WebGL support, and a CSS fallback. The other
navigation areas were still plain rectangles or underlined text.

| Where | Before | After |
|---|---|---|
| Desktop header left and right | Nimbus water pills | Kept unchanged |
| Men's shop section bar | Six rectangular buttons | Nimbus Waterline segmented navigation |
| Shop pagination | Plain Previous / Next buttons | Nimbus Waterline segmented controls, disabled at boundaries |
| Account pages | Plain account/order links | Nimbus Waterline route-aware tabs |
| Admin pages | Plain products/orders/statistics links | Nimbus Waterline route-aware tabs |
| Mobile dropdown navigation | Plain vertical links | CSS glass segmented links with active-route indicator |
| Mobile utility buttons | Plain icon/text actions | Lightweight glass interaction states |
| Footer Explore and Help | Plain buttons | Semantic nav groups with glass hover/focus |
| Footer privacy/terms and topbar help actions | Plain text actions | Matching, lightweight glass hover/focus |
| Shop filters | Plain inputs/selects | Warm translucent panel and controls (original behavior unchanged) |

## Technical approach

- `frontend/src/components/ui/GazuLiquidSectionNav.jsx` is a controlled wrapper
  around the existing `liquid-glass-navbar.tsx`, sharing its shader and CSS
  fallback, not adding a new animation library.
- `liquidSectionRoutes.mjs` defines Men filter values, Account and Admin routes,
  and determines active selection from the current URL.
- Men's selection continues to use `change("type", section.value)` and
  `useSearchParams`, so server filtering, pagination resets, and sort state are
  preserved. The empty value represents **ALL MEN**.
- Account and Admin navigation use `useNavigate` for client-side transitions.
- Pagination displays the current page in the liquid selector; Previous/Next
  become disabled at the boundaries and keyboard arrow navigation skips
  disabled controls.
- The menu is horizontally scrollable on small screens, avoiding tiny or
  overlapping buttons. It keeps all labels visible.
- WebGL continues to run only for visible liquid navigation instances. Mobile
  menus and footer quick links deliberately use CSS glass rather than spawning
  extra WebGL contexts for every link. All retain keyboard focus indicators.
- `prefers-reduced-motion` disables decorative motion while keeping controls
  usable.

## Files created

- `frontend/src/components/ui/GazuLiquidSectionNav.jsx`
- `frontend/src/components/ui/liquidSectionRoutes.mjs`
- `scripts/sitewide-liquid-nav.test.mjs`
- `docs/GAZU_SITEWIDE_LIQUID_NAVIGATION.md`

## Files modified

- `frontend/src/components/ui/liquid-glass-navbar.tsx` — adds disabled-item
  support to safeguard pagination.
- `frontend/src/pages/Shop.jsx` — liquid Men's navigation and pagination.
- `frontend/src/layouts/AccountLayout.jsx` — liquid Account tabs.
- `frontend/src/layouts/AdminLayout.jsx` — liquid Admin tabs.
- `frontend/src/components/Header.jsx` — mobile active selection.
- `frontend/src/components/Footer.jsx` — semantic navigation groups.
- `frontend/src/styles.css` — layout, glass surfaces, scrolling, focus,
  reduced-motion, and mobile styles.
- `package.json` — `test:sitewide-liquid` command.

## Run and verify on macOS

Keep your existing root `.env` private and **do not overwrite it** with the
example file. Run in the extracted `gazu-store` folder:

```bash
npm ci
npm run setup
npm run test:sitewide-liquid
npm run test:liquid-nav
npm run test:liquid-utilities
npm run build --prefix frontend
npm run dev
```

Visit:

- `/shop?category=Men` — All Men section is selected.
- `/shop?category=Men&type=Topwear` — Topwear selected.
- `/shop?category=Men&type=Winterwear` — Winterwear selected.
- `/account` and `/account/orders` — account tabs (signed-in customer).
- `/admin/products`, `/admin/orders`, `/admin/stats` — admin tabs (admin account).
- Navigate through multiple catalog pages to check Previous/Next edge states.
- Narrow the window below 1340 px to check the mobile header.
- Use keyboard Tab/arrow keys; test `prefers-reduced-motion`; verify image and
  product routes, search, wishlist and cart remain functional.

## Actual verification in packaging environment

- New, dependency-independent site-wide navigation tests: 7/7 passed.
- Previous focused header/animation tests: 57/57 passed.
- TypeScript JS/JSX/TSX/MJS parsing: 86 files, 0 parse errors.
- CSS parsing: 6 stylesheets, 0 parse errors.
- `npm ci --prefix frontend --offline`: blocked (`ENOTCACHED`, `yallist` tarball).
- `npm run build --prefix frontend`: blocked (`vite: not found`).
- Full browser/React interaction and WebGL rendering: **not verified** in this environment.
- No backend code, MongoDB records, payments, auth, or customer data modified.

The uploaded base ZIP is a previous dual-navbar build, not the later
Men's clothing-rail build. This upgrade makes no claims about adding the
clothing-rail feature into that particular snapshot.
