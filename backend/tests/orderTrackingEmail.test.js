import { before, after, beforeEach, test, mock } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import User from "../src/models/User.js";
import Order from "../src/models/Order.js";
import OrderNotification from "../src/models/OrderNotification.js";
import app from "../src/app.js";
import { sendOrderConfirmation, sendOrderStatusUpdate } from "../src/services/orderNotifications.js";

let database;
let mailOutbox = [];
let rejectEmail = false;
let customer;
let order;
let staffToken;
let customerToken;
const password = "Password123!";

before(async () => {
  process.env.JWT_SECRET = "gazu-order-tracking-test-only-secret-32-chars";
  process.env.EMAIL_USER = "sender@example.test";
  process.env.EMAIL_PASS = "test-only";
  mock.method(nodemailer, "createTransport", () => ({
    sendMail: async (mail) => {
      if (rejectEmail) throw new Error("test-mail-provider-unavailable");
      mailOutbox.push(mail);
      return { accepted: [mail.to], rejected: [] };
    },
  }));
  database = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(database.getUri());
  await Promise.all([User.init(), Order.init(), OrderNotification.init()]);
});

after(async () => {
  mock.restoreAll();
  await mongoose.disconnect();
  await database?.stop();
});

beforeEach(async () => {
  await Promise.all([OrderNotification.deleteMany({}), Order.deleteMany({}), User.deleteMany({})]);
  mailOutbox = [];
  rejectEmail = false;
  const hash = await bcrypt.hash(password, 4);
  customer = await User.create({ name: "Customer", email: "buyer@example.test", passwordHash: hash, role: "customer", emailVerified: true });
  const staff = await User.create({ name: "Staff", email: "staff@example.test", passwordHash: hash, role: "order_manager", emailVerified: true });
  order = await Order.create({
    user: customer._id, requestId: `req-${Date.now()}-${Math.random()}`,
    orderNumber: `GAZU-TEST-${Date.now()}`,
    items: [{ name: "GAZU T-shirt", quantity: 1, unitPricePaise: 9900 }],
    subtotalPaise: 9900, deliveryPaise: 0, totalPaise: 9900,
    paymentMethod: "cod", paymentStatus: "pending", status: "placed",
    shipping: { name: "Customer", address: "Test street", city: "Test city", pin: "123456" },
  });
  const staffLogin = await request(app).post("/api/auth/login").send({ email: staff.email, password }).expect(200);
  const customerLogin = await request(app).post("/api/auth/login").send({ email: customer.email, password }).expect(200);
  staffToken = staffLogin.body.token;
  customerToken = customerLogin.body.token;
});

function adminUpdate(status, token = staffToken) {
  return request(app)
    .patch(`/api/admin/orders/${order._id}/status`)
    .set("Authorization", `Bearer ${token}`)
    .send({ status });
}

const statusMessages = () => mailOutbox.filter((mail) => mail.subject.includes("Your Order Is Out") || mail.subject.includes("We're Preparing") || mail.subject.includes("Has Been Delivered"));

test("COD order confirmation is claimed only once, even if called concurrently", async () => {
  await Promise.all([sendOrderConfirmation(order), sendOrderConfirmation(order)]);
  assert.equal(mailOutbox.filter((mail) => mail.subject.includes("Order Has Been Confirmed")).length, 1);
  assert.equal(await OrderNotification.countDocuments({ order: order._id, type: "order_confirmation", status: "sent" }), 1);
  assert.equal(statusMessages().length, 0);
});

test("staff transitions send exactly three distinct tracking emails", async () => {
  await adminUpdate("preparing").expect(200);
  await adminUpdate("out_for_delivery").expect(200);
  await adminUpdate("delivered").expect(200);
  assert.equal(statusMessages().length, 3);
  assert.deepEqual(statusMessages().map((mail) => mail.to), [customer.email, customer.email, customer.email]);
  assert.equal(await OrderNotification.countDocuments({ order: order._id, status: "sent" }), 3);
  assert.equal((await Order.findById(order._id)).status, "delivered");
});

test("replaying a status change cannot create another email", async () => {
  await adminUpdate("preparing").expect(200);
  await adminUpdate("preparing").expect(409);
  const reloaded = await Order.findById(order._id);
  await sendOrderStatusUpdate(reloaded);
  assert.equal(statusMessages().length, 1);
  assert.equal(await OrderNotification.countDocuments({ order: order._id, type: "status_preparing" }), 1);
});

test("invalid status jumps and customer requests send no messages", async () => {
  await adminUpdate("delivered").expect(409);
  await adminUpdate("preparing", customerToken).expect(403);
  assert.equal(statusMessages().length, 0);
  assert.equal((await Order.findById(order._id)).status, "placed");
});

test("email provider failure does not roll back order progress or auto-send duplicates", async () => {
  rejectEmail = true;
  await adminUpdate("preparing").expect(200);
  assert.equal((await Order.findById(order._id)).status, "preparing");
  assert.equal((await OrderNotification.findOne({ order: order._id, type: "status_preparing" })).status, "failed");
  rejectEmail = false;
  await sendOrderStatusUpdate(await Order.findById(order._id));
  await adminUpdate("out_for_delivery").expect(200);
  assert.equal(statusMessages().length, 1);
  assert.ok(statusMessages()[0].subject.includes("Out for Delivery"));
  assert.equal(await OrderNotification.countDocuments({ order: order._id, type: "status_preparing" }), 1);
});
