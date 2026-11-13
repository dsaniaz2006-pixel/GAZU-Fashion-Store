import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../frontend/src/', import.meta.url);
const read = (name) => readFileSync(new URL(name, root), 'utf8');
const shelf = read('components/ui/skincare-product-shelf.jsx');
const shop = read('pages/Shop.jsx');
const details = read('pages/ProductDetail.jsx');
const cart = read('context/CartContext.jsx');
const styles = read('pages/ProductDetail.css');
const shelfStyles = read('components/ui/skincare-product-shelf.css');

test('shelf is powered by server-fetched product records rather than demo inventory', () => {
  assert.match(shop, /<ProductShelf products=\{data\.items\.map\(toProduct\)\}/);
  assert.match(shelf, /products\.find\(\(p\) => p\.id === selectedId\)/);
  assert.doesNotMatch(shelf, /mockProducts|RAIL_DEMO_ITEMS|cdn\.21st\.dev/i);
});

test('original product grid remains available from Shop', () => {
  assert.match(shop, /Shelf view/);
  assert.match(shop, /Grid view/);
  assert.match(shop, /<ProductGrid products=/);
});

test('shelf details link to the actual product and its existing cart handler', () => {
  assert.match(shelf, /to=\{`\/product\/\$\{selected\.id\}`\}/);
  assert.match(shelf, /await addToCart\(product\)/);
  assert.match(shelf, /user\s*}\s*=\s*useStorefront/);
  assert.match(shelf, /toggleWish\(p\)/);
});

test('detail page still retrieves real product and paged reviews', () => {
  assert.match(details, /useFetch\(`\/products\/\$\{id\}`/);
  assert.match(details, /useFetch\(`\/products\/\$\{id\}\/reviews\?page=\$\{page\}`/);
  assert.match(details, /await api\(`\/products\/\$\{id\}\/reviews`/);
  assert.match(details, /DELETE/);
});

test('quantities use supported backend cart endpoint, not repeated single-item requests', () => {
  assert.match(details, /await cart\.add\(p, quantity, selectedSize\)/);
  assert.match(cart, /const add = \(p, quantity = 1, size = ''\)/);
  assert.match(cart, /body: \{ productId: p\.id, quantity, size \}/);
  assert.match(details, /quantity >= maxQuantity/);
});

test('no invented size variants or third-party cosmetic images in product detail', () => {
  assert.doesNotMatch(details, /50 ml|SPF 30|ingredients:\s*\[/);
  assert.match(details, /p\.color/);
  assert.match(details, /p\.quantity/);
  assert.match(details, /Array\.isArray\(p\.images\)/);
});

test('responsive and reduced-motion styles are included', () => {
  for (const value of [styles, shelfStyles]) {
    assert.match(value, /@media\(max-width:/);
    assert.match(value, /prefers-reduced-motion:reduce/);
  }
});
