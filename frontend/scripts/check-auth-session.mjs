import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shouldExpireSession } from '../src/authSessionPolicy.mjs';
const check = (overrides = {}) => shouldExpireSession({
  status: 401,
  path: '/cart',
  requestToken: 'token-a',
  currentToken: 'token-a',
  ...overrides,
});

test('a 401 from an authenticated cart request expires the active session', () => {
  assert.equal(check(), true);
});
test('a first-time guest 401 must never trigger session expiry', () => {
  assert.equal(check({ requestToken: null, currentToken: null }), false);
});
test('a slow previous request never logs out a new login', () => {
  assert.equal(check({ currentToken: 'token-b' }), false);
});
test('startup /auth/me handles an old token quietly', () => {
  assert.equal(check({ path: '/auth/me' }), false);
});
test('auth forms handle their own failed sign-in and OTP errors', () => {
  for (const path of ['/auth/login', '/auth/register', '/auth/google', '/auth/verify-email', '/auth/forgot-password', '/auth/reset-password']) {
    assert.equal(check({ path }), false, path);
  }
});
test('only a 401 invalidates a session; not forbidden, missing or failed requests', () => {
  for (const status of [200, 400, 403, 404, 429, 500]) {
    assert.equal(check({ status }), false, String(status));
  }
});
test('email verification stays its own account flow', () => {
  assert.equal(check({ code: 'EMAIL_NOT_VERIFIED' }), false);
});
test('upload expiry works, and querystrings do not affect route matching', () => {
  assert.equal(check({ path: '/admin/uploads' }), true);
  assert.equal(check({ path: '/auth/me?fresh=1' }), false);
});
