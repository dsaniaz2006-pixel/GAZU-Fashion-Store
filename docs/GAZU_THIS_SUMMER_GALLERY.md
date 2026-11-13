# GAZU — Phase 3: THIS SUMMER rolling gallery

## Scope and source

This phase modifies only the first editorial section below the three-model hero. The existing GAZU vector logo, GSAP intro, Women/Men/Kids hero, other homepage sections, React routes, auth, cart, backend, database and checkout are unchanged.

**Reference:** user-supplied `Screen Recording 2026-11-07 at 6.35.56 PM.mov`, about 25.73 seconds at 60 fps, 2940 × 1846 pixels. The gallery appears around 8 to 11.5 seconds. Measurements below come from studying actual reference frames at 8.5, 9, 9.5, 10, 10.5, and 11 seconds; they are approximate because the recording contains a browser viewport and surrounding Dribbble player chrome.

## Observed design

| Detail | Observation |
| --- | --- |
| Section | Clean white, spacious, follows hero. No dark boxes. |
| Heading | `THIS SUMMER`, centered, modest uppercase serif in black, above strip. |
| Photo layout | Four full tall photos plus partial edge photos at a time. Roughly 0.75:1 width:height, tight 10–20px gaps; slight individual tilt. |
| Clipping | Both edges mask partial photos. No rounded product cards or prices. |
| Horizontal movement | One cohesive row progresses **to the right** as the section stays roughly in place vertically. Across the 8.5–11s samples, the orange-outfit image shifts from an edge crop to the middle. |
| Speed | About 140 px/s at the ~920px-wide inner reference canvas. This is an estimate, not a precise measurement of the site CSS pixels. |
| Looping | Previously visible looks re-enter as the row cycles. This is consistent with a loop, although the recording doesn't show an uninterrupted entire cycle. |
| Easing | Motion appears approximately constant speed; no bounce or snappy resets observed. |
| Button | Small outlined `Explore the Collection` CTA centered underneath. |
| Vertical scrolling | Normal scrolling moves onward to Dress Like; no persistent pinned gallery observed. |
| Unverified | Drag gestures, hover-to-pause, exact source animation triggers, and long-term loop behaviour are not established by the recording. These were **not** invented. |

## Implementation

`ThisSummerSection.jsx` supplies the heading and a working button to the existing `/shop` collection route via the GAZU `go("shop","All")` helper. `SummerGallery.jsx` renders one track containing three identical eight-image sequences. The initial track offset displays the middle sequence. GSAP moves the track **right** exactly one sequence width (`x:-width` → `x:0`) with `ease:"none"` and `repeat:-1`, so its start and repeat boundary show identical images and never leave a gap. Loop length is measured from DOM, including inter-image and end gap. Desktop speed scales from approximately 15% of the viewport width each second, clamped to 85–235 CSS px/s; mobile slows down automatically. There is **no** click-to-slide, fake autoplay timeout, slider arrows, dots, progress bar, drag or ScrollTrigger/pinning.

- `IntersectionObserver` pauses the tween offscreen.
- A `ResizeObserver` and window resize listener rebuild the geometry when dimensions change.
- The document visibility event pauses the hidden-tab animation.
- `prefers-reduced-motion: reduce` shows a static version without horizontal motion. Motion setting changes are handled.
- Cleanup removes all observers and listeners, kills the tween, and reverts GSAP context on unmount or React Strict Mode remount.
- Cloned rows are `aria-hidden`; the middle sequence is the only accessible list. Gallery images are not links or interactive product cards.
- Photos use the pre-existing `image()` helper (Unsplash IDs previously referenced in GAZU), `object-fit:cover`, item-specific `object-position`, alt descriptions, image error fallback, and responsive 0.76 aspect-ratio frames.

### Existing GAZU image references reused

