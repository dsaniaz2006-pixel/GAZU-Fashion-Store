import { before, after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createHmac } from "node:crypto";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import request from "supertest";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import User from "../src/models/User.js";
import Product from "../src/models/Product.js";
import Order from "../src/models/Order.js";
import OrderCounter from "../src/models/OrderCounter.js";
import OrderNotification from "../src/models/OrderNotification.js";
import Review from "../src/models/Review.js";
import nodemailer from "nodemailer";
import PaymentAttempt from "../src/models/PaymentAttempt.js";
import RazorpayAttempt from "../src/models/RazorpayAttempt.js";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mock } from "node:test";
import app from "../src/app.js";

let db, customer, second, admin, product, paymentServer, paymentDir;
let submittedMail=[],mailFails=false;
const shipping = {
  name: "Demo Customer",
  address: "12 Test Road",
  city: "Chandigarh",
  pin: "160001",
  phone: "9876543210",
};
const productBody = {
  name: "Cotton Tee",
  description: "Test item",
  category: "Men",
  type: "T-Shirts",
  color: "Stone",
  tag: "",
  img: "photo-1521572163474-6864f9cf17ab",
  pricePaise: 129900,
  quantity: 3,
  inStock: true,
};
// All test records live in a temporary replica set, never the user's database.
before(async () => {
  mock.method(nodemailer, "createTransport", () => ({
    sendMail: async mail => {submittedMail.push(mail);if(mailFails)throw Error("Test SMTP unavailable");return {accepted:[mail.to]};},
  }));
  process.env.EMAIL_PROVIDER = "smtp"; // Use the mocked Nodemailer transport; never call a live provider in tests.
  process.env.EMAIL_USER = "sender@example.test";
  process.env.EMAIL_PASS = "test-only";
  process.env.JWT_SECRET = "test-only-secret-with-more-than-32-characters";
  process.env.ENABLE_MOCK_PAYMENTS = "true";
  process.env.NODE_ENV = "test";
  paymentDir = mkdtempSync(join(tmpdir(), "gazu-backend-payment-"));
  process.env.PAYMENT_JOURNAL_PATH = join(paymentDir, "decisions.json");
  process.env.PAYMENT_SERVICE_SECRET = "integration-service-secret-long-enough-32";
  const { default: paymentApp } = await import("../../payment-service/src/app.js");
  paymentServer = paymentApp.listen(0, "127.0.0.1");
  await new Promise(resolve => paymentServer.once("listening", resolve));
  process.env.PAYMENT_SERVICE_URL = `http://127.0.0.1:${paymentServer.address().port}`;
  db = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(db.getUri());
  await Promise.all([User.init(), Product.init(), Order.init(), OrderCounter.init(), OrderNotification.init(), Review.init(), PaymentAttempt.init(), RazorpayAttempt.init()]);
});
after(async () => {
  await mongoose.disconnect();
  if (db) await db.stop();
  if (paymentServer?.listening) await new Promise(resolve => paymentServer.close(resolve));
  if (paymentDir) rmSync(paymentDir, { recursive: true, force: true });
});
beforeEach(async () => {
  submittedMail=[];mailFails=false;
  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    Order.deleteMany({}),
    OrderNotification.deleteMany({}),
    PaymentAttempt.deleteMany({}),
    RazorpayAttempt.deleteMany({}),
    Review.deleteMany({}),
  ]);
  const passwordHash = await bcrypt.hash("Password123!", 4);
  await User.create([
    {
      name: "Customer",
      email: "customer@test.local",
      passwordHash,
      emailVerified: true,
    },
    {
      name: "Second",
      email: "second@test.local",
      passwordHash,
      emailVerified: true,
    },
    { name: "Admin", email: "admin@test.local", passwordHash, role: "admin" },
  ]);
  const token = async (email) =>
    jwt.sign({}, process.env.JWT_SECRET, {
      subject: (await User.findOne({ email })).id,
      expiresIn: "8h",
    });
  [customer, second, admin] = await Promise.all(
    ["customer@test.local", "second@test.local", "admin@test.local"].map(token),
  );
  product = await Product.create(productBody);
});
const auth = (token) => `Bearer ${token}`;
const add = (token, id = product.id, quantity = 1) =>
  request(app)
    .post("/api/cart/items")
    .set("Authorization", auth(token))
    .send({ productId: id, quantity });
