# GAZU — Phase 4: DRESS LIKE and shared 0.7-second motion

## Scope and source

This phase changes only the frontend visual experience. Backend routes, API schemas, database records, authentication, Google/OTP, inventory, payments, admin, Docker, and environment handling are untouched. It uses the Phase 3 rolling-gallery project as its base.

### Video study (user-supplied NS Store recording, approximately 11.5–14 seconds)

- Reference viewport shows a **white, spacious editorial composition** rather than a typical product grid.
- A **portrait image** occupies the left side (roughly 40–45% of the reference content area), with a model wearing a dark burgundy ensemble, black eyewear, against a saturated burgundy backdrop.
- A very large, pale gray **serif decorative letter** straddles the image/right-side boundary, mostly behind the content.
- **DRESS LIKE** appears as a black, regular-weight editorial serif heading on the right.
- The visible attribution reads `@JONIDAMALIQI` and the small dark CTA reads *Unlock the Look* in the source. This implementation intentionally adapts those to `@GAZU.STUDIO` and `EXPLORE COLLECTION` so a third-party creator is not represented as GAZU's own collaborator.
- Entrances appear during vertical scrolling. The recorded 1fps sampling is insufficient to measure exact easing, discrete duration, an independent parallax, or hover responses. Therefore **ScrollTrigger `once: true`** and `power3.out` are controlled GAZU approximations, not claims of frame-exact reproduction.
- No evidence of pinned scrolling or an ongoing parallax: none was added.

### Photograph and rights

`DressLikeSection` reuses **exactly** the previous GAZU homepage's story image ID, `photo-1539109136881-3be0616acf4b`, through `frontend/src/format.js`. It uses the existing production URL and was not downloaded, modified, or replaced. Its pose and background are **not identical** to the reference's burgundy studio image. The source image remains externally hosted; check availability and appropriate usage permissions prior to production launch. The section uses a burgundy-colored fallback if the image fails. No NS Store photograph or video frame is embedded in the ZIP.

## Layout and motion

- Large portrait image at left; text block at right; clean white background; oversized pale serif `S` behind the boundary.
- Photo wrapper has `aspect-ratio: 0.85`, `overflow: hidden`, and `object-fit: cover`.
- On screens below 700px the image and copy stack vertically, while the heading, body and button remain readable and usable.
- Text remains in the DOM for screen readers. The decorative watermark is `aria-hidden`. The CTA is a native button connected to the existing `openCollection("All")` navigation.
- **Reduced motion:** skip the GSAP timeline and leave the content visible and static, including the continuous Summer animation already respecting this setting.
- `gsap.context()` and cleanup prevent stale ScrollTrigger instances on navigation/unmount or Strict Mode effect replay.

### Phase 4 entrance sequence (individual tweens all 0.7s)

| Element | Timeline start | Individual duration | End |
|---|---:|---:|---:|
| Decorative `S` | 0.00s | 0.70s | 0.70s |
| Photo clipping mask | 0.10s | 0.70s | 0.80s |
| Photo scale 1.06 → 1.00 | 0.10s | 0.70s | 0.80s |
| DRESS LIKE masked heading | 0.25s | 0.70s | 0.95s |
| Supporting text | 0.40s | 0.70s | 1.10s |
| Collection CTA | 0.55s | 0.70s | 1.25s |

The animation is triggered once per component mount when its section reaches about 80% of viewport height. The overall overlap sequence lasts **about 1.25 seconds**. Discrete hover transitions are also 0.7 seconds. No arbitrary 0.7-second pauses were introduced.

### Shared animation duration contract

`frontend/src/animations/motionConfig.js` holds `MOTION.duration === 0.7`, `MOTION.ease === "power3.out"`, and `MOTION.stagger === 0.12`. All Phase 1–4 timed motion is linked to this config or follows the 0.7s CSS transition standard.

- Phase 1: 12 logo fragments, full-logo crossfade, scale settle, tagline, overlay exit each 0.7s. Static brand hold is not an animation.
- Phase 2: women/men/kids panel masks, photo scale settlement, title and supporting copy each 0.7s. Existing 0.15s stagger retained; the full reveal lasts longer than 0.7s.
- Phase 3: THIS SUMMER heading, gallery viewport entrance and CTA entrance each 0.7s. CTA hover is 0.7s. **The infinite gallery's duration remains a function of track width and pixels-per-second**, so its cinematic speed isn't damaged.
- Phase 4: decorative lettering, image mask and scale, heading, supporting copy, CTA each 0.7s.

