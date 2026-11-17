import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { otpEmailHtml, welcomeEmailHtml, orderConfirmationHtml, orderStatusHtml } from '../src/services/emailTemplates.js';
import { sendEmail } from '../src/services/emailService.js';

const example = {
  _id: '507f1f77bcf86cd799439011', orderNumber: 'GAZU-2026-000123',
  items: [{ name: 'Classic Shirt <script>alert(1)</script>', size: 'M', quantity: 2, unitPricePaise: 25000 }],
  subtotalPaise: 50000, deliveryPaise: 0, totalPaise: 50000,
  paymentMethod: 'cod',
  shipping: { name: 'Customer', address: 'Street & Avenue', city: 'Ludhiana', pin: '141001' },
};

test('OTP HTML has a clear 6-digit code and five-minute security warning', () => {
  const html = otpEmailHtml('042903');
  assert.match(html, /042903/);
  assert.match(html, /5 minutes/);
  assert.match(html, /GAZU/);
  assert.throws(() => otpEmailHtml('<img>'), /Invalid OTP/);
});

test('welcome HTML escapes untrusted names and links to the official GAZU site', () => {
  const html = welcomeEmailHtml({ name: '<script>alert("X")</script>' });
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /href="https:\/\/gazufashionstore\.vercel\.app"/);
});

test('confirmation includes actual order number, items, totals and escaped address', () => {
  const html = orderConfirmationHtml({ order: example, customerName: 'Buyer' });
  assert.match(html, /GAZU-2026-000123/);
  assert.match(html, /Classic Shirt &lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /Street &amp; Avenue/);
  assert.match(html, /500\.00/);
  assert.match(html, /Cash on Delivery/);
  assert.match(html, /\/account\/orders/);
});

test('status templates render all three stages, without inventing courier tracking', () => {
  for (const status of ['preparing', 'out_for_delivery', 'delivered']) {
    const html = orderStatusHtml({ order: example, customerName: 'Buyer', status });
    assert.match(html, /GAZU-2026-000123/);
    assert.match(html, /ORDER PROGRESS/);
    assert.match(html, /VIEW MY ORDERS/);
    assert.match(html, /\/account\/orders/);
    assert.doesNotMatch(html, /GPS tracking number/);
  }
  assert.throws(() => orderStatusHtml({ order: example, status: 'unknown' }), /Invalid order status/);
});

test('Apps Script provider transmits HTML and plain-text fallback', async () => {
  const previous = {
    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
    GAZU_APPS_SCRIPT_URL: process.env.GAZU_APPS_SCRIPT_URL,
    GAZU_EMAIL_SECRET: process.env.GAZU_EMAIL_SECRET,
  };
  process.env.EMAIL_PROVIDER = 'apps_script';
  process.env.GAZU_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/test-deployment/exec';
  process.env.GAZU_EMAIL_SECRET = 'test-only-secret';
  let sent;
  const patched = mock.method(globalThis, 'fetch', async (_url, init) => {
    sent = JSON.parse(init.body);
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  });
  try {
    const html = otpEmailHtml('123456');
    const result = await sendEmail('buyer@example.test', 'GAZU test', 'Code: 123456', html);
    assert.equal(result.provider, 'apps_script');
    assert.equal(sent.text, 'Code: 123456');
    assert.equal(sent.html, html);
    assert.equal(sent.to, 'buyer@example.test');
  } finally {
    patched.mock.restore();
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