const buy = (token, requestId = randomUUID()) =>
  request(app)
    .post("/api/orders/checkout")
    .set("Authorization", auth(token))
    .send({ requestId, shipping });

test("registration hashes passwords and never permits self-assigned admin role", async () => {
  await request(app)
    .post("/api/auth/register")
    .send({
      name: "Hacker",
      email: "bad@test.local",
      password: "Password123!",
      role: "admin",
    })
    .expect(400);
  const result = await request(app)
    .post("/api/auth/register")
    .send({
      name: "New User",
      email: "new@test.local",
      password: "Password123!",
    })
    .expect(201);
  assert.equal(result.body.requiresVerification, true);
  assert.equal(result.body.token, undefined);
  assert.equal(result.body.passwordHash, undefined);
  const user = await User.findOne({ email: "new@test.local" }).select(
    "+passwordHash",
  );
  assert.notEqual(user.passwordHash, "Password123!");
  assert.ok(await bcrypt.compare("Password123!", user.passwordHash));
  await User.updateOne(
    { email: "new@test.local" },
    { $set: { emailVerified: true } },
  );
  await request(app)
    .post("/api/auth/login")
    .send({ email: "new@test.local", password: "Password123!" })
    .expect(200);
  await request(app)
    .post("/api/auth/login")
    .send({ email: "new@test.local", password: "WrongPass123" })
    .expect(401);
});
test("admin CRUD, public availability, and protected role access", async () => {
  await request(app).get("/api/admin/products").expect(401);
  await request(app)
    .post("/api/admin/products")
    .set("Authorization", auth(customer))
    .send(productBody)
    .expect(403);
  const created = await request(app)
    .post("/api/admin/products")
    .set("Authorization", auth(admin))
    .send(productBody)
    .expect(201);
  await request(app)
    .patch(`/api/admin/products/${created.body._id}`)
    .set("Authorization", auth(admin))
    .send({ ...productBody, inStock: false, quantity: 5 })
    .expect(200);
  await add(customer, created.body._id).expect(409);
  await request(app)
    .delete(`/api/admin/products/${created.body._id}`)
    .set("Authorization", auth(admin))
    .expect(204);
  await request(app).get(`/api/products/${created.body._id}`).expect(404);
});
test("cart persists per account and rejects invalid/oversized quantities", async () => {
  await add(customer, product.id, 0).expect(400);
  await add(customer, product.id, -1).expect(400);
  await add(customer, product.id, 4).expect(409);
  await add(customer, product.id, 2).expect(200);
  const cart = await request(app)
    .get("/api/cart")
    .set("Authorization", auth(customer))
    .expect(200);
  assert.equal(cart.body[0].quantity, 2);
  assert.equal(
    (await request(app).get("/api/cart").set("Authorization", auth(second)))
      .body.length,
    0,
  );
  await request(app)
    .patch(`/api/cart/items/${product.id}`)
    .set("Authorization", auth(customer))
    .send({ quantity: 1 })
    .expect(200);
  await request(app)
    .delete(`/api/cart/items/${product.id}`)
    .set("Authorization", auth(customer))
    .expect(200);
  assert.equal(
    (await request(app).get("/api/cart").set("Authorization", auth(customer)))
      .body.length,
    0,
  );
});
test("COD uses latest server prices, saves history, clears cart and retries safely", async () => {
  await add(customer).expect(200);
  await Product.updateOne({ _id: product.id }, { pricePaise: 150000 });
  const id = randomUUID();
  const order = (await buy(customer, id).expect(201)).body;
  assert.equal(order.totalPaise, 150000);
  assert.equal(order.paymentStatus, "pending");
  assert.equal((await Product.findById(product.id)).quantity, 2);
  const retried = (await buy(customer, id).expect(201)).body;
  assert.equal(retried._id, order._id);
  assert.equal(await Order.countDocuments(), 1);
  assert.equal((await Product.findById(product.id)).quantity, 2);
  assert.equal(
    (await request(app).get("/api/cart").set("Authorization", auth(customer)))
      .body.length,
    0,
  );
  await request(app)
    .get(`/api/orders/${order._id}`)
    .set("Authorization", auth(second))
    .expect(404);
  assert.equal(
    (await request(app).get("/api/orders").set("Authorization", auth(second)))
      .body.length,
    0,
  );
});
test("failed checkout rolls back earlier stock changes and preserves the cart", async () => {
  const unavailable = await Product.create({
    ...productBody,
    name: "Second item",
  });
  await add(customer).expect(200);
  await add(customer, unavailable.id).expect(200);
  await Product.updateOne({ _id: unavailable.id }, { quantity: 0 });
  await buy(customer).expect(409);
  assert.equal((await Product.findById(product.id)).quantity, 3);
  assert.equal(await Order.countDocuments(), 0);
  const user = await User.findOne({ email: "customer@test.local" });
  assert.equal(user.cart.length, 2);
});
test("two customers competing for the final unit cannot oversell", async () => {
  await Product.updateOne({ _id: product.id }, { quantity: 1 });
  await add(customer).expect(200);
  await add(second).expect(200);
  const results = await Promise.all([buy(customer), buy(second)]);
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
  assert.equal((await Product.findById(product.id)).quantity, 0);
  assert.equal(await Order.countDocuments(), 1);
});
test("simultaneous duplicate checkout creates only one order", async () => {
  await add(customer).expect(200);
  const id = randomUUID();
  const results = await Promise.all([buy(customer, id), buy(customer, id)]);
  assert.deepEqual(
    results.map((r) => r.status),
    [201, 201],
  );
  assert.equal(results[0].body._id, results[1].body._id);
  assert.equal(await Order.countDocuments(), 1);
  assert.equal((await Product.findById(product.id)).quantity, 2);
});
test("mock decline does not change data; mock success records simulated payment", async () => {
  await add(customer).expect(200);
  const body = { requestId: randomUUID(), shipping, outcome: "failure" };
  await request(app)
    .post("/api/payments/mock/checkout")
    .set("Authorization", auth(customer))
    .send(body)
    .expect(402);
  assert.equal(await Order.countDocuments(), 0);
  assert.equal((await Product.findById(product.id)).quantity, 3);
  const success = await request(app)
    .post("/api/payments/mock/checkout")
    .set("Authorization", auth(customer))
    .send({ ...body, requestId: randomUUID(), outcome: "success" })
    .expect(201);
  assert.equal(success.body.paymentStatus, "mock_paid");
  process.env.NODE_ENV = "production";
  await request(app)
    .post("/api/payments/mock/checkout")
    .set("Authorization", auth(customer))
    .send({ ...body, requestId: randomUUID() })
    .expect(403);
  process.env.NODE_ENV = "test";
});
test("admin statuses advance in order and customers cannot change them", async () => {
  await add(customer).expect(200);
  const order = (await buy(customer).expect(201)).body;
  const path = `/api/admin/orders/${order._id}/status`;
  await request(app)
    .patch(path)
    .set("Authorization", auth(customer))
    .send({ status: "preparing" })
    .expect(403);
  await request(app)
    .patch(path)
    .set("Authorization", auth(admin))
    .send({ status: "delivered" })
    .expect(409);
  for (const status of ["preparing", "out_for_delivery", "delivered"])
    await request(app)
      .patch(path)
      .set("Authorization", auth(admin))
      .send({ status })
      .expect(200);
  const saved = await Order.findById(order._id);
  assert.equal(saved.paymentStatus, "collected");
  await request(app)
    .patch(path)
    .set("Authorization", auth(admin))
    .send({ status: "preparing" })
    .expect(409);
});
test("malformed IDs, client totals and empty checkouts are rejected", async () => {
  await request(app).get("/api/products/not-an-id").expect(400);
  await buy(customer).expect(400);
  await add(customer).expect(200);
  await request(app)
    .post("/api/orders/checkout")
    .set("Authorization", auth(customer))
    .send({ requestId: randomUUID(), shipping, totalPaise: 1 })
    .expect(400);
});

