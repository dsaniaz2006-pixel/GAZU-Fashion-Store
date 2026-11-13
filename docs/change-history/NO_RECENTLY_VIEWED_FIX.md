# GAZU — Removed Recently Viewed from Shop

This update is based on the Wave 3 single-AI-dropdown integrated project.

## User-visible changes

- Shop no longer shows `RECENTLY VIEWED` (or its repeated blue sneaker) when browsing Men, Women, Kids or other categories.
- Opening a product no longer saves browsing history to localStorage or emits a `product_view` event.
- The old `RecentlyViewed.jsx` component and `recentlyViewed.js` helper have been deleted.
- On startup the frontend deletes the old `gazu-recently-viewed-v1` browser-storage key. It does not erase wishlist, sort preferences, cart, or account session.
- Existing inventory, images and product records remain unchanged. If an actual blue sneaker is a sellable product in the catalogue, it still appears in its proper product category.

## Technical tests

From the project root:

```sh
npm run test:no-recent-view
npm test
npm run build
```

One new Vitest regression is in `frontend/src/tests/noRecentlyViewed.test.jsx` and reproduces the repeated-blue-shoe case when changing to Women.

## Starting GAZU

Copy your existing root `.env` into this extracted project. Do not change database credentials. In the directory containing the root `package.json`:

```sh
npm ci
npm run setup
npm run dev
```

Visit `http://localhost:5173` and hard refresh (Command+Shift+R).

## Original reported terminal messages

`ECONNREFUSED 127.0.0.1:8000` before the backend starts is a transient Vite proxy error. In the recording's terminal screenshot, the backend later reports `MongoDB connected`, `GAZU API ready (port 8000)`, and successful HTTP 200 responses. If requests still fail after backend startup, verify `curl -i http://localhost:8000/api/health` and check that port 8000 belongs to the GAZU Node backend, not another project.

No MongoDB writes, migrations, product deletions or seed operations were performed by this change.
