# GAZU original UI applied to Phases 7–12 pages

This package builds on **GAZU_Phases7_to_12_Integrated_Development_Candidate.zip**.
The existing visual language is preserved; no new design framework or second navbar was substituted.

## Reused components

- `StorefrontLayout` still mounts the original `Header` (including the two liquid-glass Waterline nav instances) and `MotionFooter` on every storefront route.
- `GazuEditorialArrival` is the new page-sized adaptation of GAZU's original `CinematicModelHero`: it uses `CINEMATIC_MODELS`, the shared GSAP motion contract (0.7s), the same three Women/Men/Kids editorial images, staggered reveal, high-contrast serif headings and reduced-motion handling. The first-visit full-screen logo intro stays on the homepage only.
- `GazuEditNav` reuses `GazuLiquidSectionNav` for a route-aware liquid-glass navigation linking Shop the Look, Style Finder and New Launches.
- `Lookbook.jsx` embeds the **actual original** `DressLikeSection` with its scroll-triggered reveal and working shop CTA.
- Product cards on the editorial pages use the site's grayscale-to-colour hover treatment.
- The new profile/Admin pages receive a restrained editorial skin, preserving their operational density and existing forms.
- The footer now exposes Shop the Look, Style Finder and New Launches links.

## Routes

- `/shop-the-look` — branded three-model arrival, curated product grid, original DRESS LIKE section.
- `/style-finder` — branded arrival, clickable Heritage / Minimal / Street / Active cards, curated products.
- `/launches` — branded arrival and announcements from the existing marketing API.
- `/account/profile` — existing account liquid navigation, premium-typography forms.
- `/admin/operations`, `/admin/marketing`, `/admin/staff` — existing admin liquid navigation with refined presentation.

## Installation / test commands (Mac)

1. Extract the new ZIP separately. Copy your own existing **root `.env`** (not included) from your working GAZU folder.
2. Use Node.js version supported by the package dependencies (Node 24 LTS is a suitable option).
3. Run `npm ci`, `npm run setup`, `npm run env:check`, then `npm run dev`.
4. Open the three new public routes above and check the header liquid pills, reveal animation, Shop the Look DRESS LIKE section and footer links.
5. Run `npm run test:editorial-expansion` (dependency-free), `npm test --prefix frontend`, `npm run build --prefix frontend`, `npm run test:phases:unit`, `npm test --prefix backend`.
6. For Docker use `docker compose up -d --build` from the project root and open `http://localhost:8080/shop-the-look`.

## Verification performed in this environment

- 47/47 selected pre-existing and new source-level navigation/animation checks passed.
- 89/89 frontend JS, JSX, TS and TSX files parsed cleanly with TypeScript's parser.
- 91/92 broader Node source checks passed; the remaining existing auth-env check could not run because `dotenv` was not installed in this execution environment.
- Frontend npm dependency installation failed in this environment (npm exit-handler error and incompatible runtime engine warnings), so the React/Vitest suite, frontend production bundle and browser E2E could not be fully verified here. The new `editorialExpansion.test.jsx` file is included for running on a configured machine.
- No database seeds, order-number updates, user migrations, changes to payment processing or secret files were performed.

## Boundaries

- The model hero uses the original GAZU editorial photo IDs. For production, verify the underlying photography licenses and availability.
- Buttons that trigger smooth scrolling are display/navigation only. No new transactions or marketing workflows were introduced.
- This is a frontend visual parity update on top of the previous **development candidate**, not a fresh production certification of Phases 7–12.