test("reviews enforce uniqueness, ownership and transactional rating recalculation", async () => {
  const path = `/api/products/${product.id}/reviews`;
  const a = (
    await request(app)
      .post(path)
      .set("Authorization", auth(customer))
      .send({ rating: 5, comment: "Great cotton" })
      .expect(201)
  ).body;
  await request(app)
    .post(path)
    .set("Authorization", auth(customer))
    .send({ rating: 3, comment: "Again" })
    .expect(409);
  await request(app)
    .post(path)
    .set("Authorization", auth(second))
    .send({ rating: 3, comment: "Nice fit" })
    .expect(201);
  let p = await Product.findById(product.id);
  assert.equal(p.rating, 4);
  assert.equal(p.reviewCount, 2);
  const reviews = (await request(app).get(path).expect(200)).body;
  assert.equal(reviews.total, 2);
  assert.ok(reviews.items[0].user.name);
  assert.equal(reviews.items[0].user.email, undefined);
  await request(app)
    .delete(`/api/reviews/${a._id}`)
    .set("Authorization", auth(second))
    .expect(403);
  await request(app)
    .delete(`/api/reviews/${a._id}`)
    .set("Authorization", auth(customer))
    .expect(204);
  p = await Product.findById(product.id);
  assert.equal(p.rating, 3);
  assert.equal(p.reviewCount, 1);
  await request(app)
    .delete(`/api/reviews/${reviews.items.find((r) => r._id !== a._id)._id}`)
    .set("Authorization", auth(admin))
    .expect(204);
  p = await Product.findById(product.id);
  assert.equal(p.rating, 0);
  assert.equal(p.reviewCount, 0);
});
test("catalogue search, category, stable price pagination and query validation", async () => {
  await Product.create({
    ...productBody,
    name: "  Cotton   Jacket  ",
    pricePaise: 300000,
  });
  await Product.create({
    ...productBody,
    name: "Cotton Dress",
    category: "Women",
    pricePaise: 200000,
  });
  const r = await request(app)
    .get("/api/products?q=Cotton&category=Men&sort=price_desc&limit=1&page=1")
    .expect(200);
  assert.equal(r.body.total, 2);
  assert.equal(r.body.pages, 2);
  assert.equal(r.body.items[0].name, "Cotton Jacket");
  assert.equal(r.body.items[0].priceRupees, 3000);
  const next = await request(app)
    .get("/api/products?q=Cotton&category=Men&sort=price_desc&limit=1&page=2")
    .expect(200);
  assert.equal(next.body.items[0]._id, product.id);
  for (const query of ["page=0", "page=-1", "limit=51", "sort=bad"])
    await request(app).get(`/api/products?${query}`).expect(400);
});
test("admin uploads validate bytes and size; stats use collected revenue", async () => {
  await request(app)
    .post("/api/admin/uploads")
    .set("Authorization", auth(customer))
    .attach("image", Buffer.from("bad"), {
      filename: "a.png",
      contentType: "image/png",
    })
    .expect(403);
  await request(app)
    .post("/api/admin/uploads")
    .set("Authorization", auth(admin))
    .attach("image", Buffer.from("not an image"), {
      filename: "a.png",
      contentType: "image/png",
    })
    .expect(400);
  await request(app)
    .post("/api/admin/uploads")
    .set("Authorization", auth(admin))
    .attach("image", Buffer.alloc(5 * 1024 * 1024 + 1), {
      filename: "a.png",
      contentType: "image/png",
    })
    .expect(400);
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aRZkAAAAASUVORK5CYII=",
    "base64",
  );
  const uploaded = await request(app)
    .post("/api/admin/uploads")
    .set("Authorization", auth(admin))
    .attach("image", png, {
      filename: "../../unsafe.png",
      contentType: "image/png",
    })
    .expect(201);
  assert.match(uploaded.body.url, /^\/uploads\/[a-f0-9-]+\.png$/);
  await request(app).get(uploaded.body.url).expect(200);
  await request(app)
    .get("/api/admin/stats")
    .set("Authorization", auth(customer))
    .expect(403);
  await add(customer);
  const order = (await buy(customer).expect(201)).body;
  assert.equal(order.itemCount, 1);
  let stats = (
    await request(app)
      .get("/api/admin/stats")
      .set("Authorization", auth(admin))
      .expect(200)
  ).body;
  assert.equal(stats.revenuePerDay.length, 0);
  assert.equal(stats.topProducts[0].quantity, 1);
  await Order.updateOne({ _id: order._id }, { paymentStatus: "collected" });
  stats = (
    await request(app).get("/api/admin/stats").set("Authorization", auth(admin))
  ).body;
  assert.equal(stats.revenuePerDay[0].revenuePaise, order.totalPaise);
});