## Files added

- `frontend/src/animations/motionConfig.js`
- `frontend/src/components/dress-like/DressLikeSection.jsx`
- `frontend/src/components/dress-like/DressLikeSection.css`
- `frontend/src/tests/dressLike.test.jsx`
- `scripts/dress-like.test.mjs`
- `docs/GAZU_DRESS_LIKE_PHASE4.md`

## Existing files changed

- `frontend/src/components/Home.jsx` — replaces only the previous static `ns-story` section with the new component.
- `frontend/src/styles.css` — removes old unused story selectors; preserves other sections.
- `frontend/src/components/brand/BrandIntro.jsx` — shared 0.7s tweens and watchdog update.
- `frontend/src/components/brand/brandIntroTimings.js` — centrally configured timeline starts and durations.
- `frontend/src/components/brand/CinematicModelHero.jsx` — panel, scale, heading and supporting text durations standardized.
- `frontend/src/components/brand/cinematicHeroConfig.js` — shared durations, adjusted title time to follow 0.7s masks.
- `frontend/src/components/brand/CinematicModelHero.css` — CTA hover transition duration.
- `frontend/src/components/summer/ThisSummerSection.jsx` — one-time ScrollTrigger entrance, without affecting continuous track.
- `frontend/src/components/summer/SummerGallery.css` — 0.7s CTA hover transition.
- `scripts/cinematic-hero.test.mjs` — updates previously valid >=1s duration expectation to the new 0.7s requirement.
- `package.json` — adds `npm run test:dress-like`.
- `README.md` — adds Phase 4 guide link and commands.

## Verification executed in packaging environment

- `node --test scripts/dress-like.test.mjs scripts/brand-intro.test.mjs scripts/cinematic-hero.test.mjs scripts/this-summer.test.mjs scripts/editorial-hero.test.mjs`: **32 passed, 0 failed**.
- `node --test scripts/*.test.mjs`: **37 passed, 1 blocked**. The pre-existing `scripts/auth-env.test.mjs` fails because `backend/src/config/env.js` cannot import `dotenv` (package not installed here); not caused by the Phase 4 source changes.
- TypeScript JSX/JS parser: **73 JS/JSX/MJS frontend and script files parsed, 0 syntax issues**.
- PostCSS parser: **5 relevant stylesheets parsed, 0 syntax issues**.
- `npm ci --prefix frontend --offline`: failed (`ENOTCACHED`, `yallist@3.1.1`).
- `npm ci --prefix frontend` attempted: failed with npm `Exit handler never called!` and Node 22.16.0 engine warnings for some locked dependencies.
- `npm run build --prefix frontend`: blocked (`vite: not found`).
- `npm test --prefix frontend`: blocked (`vitest: not found`).
- No browser screenshots or cross-device GSAP animation traces were validated here. No database or API was accessed.

## Run and verify on your Mac

1. Back up and preserve your **one active root `.env`**. Use Node version supported by your locked dependencies (check `node -v`; a current Node 24 release is preferable to Node 22.16).
2. In project root:
   ```bash
   npm ci
   npm run setup
   npm run test:dress-like
   npm run test:brand-intro
   npm run test:cinematic-hero
   npm run test:summer
   npm test --prefix frontend
   npm run build --prefix frontend
   npm run dev
   ```
3. Open `http://localhost:5173/?gazuIntro=1` to replay the first-tab logo and three-model entrance in development. Scroll below **THIS SUMMER** until **DRESS LIKE** enters the viewport.
4. Check at desktop width (1440px), tablet width (768px), and mobile width (390px). Confirm visible image and heading, no horizontal overflow, no overlapping text, stable layout and working **EXPLORE COLLECTION** → Shop.
5. In DevTools, throttle network and confirm the reused external photograph loads; if it fails, a burgundy GAZU fallback appears. Test **prefers-reduced-motion** to verify static presentation and no rolling gallery motion.
6. Scroll away and back: the entrance should not replay on tiny scroll movements. Route away/back to check GSAP cleanup.

**Known visual limitation:** The exact seated burgundy model photograph in the NS reference is not included in the existing approved GAZU assets. Source/approve a high-quality replacement for pixel-level photographic fidelity before deploying.
