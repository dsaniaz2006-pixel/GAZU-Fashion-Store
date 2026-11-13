import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(resolve(root, relative), 'utf8');

test('Shop renders catalogue without the Recently Viewed panel', () => {
  const shop = read('frontend/src/pages/Shop.jsx');
  assert.doesNotMatch(shop, /RecentlyViewed|RECENTLY\s+VIEWED/i);
  assert.match(shop, /<ProductShelf/);
  assert.match(shop, /<ProductGrid/);
});

test('Product details do not persist browsing history or emit view-history events', () => {
  const detail = read('frontend/src/pages/ProductDetail.jsx');
  assert.doesNotMatch(detail, /recentlyViewed|saveRecentlyViewed|readRecentlyViewed|product_view|localStorage\.setItem/i);
  assert.match(detail, /const product = useFetch/);
});

test('Removed Recently Viewed files cannot be accidentally bundled', () => {
  assert.equal(existsSync(resolve(root, 'frontend/src/components/RecentlyViewed.jsx')), false);
  assert.equal(existsSync(resolve(root, 'frontend/src/lib/recentlyViewed.js')), false);
});

test('Old browser history is cleared while cart and wishlist are preserved', () => {
  const entry = read('frontend/src/main.jsx');
  assert.match(entry, /localStorage\.removeItem\("gazu-recently-viewed-v1"\)/);
  assert.doesNotMatch(entry, /localStorage\.(?:removeItem|clear)\(["'](?:gazu-cart|gazu-wishlist)/);
});