test("payment service outage leaves COD usable and prevents mock order creation", async () => {
  await add(customer);
  const previous = process.env.PAYMENT_SERVICE_URL;
  process.env.PAYMENT_SERVICE_URL = "http://127.0.0.1:1";
  try {
    await request(app).post("/api/payments/mock/checkout")
      .set("Authorization", auth(customer))
      .send({ requestId: randomUUID(), shipping, outcome: "success" }).expect(503);
    assert.equal(await Order.countDocuments(), 0);
    await buy(customer).expect(201);
  } finally { process.env.PAYMENT_SERVICE_URL = previous; }
});

test("mock retries preserve order and reject altered payment intent", async () => {
  await add(customer);
  const body = { requestId: randomUUID(), shipping, outcome: "success" };
  const first = await request(app).post("/api/payments/mock/checkout").set("Authorization", auth(customer)).send(body).expect(201);
  const again = await request(app).post("/api/payments/mock/checkout").set("Authorization", auth(customer)).send(body).expect(200);
  assert.equal(first.body._id, again.body._id);
  await request(app).post("/api/payments/mock/checkout").set("Authorization", auth(customer)).send({ ...body, outcome: "failure" }).expect(409);
  assert.equal(await Order.countDocuments(), 1);
  assert.equal((await Product.findById(product.id)).quantity, 2);
});

