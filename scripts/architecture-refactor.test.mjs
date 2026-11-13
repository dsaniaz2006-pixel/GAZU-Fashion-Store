import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { storefrontPath } from '../frontend/src/lib/navigation/storefrontPaths.js';
import { toProduct, toCart } from '../frontend/src/lib/catalogue/productAdapters.js';
import { parsePort, getRuntimeConfig } from '../backend/src/config/runtime.js';
import { identifyApi, apiNotFound } from '../backend/src/http/responses.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = (p) => readFileSync(resolve(root, p), 'utf8');
const walk = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((item) => {
  const path = join(directory, item.name);
  return item.isDirectory() ? walk(path) : [path];
});

// A plain source import graph test catches broken paths without Atlas or a browser.
test('all frontend/backend source relative module imports resolve', () => {
  const files = ['frontend/src', 'backend/src'].flatMap((dir) => walk(resolve(root, dir)));
  const missing = [];
  for (const file of files.filter((file) => /\.(?:js|jsx|mjs|tsx)$/.test(file))) {
    const content = readFileSync(file, 'utf8');
    const refs = [...content.matchAll(/\b(?:from\s*|import\s*\(\s*|import\s*)(['"])(\.[^'"\n]+)\1/g)]
      .map((match) => match[2]);
    for (const relative of refs) {
      const path = resolve(dirname(file), relative);
      if (![path, `${path}.js`, `${path}.jsx`, `${path}.mjs`, `${path}.tsx`, join(path, 'index.js')].some(existsSync)) {
        missing.push(`${file.replace(root + '/', '')} -> ${relative}`);
      }
    }
  }
  assert.deepEqual(missing, []);
});

test('the original public API facade is stable for all existing views and tests', () => {
  const api = source('frontend/src/api.js');
  for (const member of ['api', 'toProduct', 'toCart', 'uploadImage'])
    assert.match(api, new RegExp(`\\b${member}\\b`));
  const client = source('frontend/src/lib/api/httpClient.js');
  assert.match(client, /shouldExpireSession/);
  assert.match(client, /diagnosticApiError/);
  assert.match(client, /gazu-session-expired/);
});

test('product and cart adapters preserve existing prices, stock, sizes and quantity', () => {
  const product = { _id: 'prod1', name: 'Cotton Tee', pricePaise: 129900, originalPricePaise: 149900, active: true, inStock: true, quantity: 4, variants: [{ size: 'M', quantity: 3 }] };
  const adapted = toProduct(product);
  assert.equal(adapted.id, 'prod1');
  assert.equal(adapted.price, 1299);
  assert.equal(adapted.old, 1499);
  assert.equal(adapted.available, true);
  const cart = toCart([{ product, quantity: 2, size: 'M' }]);
  assert.equal(cart[0].qty, 2);
  assert.equal(cart[0].size, 'M');
  assert.equal(cart[0].variantQuantity, 3);
});

test('navigation preserves all known category/query and account routes', () => {
  assert.equal(storefrontPath('home'), '/');
  assert.equal(storefrontPath('track'), '/account/orders');
  assert.equal(storefrontPath('admin'), '/admin/products');
  assert.equal(storefrontPath('shop', 'Men', 'Footwear', {searchOpen:true,query:'black tee'}), '/shop?category=Men&type=Footwear&q=black+tee');
  assert.equal(storefrontPath('shop', 'Women', 'Footwear'), '/shop?category=Women');
  assert.equal(storefrontPath('style-finder'), '/style-finder');
});

test('Wave 3 route groups retain all original public URLs and share policies', () => {
  const routes = {
    'fit.routes.js': ['/fit/products','/fit/recommend','/fit/compare','/fit/products/:id/chart-draft','/fit/chart-drafts','/fit/chart-drafts/:id'],
    'support.routes.js': ['/support/policies','/support/ask','/support/orders','/support/tickets','/support/staff/tickets','/support/staff/tickets/:id/reply-draft','/support/staff/tickets/:id'],
    'languages.routes.js': ['/languages'],
    'admin.routes.js': ['/admin/audit','/admin/collections/drafts','/admin/suggestions','/admin/products/:id/suggestion','/admin/suggestions/:id','/admin/audit-trail','/admin/query'],
    'forecast.routes.js': ['/admin/forecast'],
  };
  const entry = source('backend/src/routes/wave3.js');
  for (const [module, endpoints] of Object.entries(routes)) {
    assert.ok(entry.includes(module), `${module} not mounted`);
    const code = source(`backend/src/routes/wave3/${module}`);
    for (const endpoint of endpoints)
      assert.ok(code.includes(`'${endpoint}'`), `${endpoint} not preserved`);
  }
  const common = source('backend/src/routes/wave3/shared.js');
  assert.match(common, /authRate/);
  assert.match(common, /publicRate/);
  assert.match(source('backend/src/routes/wave3/support.routes.js'), /user:req\.user\.id/);
  assert.match(source('backend/src/routes/wave3/admin.routes.js'), /transaction\(async session/);
});

test('API health, response identity, and 404 stay compatible', () => {
  const headers = {};
  let status;
  let payload;
  const res = {
    set(name, value) { headers[name] = value; return this; },
    status(code) { status = code; return this; },
    json(value) { payload = value; return this; },
  };
  let next = false;
  identifyApi({}, res, () => { next = true; });
  assert.equal(next, true);
  assert.equal(headers['X-GAZU-API'], 'gazu-store');
  apiNotFound({}, res);
  assert.equal(status, 404);
  assert.equal(payload.message, 'API endpoint not found.');
});

test('runtime port is validated and does not silently fall back on invalid values', () => {
  assert.equal(parsePort(undefined), 8000);
  assert.equal(parsePort('8002'), 8002);
  assert.equal(getRuntimeConfig({ PORT: '8001' }).port, 8001);
  for (const invalid of ['abc', '65536', '0', '-1', '1.5'])
    assert.throws(() => parsePort(invalid), /PORT/);
});

test('root .env is the only live app config and destructive operations remain opt-in', () => {
  assert.ok(existsSync(resolve(root, '.env.example')));
  // Private root .env is expected on developer machines. Check that Git ignores it,
  // rather than incorrectly requiring the runtime file to be absent.
  const ignore = source('.gitignore');
  assert.match(ignore, /^\.env$/m);
  assert.match(ignore, /^\*\*\/\.env$/m);
  assert.match(source('backend/src/config/env.js'), /ROOT_ENV_PATH/);
  const app = source('backend/src/app.js');
  assert.match(app, /"\/api\/wave2", wave2/);
  assert.match(app, /"\/api\/wave3", wave3/);
  assert.doesNotMatch(app, /keepOnlyThree|seed\(/);
  assert.ok(!existsSync(resolve(root, 'frontend/src/data/mensBottomwearEdit.js')));
});