| Sequence | Department | Existing image ID |
| --- | --- | --- |
| 1 | Women | `photo-1496747611176-843222e1e57c` |
| 2 | Men | `photo-1487222477894-8943e31ef7b2` |
| 3 | Women | `photo-1524504388940-b1c1722653e1` |
| 4 | Kids | `photo-1519238263530-99bdd11df2ea` |
| 5 | Men | `photo-1516257984-b1b4d707412e` |
| 6 | Women | `photo-1534528741775-53994a69daeb` |
| 7 | Kids | `photo-1519238263530-99bdd11df2ea` |
| 8 | Men | `photo-1506794778202-cad84cf45f1d` |

All IDs came from the previous homepage lookbook, its three department tiles, or its Phase 2 hero configuration. Only **one** distinct Kids image existed in those sources, so it appears twice non-adjacently; it should be swapped when a second licensed Kids editorial photograph is supplied. Remote Unsplash imagery requires online access and rights/release review for public commercial deployment. No new third-party product listing has been introduced.

## File changes

**Created:**
- `frontend/src/components/summer/ThisSummerSection.jsx`: heading and existing-shop CTA.
- `frontend/src/components/summer/SummerGallery.jsx`: three-set GSAP loop and pause/restart/cleanup.
- `frontend/src/components/summer/SummerGallery.css`: white editorial layout, image framing, responsive rules.
- `frontend/src/components/summer/summerGalleryData.js`: source image order, visual positions, pure loop geometry.
- `frontend/src/tests/thisSummer.test.jsx`: React presentation and CTA tests.
- `scripts/this-summer.test.mjs`: standalone source/geometry regression checks.
- `docs/GAZU_THIS_SUMMER_GALLERY.md`: this guide.

**Modified:**
- `frontend/src/components/Home.jsx`: replace old arrow-driven `THIS SEASON` gallery with `ThisSummerSection`, leave Phase 1/2 hero and rest of page untouched.
- `frontend/src/styles.css`: remove only obsolete lookbook selectors; new styles are scoped to the summer feature.
- `frontend/src/tests/editorialLanding.test.jsx`: update the replaced heading expectation.
- `package.json`: add `test:summer` script.
- `README.md`: link to Phase 3 instructions.

No backend, payment-service, database, Docker or environment files modified.

## Verification

| Command/check | Result |
| --- | --- |
| `npm run test:summer` | **7/7 passed** (standalone structural/geometry tests) |
| `npm run test:brand-intro` | **4/4 passed** |
| `npm run test:cinematic-hero` | **9/9 passed** |
| `npm run test:hero` | **4/4 passed** |
| CSS via `tinycss2` stylesheet parser | **Passed**, 0 stylesheet parse errors for both files |
| `node --check` for JS source and scripts | **Passed** |
| `npm ci --prefix frontend --offline` | **Blocked:** npm package tarball `yallist@3.1.1` not cached; registry DNS unavailable |
| `npm test --prefix frontend` | Not verified; dependency installation blocked |
| `npm run build --prefix frontend` | Not verified; dependency installation blocked |
| Live browser screenshot, image-network loading, mobile resize | Not verified here; test on Mac |

## Run on your Mac

1. Extract the ZIP into a new folder and copy your existing private **root** `.env` over locally (never commit it). Do not use an older nested service `.env`.
2. In the extracted `gazu-store` root run:

```bash
npm ci
npm run setup
npm run test:summer
npm run test:brand-intro
npm run test:cinematic-hero
npm test --prefix frontend
npm run build --prefix frontend
npm run dev
```

3. Open <http://localhost:5173>. For the initial brand/hero sequence in development use <http://localhost:5173/?gazuIntro=1>. Then scroll to **THIS SUMMER**.
4. Verify motion direction, 4–5 images visible desktop, partial crops, CTA opening Shop, normal scroll, reduced-motion mode, no errors in console or missing images.
5. Check tablet and mobile widths. In macOS System Settings → Accessibility → Display → Reduce Motion you can test static fallback.

### Known limitations

- Reference video does not establish whether the source uses an actual infinite GSAP loop or a long finite animation; the repeated visible image ordering supports the practical right-moving seamless loop chosen here.
- No visual browser run was possible in this environment, and remote editorial image availability depends on the network.
- This feature does **not** modify the later Dress Like or Members Club sections.
