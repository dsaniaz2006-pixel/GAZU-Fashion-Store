# GAZU — Phase 5: Editorial Hero Reveal & Women/Men/Kids Category Cards

## Scope

This is a **frontend-only** update of the previous Phase 1–4 animation project.
The existing homepage is preserved, with a refined **single** three-model hero and an updated **single** category-card section. No backend, database, API, cart, payment, or environment changes were made.

## Reference observation (NS Store video supplied by project owner)

The reference recording is ~25.7 s. At approximately 4.5–7 s, a white intro transitions into a large editorial fashion image, rising from the lower edge into its fixed area. A large centered white serif title and small CTA appear over the photograph. The reference hero contains one main model, but the existing GAZU requirement remains one **Women | Men | Kids** seamless composition.

At approximately 14.5–17.5 s, the reference displays **three tall portrait cards** at equal height, with narrow horizontal gaps, very subtle rounded edges, and bottom labels. Hovering over an individual card changes its photograph to grayscale and its lower label to a solid white pill with dark text; neighboring cards remain in color. The recording does not establish a zoom, drag gesture, or pinned-scroll effect, so none was introduced. The exact image crops and hover easing are visual approximations based on visible frames rather than measurable underlying website styles.

## Hero changes

The original `CinematicModelHero` (40 / 33 / 27 desktop proportions) remains the sole homepage hero. Its three existing photographic sources and crop coordinates are preserved. The existing Phase 1 `BrandIntro` completion callback still initiates the hero while the white overlay fades. A coordinated GSAP timeline now also reveals the **entire image strip from bottom to top** while the Women, Men, and Kids panels rise with a 0.12 s stagger. All individual masked movements, image settlements, title, supporting text and CTA tweens have duration `MOTION.duration` (0.7 s). The CTA still opens the existing Shop collection. The hero starts with a white background instead of dark gray to match the NS transition.

Relative to the start of the white-overlay exit:

| Element | Start | Duration |
| --- | ---: | ---: |
| Phase 1 white overlay fade | 0.00 s | 0.70 s |
| Shared hero reveal mask | 0.10 s | 0.70 s |
| Women panel + photo settle | 0.10 s | 0.70 s |
| Men panel + photo settle | 0.22 s | 0.70 s |
| Kids panel + photo settle | 0.34 s | 0.70 s |
| `LOOKS YOU REMEMBER` | 0.55 s | 0.70 s |
| Supporting caption | 0.67 s | 0.70 s |
| Collection CTA | 0.75 s | 0.70 s |

The animation plays on the existing first-visit, once-per-tab schedule. Returning in the same tab shows the finished hero immediately. Reduced-motion users see the completed hero. GSAP contexts are cleaned up on unmount. A failed animation chunk should not leave the hero permanently hidden.

**Image note:** The woman preview crop from the earlier user-provided video is still development-only; the previous production Women editorial source remains in production. The existing Men and Kids hero sources were not changed. The project uses externally hosted Unsplash IDs for most editorial media and requires connectivity to display them. No new photographs have been added.

## Category-card changes

The homepage's former three large buttons (`ns-departments`, including subtitle blocks) have been replaced **in place** by `FashionCategorySection`, without adding another category section. The component uses the exact previous Home category image IDs:

| Card | Existing photo ID | Browser route |
| --- | --- | --- |
| WOMEN | `photo-1483985988355-763728e1935b` | `/shop?category=Women` |
| MEN | `photo-1506794778202-cad84cf45f1d` | `/shop?category=Men` |
| KIDS | `photo-1519238263530-99bdd11df2ea` | `/shop?category=Kids` |

Cards are semantic React Router links (no nested buttons), with an aspect ratio of 3:4 on desktop, ~14 px gaps, soft 5 px corners, and bottom-centered pill labels. The first viewport reveal uses a one-time ScrollTrigger and 0.12 s per-card stagger, with **0.7 s for each card**.

