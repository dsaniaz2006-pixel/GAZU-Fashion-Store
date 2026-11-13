# GAZU — Phase 2: Cinematic three-model hero

## Scope and audit

Source base: `GAZU_Cinematic_Logo_Fragment_Animation_Updated.zip` (Phase 1).
The existing `frontend/src/components/Home.jsx` previously contained a
three-image *rotating slideshow*. Phase 2 replaces **only that hero** with one
continuous 40% Women / 33% Men / 27% Kids panel composition. The header,
lookbook, editorial story, category cards, benefits, Best of GAZU, routing,
authentication, cart, backend, payment service, Docker and environment setup
remain unchanged.

## Sequence, synchronized with Phase 1

The Phase 1 logo's `BrandIntro.jsx` runs its existing 3.86-second GSAP intro.
At its existing exit point (`BRAND_INTRO_TIMING.exitStart`, about 3.18s), it
calls `onHeroReveal` from the same GSAP timeline, while the fullscreen white
overlay fades away. `StorefrontLayout.jsx` forwards that callback to the
already mounted `CinematicModelHero`, which runs its own **controlled**
GSAP timeline. No timers coordinate the phases.

| Approx. global time | Action |
|---|---|
| 0.00–3.18s | Unchanged GAZU fragment logo and tagline introduction |
| 3.18–3.86s | White overlay fades; the three-model reveal begins |
| 3.18–4.28s | Women clip mask opens, photo scale 1.08 → 1 |
| 3.33–4.43s | Men clip mask opens, photo scale 1.08 → 1 |
| 3.48–4.58s | Kids clip mask opens, photo scale 1.08 → 1 |
| 4.60–5.32s | “LOOKS YOU REMEMBER” reveals upward |
| ~5.4s | Hero fully visible as ordinary homepage content |

GSAP uses `power3.out`, distinct inward/upward clips, photo scale transforms,
and a masked upward title. Animation is killed and reverted on unmount.
React Strict Mode does not intentionally run duplicate timelines; a guard
prevents multiple starts. `prefers-reduced-motion` skips animation.

## Image provenance and deployment limits

- **WOMEN:** The developer preview (`frontend/public/editorial/woman-reference-preview-only.webp`)
  is a frame cropped from the *user-supplied screen recording* of an NS Store
  design. It depicts the woman wearing a pale pinstriped blazer with her hand
  over her forehead. The frame was cropped to avoid embedded headline text.
  Resolution is only 1050×555, so it is *not production-grade*. The origin is
  a third-party design; usage permission for public advertising **has not
  been verified**. To avoid republishing it in production, the build uses the
  previous GAZU Women Unsplash editorial photo by default. Replace the
  `referencePreview` / `photoId` mapping in `cinematicHeroConfig.js` with your
  own licensed high-quality original once acquired.
- **MEN:** Reuses the exact existing hero photo ID
  `photo-1487222477894-8943e31ef7b2`.
- **KIDS:** Reuses the exact existing hero photo ID
  `photo-1519238263530-99bdd11df2ea`.

Men/Kids continue using the original externally hosted Unsplash sources, so
internet access is required for those photos. External image permissions,
model releases, and reliability need verification prior to public launch. A
neutral gradient keeps the page usable if an image fails to load.

## Responsive and accessibility behavior

Desktop has a 40/33/27 grid. Tablet rebalances to 39/32/29 and mobile to
37/30/33 so the Kids model remains readable. Individual CSS object positions
protect faces. All panels share a common height, with no gaps, borders or
rounded cards. The heading uses responsive editorial serif text; overlay
shading is subtle. Images have descriptive alt text and reduced-motion users
see the fully assembled homepage immediately.

The logo still plays once per tab session through existing `sessionStorage`
guards. `http://localhost:5173/?gazuIntro=1` forces replay only in Vite
development mode. The carousel and story sections *already present* beneath
the hero were not modified or expanded in this phase.

## Files

Created:
- `frontend/src/components/brand/CinematicModelHero.jsx`
- `frontend/src/components/brand/CinematicModelHero.css`
- `frontend/src/components/brand/cinematicHeroConfig.js`
- `frontend/src/components/brand/brandIntroTimings.js` (extracted timing constant)
- `frontend/public/editorial/woman-reference-preview-only.webp` (temporary)
- `scripts/cinematic-hero.test.mjs`
- `docs/GAZU_CINEMATIC_MODEL_HERO.md`

Updated:
- `frontend/src/components/Home.jsx` (replaced prior slideshow hero only)
- `frontend/src/components/brand/BrandIntro.jsx` (onHeroReveal timeline hook)
- `frontend/src/layouts/StorefrontLayout.jsx` (registration/coordination)
- `scripts/editorial-hero.test.mjs` (revised hero assertions)
- `package.json` (added focused test command)

## Verification commands

```bash
npm ci
npm run setup
npm run test:brand-intro
npm run test:hero
npm run test:cinematic-hero
npm test --prefix frontend
npm run build --prefix frontend
npm run dev
```

To replay the whole Phase 1 + Phase 2 introduction during local development,
visit `http://localhost:5173/?gazuIntro=1`.

### Verification status

Executed in the build environment:
- `npm run test:brand-intro`: **4 passed**.
- `npm run test:hero`: **4 passed**.
- `npm run test:cinematic-hero`: **9 passed**.
- TypeScript syntax parser: **58 frontend JS/JSX files parsed, 0 syntax errors**.
- `tinycss2`: **3 CSS files parsed, 0 top-level syntax errors**.
- Temporary WebP: **1050×554**, valid WebP.
- `npm ci --prefix frontend --offline`: **failed** (missing npm cache tarball).
- `npm ci --prefix frontend` online attempt: **failed** (npm error: Exit handler never called; this runtime also has Node 22.16 while jsdom requires newer).
- `npm run build --prefix frontend`: **blocked** (`vite: not found`).
- Frontend Vitest and browser visual checks: **not run**, dependencies unavailable.

Use Node.js 24 LTS on your Mac, restore dependencies with `npm ci`, and run
Vitest and the Vite build before treating this as browser-verified.
No database was changed.