test("Razorpay checkout creates a server-priced order, verifies capture and is idempotent", async () => {
  await add(customer);
  const previousKeyId = process.env.RAZORPAY_KEY_ID;
  const previousKeySecret = process.env.RAZORPAY_KEY_SECRET;
  process.env.RAZORPAY_KEY_ID = "rzp_test_fixture";
  process.env.RAZORPAY_KEY_SECRET = "test-only-razorpay-secret";
  let gatewayOrder;
  const paymentId = `pay_${randomUUID().replaceAll("-", "")}`;
  const gatewayFetch = mock.method(globalThis, "fetch", async (url, options = {}) => {
    if (url.endsWith("/v1/orders")) {
      const requestBody = JSON.parse(options.body);
      gatewayOrder = {
        id: `order_${randomUUID().replaceAll("-", "")}`,
        amount: requestBody.amount,
        currency: requestBody.currency,
      };
      return Response.json(gatewayOrder);
    }
    if (url.endsWith(`/v1/payments/${paymentId}`))
      return Response.json({
        id: paymentId,
        order_id: gatewayOrder.id,
        amount: gatewayOrder.amount,
        currency: "INR",
        status: "authorized",
      });
    if (url.endsWith(`/v1/payments/${paymentId}/capture`))
      return Response.json({
        id: paymentId,
        order_id: gatewayOrder.id,
        amount: gatewayOrder.amount,
        currency: "INR",
        status: "captured",
      });
    throw new Error("Unexpected Razorpay request");
  });
  try {
    const body = { requestId: randomUUID(), shipping };
    const config = await request(app)
      .get("/api/payments/config")
      .expect(200);
    assert.equal(config.body.razorpayEnabled, true);
    assert.equal(config.body.razorpayKeyId, "rzp_test_fixture");
    assert.equal(Object.hasOwn(config.body, "keySecret"), false);
    const orderResponse = await request(app)
      .post("/api/payments/razorpay/order")
      .set("Authorization", auth(customer))
      .send(body)
      .expect(201);
    assert.equal(orderResponse.body.amount, product.pricePaise);
    assert.equal(orderResponse.body.currency, "INR");
    assert.equal(orderResponse.body.keyId, "rzp_test_fixture");
    assert.equal(JSON.stringify(orderResponse.body).includes(process.env.RAZORPAY_KEY_SECRET), false);

    const signature = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderResponse.body.id}|${paymentId}`)
      .digest("hex");
    const verifyBody = {
      ...body,
      razorpayOrderId: orderResponse.body.id,
      razorpayPaymentId: paymentId,
      razorpaySignature: signature,
    };
    await request(app)
      .post("/api/payments/razorpay/verify")
      .set("Authorization", auth(customer))
      .send({ ...verifyBody, razorpaySignature: "f".repeat(64) })
      .expect(400);
    const first = await request(app)
      .post("/api/payments/razorpay/verify")
      .set("Authorization", auth(customer))
      .send(verifyBody)
      .expect(201);
    const again = await request(app)
      .post("/api/payments/razorpay/verify")
      .set("Authorization", auth(customer))
      .send(verifyBody)
      .expect(200);
    assert.equal(first.body._id, again.body._id);
    assert.equal(first.body.paymentMethod, "razorpay");
    assert.equal(first.body.paymentStatus, "paid");
    assert.equal(await Order.countDocuments(), 1);
    const stats = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", auth(admin))
      .expect(200);
    assert.equal(stats.body.revenuePerDay[0].revenuePaise, product.pricePaise);
    assert.equal(gatewayFetch.mock.calls.length, 3);
  } finally {
    if (previousKeyId === undefined) delete process.env.RAZORPAY_KEY_ID;
    else process.env.RAZORPAY_KEY_ID = previousKeyId;
    if (previousKeySecret === undefined) delete process.env.RAZORPAY_KEY_SECRET;
    else process.env.RAZORPAY_KEY_SECRET = previousKeySecret;
    gatewayFetch.mock.restore();
  }
});

test("Razorpay refunds a captured payment if stock changes before order commit", async () => {
  await add(customer);
  const previousKeyId = process.env.RAZORPAY_KEY_ID;
  const previousKeySecret = process.env.RAZORPAY_KEY_SECRET;
  process.env.RAZORPAY_KEY_ID = "rzp_test_fixture";
  process.env.RAZORPAY_KEY_SECRET = "test-only-razorpay-secret";
  let gatewayOrder;
  const paymentId = `pay_${randomUUID().replaceAll("-", "")}`;
  const gatewayFetch = mock.method(globalThis, "fetch", async (url, options = {}) => {
    if (url.endsWith("/v1/orders")) {
      const requestBody = JSON.parse(options.body);
      gatewayOrder = {
        id: `order_${randomUUID().replaceAll("-", "")}`,
        amount: requestBody.amount,
        currency: requestBody.currency,
      };
      return Response.json(gatewayOrder);
    }
    if (url.endsWith(`/v1/payments/${paymentId}`))
      return Response.json({
        id: paymentId,
        order_id: gatewayOrder.id,
        amount: gatewayOrder.amount,
        currency: "INR",
        status: "captured",
      });
    if (url.endsWith(`/v1/payments/${paymentId}/refund`))
      return Response.json({
        id: `rfnd_${randomUUID().replaceAll("-", "")}`,
        payment_id: paymentId,
        amount: gatewayOrder.amount,
        status: "processed",
      });
    throw new Error("Unexpected Razorpay request");
  });
  try {
    const body = { requestId: randomUUID(), shipping };
    const orderResponse = await request(app)
      .post("/api/payments/razorpay/order")
      .set("Authorization", auth(customer))
      .send(body)
      .expect(201);
    const signature = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderResponse.body.id}|${paymentId}`)
      .digest("hex");
    await Product.updateOne({ _id: product._id }, { $set: { quantity: 0, inStock: false } });
    await request(app)
      .post("/api/payments/razorpay/verify")
      .set("Authorization", auth(customer))
      .send({
        ...body,
        razorpayOrderId: orderResponse.body.id,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
      })
      .expect(402);
    const attempt = await RazorpayAttempt.findOne({ requestId: body.requestId });
    assert.equal(attempt.status, "refunded");
    assert.ok(attempt.refundId);
    assert.equal(await Order.countDocuments(), 0);
    assert.equal(gatewayFetch.mock.calls.length, 3);
  } finally {
    if (previousKeyId === undefined) delete process.env.RAZORPAY_KEY_ID;
    else process.env.RAZORPAY_KEY_ID = previousKeyId;
    if (previousKeySecret === undefined) delete process.env.RAZORPAY_KEY_SECRET;
    else process.env.RAZORPAY_KEY_SECRET = previousKeySecret;
    gatewayFetch.mock.restore();
  }
});

