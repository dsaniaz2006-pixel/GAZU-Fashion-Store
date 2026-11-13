# GAZU Phase 1 — Cinematic Logo Fragment Reveal

## Scope and source audit

The uploaded ZIP had a homepage-only, CSS-driven `G → GAZU STUDIO` reveal in `frontend/src/components/Home.jsx`, with `ns-logo-intro` keyframes in `frontend/src/styles.css`. It did **not** fragment individual letters. There was no reusable GAZU SVG logo asset; the editorial header rendered `GAZU` as text in a Bodoni-like serif.

This change replaces **only the introductory logo**. It keeps the React Router layout, centered `GAZU STUDIO` navigation logo, Women/Men/Kids hero, product listings, authentication, cart, checkout, API, database, Docker, and payment service untouched.

## Implementation

| File | Change |
|---|---|
| `frontend/src/components/brand/gazuLogoPaths.js` | Four outlined SVG glyphs (GAZU), with twelve distinct clipped regions. Paths are embedded artwork, not a bundled font. |
| `frontend/src/components/brand/AnimatedGazuLogo.jsx` | Renders twelve independently addressable SVG path fragments and a matching clean complete path layer. |
| `frontend/src/components/brand/BrandIntro.jsx` | Lazy-loads GSAP; scopes and cleans up a twelve-piece timeline; handles reduced motion, completion, and timeout failures. |
| `frontend/src/components/brand/BrandIntro.css` | Pure white fullscreen overlay, centered responsive logo and masked tagline. |
| `frontend/src/components/brand/brandIntroSession.js` | Session-scoped first-play logic with graceful storage errors and development-only replay. |
| `frontend/src/layouts/StorefrontLayout.jsx` | Mounts the intro above the existing layout and sets the covered storefront and toast to `inert` while active. |
| `frontend/src/components/Home.jsx` | Removes the old, duplicate CSS-intro implementation; homepage content is otherwise unchanged. |
| `frontend/src/styles.css` | Removes obsolete `ns-logo-intro` rules only. |
| `frontend/package.json`, `frontend/package-lock.json` | Adds one animation dependency, `gsap@3.15.1`; no external CDN. |
| `frontend/src/tests/brandIntro.test.jsx` | Focused React playback, fragment, cleanup, and timing tests. |
| `scripts/brand-intro.test.mjs` | No-dependency structural and session-playback tests. |
| `scripts/editorial-hero.test.mjs` | Adapts the previous hero smoke test to the new animation. |
| root `package.json` | Adds `npm run test:brand-intro`. |

**Artwork:** the previous homepage wordmark used the external `Bodoni Moda` web font. The new SVG consists of outlined shapes adapted from a high-contrast editorial serif (GFS Didot), keeping a similar luxury silhouette without bundling or distributing a font file. It is not an exact vector extraction of the externally loaded Bodoni artwork. The existing navigation wordmark is unchanged.

## Timeline (approximately 3.86 seconds)

| Timeline seconds | Event |
|---:|---|
| 0.00–0.50 | Pure white stage, invisible vector artwork, page inert |
| 0.50–1.70 | Twelve SVG pieces slide 15–28px into place; `power3.out`, 0.05s stagger |
| 1.78–2.18 | Full clean GAZU outline replaces the fragments; subtle 1.02→1 scale settlement |
| 2.12–2.62 | `LOOKS YOU REMEMBER` reveals upward by 14px with opacity |
| 2.64–3.18 | Stationary logo + tagline hold |
| 3.18–3.86 | Overlay fades away; homepage remains mounted; interaction returns |

Actual timing can vary slightly with frame rendering and dynamic module load time. The GSAP timeline does not modify React state on animation frames. `gsap.context().revert()` cleans up styles and timelines on unmount, including React Strict Mode effect cleanup.

## Accessibility and lifecycle

- First homepage visit per tab session: plays once; key `gazu-fragment-intro-seen-v1` in `sessionStorage`.
- Navigating between Women, Men, Kids, cart, checkout, account and admin: no replay.
- Same-tab refresh or returning home: no replay.
- New tab: replays unless the new tab inherits cloned sessionStorage from an opener, in which case normal browser storage behavior applies.
- Reduced motion: bypasses the overlay. Switching reduced motion on mid-animation closes it.
- Session storage denied: bypasses intro, does not break shopping.
- React mounts the homepage behind the intro. Only the overlay is removed on completion.
- Page and toast have `inert` while covered, preventing pointer/keyboard interaction.
- Branded artwork is announced once; individual decorative vector fragments are hidden from assistive technologies.
- GSAP import failure or a stalled timeline: the overlay closes safely. There is a controlled 6.5s fallback timeout.

## Run on macOS

Keep your existing project-root `.env`; the intro adds no environment variables.

```bash
npm ci
npm run setup
npm run test:brand-intro
npm test --prefix frontend
npm run build --prefix frontend
npm run dev
```

Open `http://localhost:5173/`. The animation plays on the first homepage visit in that tab.

**Replay during development:** open `http://localhost:5173/?gazuIntro=1` (development builds only). Or clear only this key in browser DevTools:

```js
sessionStorage.removeItem('gazu-fragment-intro-seen-v1');
location.assign('/');
```

No replay button or developer override is exposed in production. The project-root `npm run dev` still starts the original services; for frontend-only motion testing use `npm run dev --prefix frontend` if your backend is not required.

## Tests and limitations

- `npm run test:brand-intro` and `npm run test:hero` are runnable without npm dependencies and check SVG fragment structure, playback rules, and layout integration.
- The React test file exercises the actual mounted SVG fragments and a mocked GSAP timeline. It requires frontend dependencies.
- Execute the Vite production build, browser animation (especially Safari/iOS), reduced-motion setting, routing, and all existing tests on your Mac after `npm ci`.
- The source container did not have the package tarballs needed for offline `npm ci`, so full frontend build and React/Vitest tests were not executable here. Browser-perfect animation timing has not been certified.
- The lockfile pins `gsap@3.15.1` but the npm package registry was unreachable from this environment. Installing dependencies on a network-connected machine is required to verify the lockfile and runtime.
