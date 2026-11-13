> **2026-11-07 update:** The hero now has distinct Women / Men / Kids photography, department-linked shop buttons and a standalone GSAP-based first-visit GAZU fragment intro. See [GAZU_FRAGMENT_INTRO.md](GAZU_FRAGMENT_INTRO.md) for the new animation. See [GAZU_HERO_SLIDES.md](GAZU_HERO_SLIDES.md).

# GAZU editorial landing page — 2026-11-06

## Reference and scope

Visual reference: [NS Store — Fashion Ecommerce Website Design, Linur for Eloqwnt](https://dribbble.com/shots/26477990-NS-Store-Fashion-Ecommerce-Website-Design).
The user-provided screen recording shows a centered high-contrast serif brandmark, a large photographic hero reading "Looks You Remember", an angled horizontal summer lookbook, a split "Dress Like" fashion story, category cards and a membership feature. The GAZU implementation takes inspiration from that visual language but uses original GAZU copy and code, not copied design assets.

## Implementation

- Replaced the prior landing page sections in `frontend/src/components/Home.jsx` with a responsive campaign slider, lookbook rail, editorial split, department cards, account-benefits panel, Best of GAZU (still fetched from the existing API), existing service benefits and an editorial closing panel.
- Reworked the header **on the homepage only** in `frontend/src/components/Header.jsx`: white minimal navigation, center serif GAZU/STUDIO wordmark, direct Men/Women/Kids, Best Sellers, Our Story, Search, Account, Wishlist and Bag paths. Other routes retain their previous header layout.
- Added scoped `.ns-*` CSS to `frontend/src/styles.css`. Shop, product, checkout, authentication and admin styling are not redesigned.
- All CTAs use existing `StorefrontContext.go()` routes. Slides can be paused, advanced and individually selected, the lookbook scroll controls scroll real content, and mobile menu/search controls remain interactive.
- New Vitest UI tests are in `frontend/src/tests/editorialLanding.test.jsx`.

## Photography and usage

Hero/lookbook photos use externally served Unsplash editorial photos at `images.unsplash.com` using IDs already supported by the existing `image()` helper. These are **editorial styling images**, not verified photos of the products for sale, so they do not modify MongoDB image references or product cards. Unsplash's license permits general website/commercial use, but identifiable people and trademarks may require additional clearance for advertising campaigns; review each selected image before public release. See https://unsplash.com/license and https://help.unsplash.com/en/articles/14224409-what-if-there-is-a-brand-logo-in-an-image-on-unsplash. The Dribbble reference's images, wordmark and code were not copied.

Image IDs selected: `photo-1529139574466-a303027c1d8b`, `photo-1539109136881-3be0616acf4b`, `photo-1509631179647-0177331693ae`, `photo-1496747611176-843222e1e57c`, `photo-1524504388940-b1c1722653e1`, `photo-1487222477894-8943e31ef7b2`, `photo-1534528741775-53994a69daeb`, `photo-1516257984-b1b4d707412e`, `photo-1483985988355-763728e1935b`, `photo-1506794778202-cad84cf45f1d`, `photo-1519238263530-99bdd11df2ea`. For production, consider storing reviewed, authorized photos locally so the hero works without external requests.

## Run and test

From project root with the existing `.env` preserved:

```bash
npm ci
npm run setup
npm test --prefix frontend
npm run build --prefix frontend
npm run dev
```

Visit `http://localhost:5173/` and check desktop/mobile. The homepage fetches existing `/api/products?limit=4` and shows the same three database products when the active DB contains only three. The code does not import, add or delete catalogue records. Docker is unchanged (`docker compose up -d --build`, `http://localhost:8080/`).

## Verification run in this environment

- TypeScript parser: all frontend JSX files parsed successfully; no parsing errors.
- `tinycss2`: `frontend/src/styles.css` parsed with zero syntax errors.
- `npm ci --prefix frontend --offline`: **blocked** (`ENOTCACHED`, `yallist-3.1.1.tgz` absent from npm cache); the environment has no internet registry access.
- `npm test --prefix frontend`: **blocked** (`vitest: not found`, exit 127).
- `npm run build --prefix frontend`: **blocked** (`vite: not found`, exit 127).
- Live localhost browser layout and Docker image have **not been verified** in this environment. Run the commands above on your Mac before deployment. No backend, catalogue, checkout, auth, or database data were changed.
