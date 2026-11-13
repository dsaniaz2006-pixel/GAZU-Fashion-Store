import test from 'node:test';
import assert from 'node:assert/strict';
import { productCacheKey, cachedProducts, invalidateProducts } from '../src/services/cache.js';
import { setRedisClientForTests } from '../src/config/redis.js';
import { requestId } from '../src/middleware/requestLogger.js';
import { currentRequestId } from '../src/middleware/requestContext.js';
import { sanitizeLog } from '../src/config/logger.js';

process.env.NODE_ENV = 'test';
function fakeRedis() {
  const map = new Map([['gazu:catalogue:version', '1']]);
  return {
    isReady: true,
    isOpen: true,
    map,
    async get(k) { return map.get(k) ?? null; },
    async set(k, v) { map.set(k, v); },
    async incr(k) { const v = String(Number(map.get(k) || 0) + 1); map.set(k, v); return Number(v); },
  };
}
function request(query = {}, headers = {}) {
  return { path: '/api/products', query, get: (name) => headers[name.toLowerCase()] };
}
function response() {
  const r = { headers: {}, set(k, v) { this.headers[k] = v; return this; }, json(data) { this.data = data; return this; } };
  return r;
}

test('cache keys have stable normalized queries and separate pages', () => {
  assert.equal(productCacheKey('/api/products', { page: '1', q: 'coat' }, 3), productCacheKey('/api/products', { q: 'coat', page: '1' }, 3));
  assert.notEqual(productCacheKey('/api/products', { page: '1' }, 3), productCacheKey('/api/products', { page: '2' }, 3));
  assert.notEqual(productCacheKey('/api/products', {}, 3), productCacheKey('/api/products', {}, 4));
});

test('first request MISS, second HIT, admin invalidation causes MISS', async () => {
  const client = fakeRedis(); setRedisClientForTests(client);
  let count = 0;
  const loader = async () => ({ items: [++count] });
  const first = response(); await cachedProducts(request(), first, loader);
  assert.equal(first.headers['X-Cache'], 'MISS');
  const second = response(); await cachedProducts(request(), second, loader);
  assert.equal(second.headers['X-Cache'], 'HIT'); assert.equal(count, 1);
  await invalidateProducts();
  const third = response(); await cachedProducts(request(), third, loader);
  assert.equal(third.headers['X-Cache'], 'MISS'); assert.equal(count, 2);
});

test('authenticated product reads bypass cache', async () => {
  setRedisClientForTests(fakeRedis());
  const res = response();
  await cachedProducts(request({}, { authorization: 'Bearer sample' }), res, async () => ({ items: [] }));
  assert.equal(res.headers['X-Cache'], 'BYPASS');
});

test('an invalid cached JSON falls back to the database', async () => {
  const client = fakeRedis(); setRedisClientForTests(client);
  const key = productCacheKey('/api/products', {}, '1');
  client.map.set(key, '{invalid');
  const res = response();
  await cachedProducts(request(), res, async () => ({ items: ['valid'] }));
  assert.deepEqual(res.data, { items: ['valid'] });
});

test('in-flight database reads do not repopulate a current cache version', async () => {
  const client = fakeRedis(); setRedisClientForTests(client);
  let release;
  const waiting = new Promise((resolve) => { release = resolve; });
  const originalVersion = client.map.get('gazu:catalogue:version');
  const pending = cachedProducts(request(), response(), async () => { await waiting; return { stale: true }; });
  // Allow get operations to settle before invalidating.
  await new Promise((resolve) => setImmediate(resolve));
  await invalidateProducts();
  release(); await pending;
  assert.equal(client.map.has(productCacheKey('/api/products', {}, originalVersion)), false);
});

test('Redis failures never prevent loading products from MongoDB', async () => {
  const client = fakeRedis(); client.get = async () => { throw Error('redis down'); };
  setRedisClientForTests(client);
  const res = response();
  await cachedProducts(request(), res, async () => ({ items: ['db'] }));
  assert.equal(res.headers['X-Cache'], 'BYPASS');
});

test('request IDs are distinct and carried through async context', async () => {
  const ids = await Promise.all(Array.from({ length: 10 }, () => new Promise((resolve) => {
    const req = { get() {} }; const headers = {};
    requestId(req, { set(k, v) { headers[k] = v; } }, async () => {
      await Promise.resolve();
      assert.equal(currentRequestId(), req.requestId);
      assert.equal(headers['X-Request-ID'], req.requestId);
      resolve(req.requestId);
    });
  })));
  assert.equal(new Set(ids).size, ids.length);
});

test('logger redacts sensitive keys and URLs', () => {
  const safe = sanitizeLog({ password: 'private', token: 'jwt', note: 'redis://user:pass@host/0', nested: { authorization: 'Bearer abc' } });
  assert.equal(safe.password, '[REDACTED]');
  assert.equal(safe.token, '[REDACTED]');
  assert.equal(safe.nested.authorization, '[REDACTED]');
  assert.ok(!JSON.stringify(safe).includes('pass@host'));
});
