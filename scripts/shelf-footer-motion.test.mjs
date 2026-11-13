import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (file) => readFileSync(new URL(`../frontend/src/${file}`, import.meta.url), 'utf8');
const shelf = read('components/ui/skincare-product-shelf.jsx');
const shelfCss = read('components/ui/skincare-product-shelf.css');
const footer = read('components/Footer.jsx');
const motion = read('components/ui/motion-footer.jsx');
const motionCss = read('components/ui/motion-footer.css');
const hover = read('components/ui/interactive-hover-button.jsx');
const hoverCss = read('components/ui/interactive-hover-button.css');

test('shelf stays backed by API catalogue, not fabricated demo items', () => {
  assert.match(shelf, /products\.find\(\(p\) => p\.id === selectedId\)/);
  assert.match(shelf, /await addToCart\(product\)/);
  assert.doesNotMatch(shelf, /RAIL_DEMO_ITEMS|cdn\.21st\.dev|mockProducts/);
});
test('individual shelf images are grayscale at rest and full-color on hover', () => {
  assert.match(shelfCss, /\.gazu-shelf-image-wrap img\{[^}]*filter:grayscale\(1\)/);
  assert.match(shelfCss, /\.gazu-shelf-product:hover \.gazu-shelf-image-wrap img/);
  assert.match(shelfCss, /\.gazu-shelf-product:focus-within \.gazu-shelf-image-wrap img\{filter:grayscale\(0\)/);
  assert.match(shelfCss, /filter \.7s/);
});
test('reduced-motion users see static color photographs', () => {
  assert.match(shelfCss, /prefers-reduced-motion:reduce/);
  assert.match(shelfCss, /filter:none!important/);
});
test('Product Shelf uses the hover button without changing cart API', () => {
  assert.match(shelf, /<InteractiveHoverButton className="gazu-shelf-add"/);
  assert.match(shelf, /onClick=\{\(\) => addOne\(selected\)\}/);
  assert.match(shelf, /to=\{`\/product\/\$\{selected\.id\}`\}/);
});
test('footer retains existing navigation, newsletter semantics, and one footer root', () => {
  assert.match(footer, /<MotionFooter onExplore=\{\(\) => go\("shop"\)\}>/);
  for (const route of ['Men', 'Women', 'Kids', 'Accessories']) assert.ok(footer.includes(`go("shop", "${route}")`));
  assert.match(footer, /Demo newsletter preview/);
  assert.equal((motion.match(/<footer /g) || []).length, 1);
});
test('footer editorial reveal uses scoped GSAP ScrollTrigger and cleans up', () => {
  assert.match(motion, /gsap\.context/);
  assert.match(motion, /ScrollTrigger/);
  assert.match(motion, /once: true/);
  assert.match(motion, /context\.revert\(\)/);
  assert.match(motion, /duration: MOTION\.duration/g);
  assert.match(motion, /scrub: true/);
  assert.match(motion, /gazu-motion-footer__marquee-track/);
  assert.match(motion, /prefers-reduced-motion: reduce/);
});
test('footer is warm-grey not copied neon or dark-theme default', () => {
  assert.match(motionCss, /background:#e5e4de/);
  assert.match(motionCss, /radial-gradient/);
  assert.match(motion, />GAZU<\/span>/);
  assert.doesNotMatch(motion, /https?:\/\/|cdn\.21st\.dev/);
});
test('hover button preserves click, disabled and focus semantics', () => {
  for (const p of ['disabled={disabled}', 'onClick={onClick}', 'type={type}', 'aria-label={ariaLabel}']) assert.ok(hover.includes(p));
  assert.match(hoverCss, /:focus-visible/);
  assert.match(hoverCss, /\.7s/);
  assert.match(hoverCss, /prefers-reduced-motion:reduce/);
});
