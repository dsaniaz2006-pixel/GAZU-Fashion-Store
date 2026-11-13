import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { test } from 'node:test';
const get = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
test('all three customer editorial pages reuse the same arrival and liquid navigation', () => {
  for (const name of ['Lookbook', 'StyleFinder', 'Launches']) {
    const source = get(`frontend/src/pages/${name}.jsx`);
    assert.match(source, /GazuEditorialArrival/);
    assert.match(source, /GazuEditNav/);
    assert.match(source, /gazu-editorial-page/);
  }
});
test('Shop the Look retains existing original DRESS LIKE animation', () => {
  assert.match(get('frontend/src/pages/Lookbook.jsx'), /<DressLikeSection/);
  assert.match(get('frontend/src/components/dress-like/DressLikeSection.jsx'), /scrollTrigger/);
});
test('three-model arrival reuses cinematic model config and shared motion contract', () => {
  const source = get('frontend/src/components/editorial/GazuEditorialArrival.jsx');
  assert.match(source, /CINEMATIC_MODELS/);
  assert.match(source, /MOTION.duration/);
  assert.match(source, /prefers-reduced-motion/);
});
test('sitewide header and account/admin liquid navigation remain in shared layouts', () => {
  assert.match(get('frontend/src/layouts/StorefrontLayout.jsx'), /<Header/);
  assert.match(get('frontend/src/layouts/AdminLayout.jsx'), /GazuLiquidSectionNav/);
  assert.match(get('frontend/src/layouts/AccountLayout.jsx'), /GazuLiquidSectionNav/);
  assert.match(get('frontend/src/components/Footer.jsx'), /Shop the Look/);
});
test('new component and styles physically exist', () => {
  for (const name of ['GazuEditNav.jsx', 'GazuEditorialArrival.jsx', 'GazuEditorialArrival.css']) {
    assert.ok(existsSync(new URL(`../frontend/src/components/editorial/${name}`, import.meta.url)));
  }
  assert.match(get('frontend/src/main.jsx'), /editorial-expansion.css/);
});
