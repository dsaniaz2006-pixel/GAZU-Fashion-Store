# GAZU — Women / Men / Kids hero and logo reveal

## Reference and changes

Reference: the user-provided video of the NS Store Dribbble landing page (monogram appearing on a white canvas before the image-led homepage) and three screenshots of the previous GAZU slideshow.

Changes in `frontend/src/components/Home.jsx`:

| Slide | Category/route | Image source ID | Copy |
| --- | --- | --- | --- |
| 1 | `Women` | `photo-1529139574466-a303027c1d8b` | Looks You Remember |
| 2 | `Men` | `photo-1487222477894-8943e31ef7b2` | Style, Without the Noise |
| 3 | `Kids` | `photo-1519238263530-99bdd11df2ea` | Made for the Moment |

- Each slide shows a different subject: woman, man, child. `Shop Women`, `Shop Men` and `Shop Kids` use the existing `go('shop', category)` storefront routing.
- Three accessible tab buttons are labeled Women / Men / Kids. All remain visible on small screens.
- Intro now uses a **pure-white screen, 12 independently moving masked SVG fragments**, and a GSAP timeline. They assemble into **GAZU**, followed by the tagline **LOOKS YOU REMEMBER**, then the overlay fades after approximately 3.86 seconds. `sessionStorage` avoids replay during navigation, and reduced-motion users skip it. The centered `GAZU / STUDIO` navigation logo remains unchanged. See [GAZU_FRAGMENT_INTRO.md](GAZU_FRAGMENT_INTRO.md).
- Existing lookbook, category cards, product API, cart, checkout, authentication, payment, Docker and database are unchanged.
- CSS is scoped to `.ns-*` selectors. This does not install fonts, alter global branding for internal pages, or modify database products.

## Photographs and constraints

Images are existing Unsplash editorial/photo-CDN references (the previous homepage already used `images.unsplash.com`). These are **campaign atmosphere shots** rather than photographs of actual GAZU products. The image helper fetches them from Unsplash at runtime; an internet connection is needed. Images have not been downloaded into the ZIP, and online image loads / model releases have not been browser-verified in this environment.

Unsplash generally permits website/commercial reuse, subject to third-party personality/trademark rights, especially for images used to imply a brand endorsement. Review model releases and image rights before deploying as an official advertising campaign: https://unsplash.com/license and https://help.unsplash.com/en/articles/2612329-releases-and-trademarks.

## Testing

From root:

```sh
npm run test:hero
npm ci
npm run setup
npm test --prefix frontend
npm run build --prefix frontend
npm run dev
```

Open http://localhost:5173/ in a **new tab** to see the intro; open `http://localhost:5173/?gazuIntro=1` in development to replay it (or clear the `gazu-fragment-intro-seen-v1` sessionStorage key). Confirm the three images, click every tab and its Shop button, test next/pause, and check mobile layout. For Docker, use the unchanged `docker compose up -d --build` and http://localhost:8080/.

Runtime limitations must be recorded in the final test report. Static checks do **not** prove image delivery, browser animations or Docker health.

## Verified results in the editing environment

- `npm run test:hero`: **4 passed / 0 failed**.
- TypeScript parser used in syntax-only mode on `frontend/src`: **49 JavaScript/JSX files parsed / 0 syntax errors**.
- `tinycss2` stylesheet parsing: **0 parsing errors**.
- `npm run build --prefix frontend`: **blocked** (`vite: not found`, exit code 127).
- `npm test --prefix frontend`: **blocked** (`vitest: not found`, exit code 127).
- Live image delivery and mobile browser layout: **not verified**.

The first three checks verify code structure/syntax, not production behavior. Install project dependencies on the MacBook and run the build and UI tests before deployment.