Hover and keyboard focus operate per card. The photo transitions from full color to grayscale; the label transitions from translucent white to solid white with dark text. Mouse leave restores the original state in 0.7 s. There is no image zoom, enlargement, or rotation. Touch devices stay in color until clicked; one tap navigates normally. On small screens cards stack vertically rather than making people tiny. Broken external photos show a neutral text fallback rather than broken-image icons.

The shared duration lives in `frontend/src/animations/motionConfig.js`. The continuous THIS SUMMER loop speed is unchanged. The DRESS LIKE animation and subsequent homepage sections are preserved.

## Files modified

- `frontend/src/components/Home.jsx`: replace old inlined category buttons with the new section.
- `frontend/src/styles.css`: remove obsolete `ns-department*` presentation rules.
- `frontend/src/components/brand/CinematicModelHero.jsx`: rising strip reveal, 0.7-second choreography, fail-open behaviour.
- `frontend/src/components/brand/CinematicModelHero.css`: white initial surface, bottom-up mask, and safe completed-hero state.
- `frontend/src/components/brand/cinematicHeroConfig.js`: shared 0.7-second timing and 0.12-second stagger.
- `frontend/src/tests/cinematicModelHero.test.jsx` and `frontend/src/tests/editorialLanding.test.jsx`: update assertions to the new behavior without removing regression coverage.
- `scripts/cinematic-hero.test.mjs`: update mask/stagger regression expectations.
- `package.json`: add `test:editorial-categories` script.
- `README.md`: link to this guide.

## Files added

- `frontend/src/components/categories/fashionCategories.js`
- `frontend/src/components/categories/FashionCategorySection.jsx`
- `frontend/src/components/categories/FashionCategorySection.css`
- `frontend/src/tests/fashionCategories.test.jsx`
- `scripts/phase5-editorial-categories.test.mjs`
- `docs/GAZU_PHASE5_EDITORIAL_CATEGORIES.md`

## Running on macOS

Keep your own existing **root `.env`**; do not upload secrets. From the extracted `gazu-store` root:

```bash
npm ci
npm run setup
npm run test:editorial-categories
npm run test:cinematic-hero
npm test --prefix frontend
npm run build --prefix frontend
npm run dev
```

Open `http://localhost:5173`. During development, use `http://localhost:5173/?gazuIntro=1` to replay the logo-and-hero sequence. Scroll past THIS SUMMER and DRESS LIKE to reach the three cards. Hover each card separately and test keyboard Tab focus. Then test `/shop?category=Women`, `/shop?category=Men`, and `/shop?category=Kids` directly. Test portrait layouts on narrow screens and enable macOS Reduce Motion to check the static alternative.

## Verification and remaining limitations

Source tests and syntax checks were executed and their actual results are summarized in the delivery report. Full Vitest/build verification requires dependency installation on a machine with package registry access; in this runtime `npm ci --prefix frontend` failed with `Exit handler never called`, so the complete browser build could not be verified here. Pixel-perfect hover comparisons against the video, live external photo loading, authentication, checkout, and browser interaction tests are not claimed as passed.

No new images, database entries or backend changes were introduced.

### Actual verification in this delivery environment

| Command/check | Observed result |
| --- | --- |
| `node --test scripts/brand-intro.test.mjs scripts/editorial-hero.test.mjs scripts/cinematic-hero.test.mjs scripts/this-summer.test.mjs scripts/dress-like.test.mjs scripts/phase5-editorial-categories.test.mjs` | **39 passed, 0 failed** |
| TypeScript parser over `frontend/src` and `scripts` JS/JSX/MJS | **77 files parsed, 0 syntax errors** |
| PostCSS parser over `frontend/src` CSS | **6 files parsed, 0 errors** |
| `npm ci --prefix frontend --prefer-offline --fetch-retries=0` | **Blocked** (`npm error Exit handler never called`; project dependencies unavailable) |
| `npm test --prefix frontend` | **Blocked** (`vitest: not found`) |
| `npm run build --prefix frontend` | **Blocked** (`vite: not found`) |
| Browser visual + live external photo testing | **Not run** (no working frontend bundle) |

These results are not evidence that the full storefront build or browser interaction has passed. The new Vitest component tests are included for execution after installing dependencies on macOS.