test("professional number, notification record and duplicate email protection remain compatible",async()=>{
 await add(customer).expect(200);const id=randomUUID();const first=(await buy(customer,id).expect(201)).body;
 assert.match(first.orderNumber,/^GAZU-\d{4}-\d{6,}$/);
 const retry=(await buy(customer,id).expect(201)).body;assert.equal(retry.orderNumber,first.orderNumber);assert.equal(retry._id,first._id);
 assert.equal(submittedMail.length,1);assert.equal(submittedMail[0].to,"customer@test.local");assert.ok(submittedMail[0].text.includes(first.orderNumber));assert.equal((await OrderNotification.findOne({order:first._id})).status,"sent");
});
test("existing confirmation-mail failure still preserves committed order",async()=>{
 mailFails=true;await add(customer).expect(200);const order=(await buy(customer).expect(201)).body;
 assert.ok(await Order.findById(order._id));assert.equal((await Product.findById(product.id)).quantity,2);assert.equal((await OrderNotification.findOne({order:order._id})).status,"failed");
});

// Phase 2 regression tests keep the advanced model and admin contracts explicit.
test("virtuals, review validation and reusable model search guard", async () => {
  assert.equal(product.priceRupees, 1299);
  assert.equal(product.toJSON().priceRupees, 1299);
  const name = await Product.create({ ...productBody, name: "  Soft   Jacket  " });
  assert.equal(name.name, "Soft Jacket");
  await assert.rejects(Product.search({ page: 0 }), /Invalid product search filters/);
  await assert.rejects(Product.search({ sort: "$where" }), /Invalid product search filters/);
  const path = `/api/products/${product.id}/reviews`;
  for (const rating of [0, 1.5, 6]) {
    await request(app).post(path).set("Authorization", auth(customer))
      .send({ rating, comment: "Example review" }).expect(400);
  }
  await request(app).post(path).set("Authorization", auth(customer))
    .send({ rating: 5, comment: "   " }).expect(400);
  assert.equal(await Review.countDocuments(), 0);
});

test("mock-paid amounts are reported separately from collected revenue", async () => {
  await Order.create({
    user: (await User.findOne({ email: "customer@test.local" }))._id,
    requestId: randomUUID(),
    items: [{ product: product._id, name: product.name, quantity: 1, unitPricePaise: 129900 }],
    totalPaise: 129900, subtotalPaise: 129900, deliveryPaise: 0,
    paymentMethod: "mock", paymentStatus: "mock_paid", status: "placed",
  });
  const stats = (await request(app).get("/api/admin/stats")
    .set("Authorization", auth(admin)).expect(200)).body;
  assert.deepEqual(stats.revenuePerDay, []);
  assert.equal(stats.mockPaymentsPerDay[0].simulatedPaise, 129900);
  assert.equal(stats.ordersByStatus[0].count, 1);
});
