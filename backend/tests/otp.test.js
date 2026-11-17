import { before, after, beforeEach, test, mock } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import request from "supertest";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../src/models/User.js";
import EmailOtp from "../src/models/EmailOtp.js";
import app from "../src/app.js";
import { issueOtp, verifyOtp } from "../src/services/emailOtp.js";
let db,
  mails = [],
  deliveryFails = false;
const email = "otp@example.test",
  password = "Password123!";
before(async () => {
  process.env.JWT_SECRET = "otp-test-only-secret-with-more-than-32-characters";
  process.env.EMAIL_USER = "sender@example.test";
  process.env.EMAIL_PASS = "test-only";
  mock.method(nodemailer, "createTransport", () => ({
    sendMail: async (mail) => {
      if (deliveryFails) throw Error("provider-secret-must-not-leak");
      mails.push(mail);
      return { accepted: [mail.to] };
    },
  }));
  db = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(db.getUri());
  await Promise.all([User.init(), EmailOtp.init()]);
});
after(async () => {
  mock.restoreAll();
  await mongoose.disconnect();
  await db?.stop();
});
beforeEach(async () => {
  await Promise.all([User.deleteMany({}), EmailOtp.deleteMany({})]);
  mails = [];
  deliveryFails = false;
});
const register = () =>
  request(app)
    .post("/api/auth/register")
    .send({ name: "Customer", email, password });
const login = () =>
  request(app).post("/api/auth/login").send({ email, password });
const code = () => mails.findLast(m => m.subject.includes("Verify")).text.match(/code is: (\d{6})/)[1];
const verify = (otp) =>
  request(app).post("/api/auth/verify-email").send({ email, otp });
const unlock = () =>
  User.updateOne(
    { email },
    { $set: { verificationLastSentAt: new Date(Date.now() - 61000) } },
  );
async function pending() {
  return User.create({
    name: "Pending",
    email,
    passwordHash: await bcrypt.hash(password, 4),
  });
}
test("register sends six digits but returns no token; verify once then sign in", async () => {
  const r = await register().expect(201);
  assert.equal(r.body.requiresVerification, true);
  assert.equal(r.body.token, undefined);
  assert.equal(r.body.otp, undefined);
  const record = await EmailOtp.findOne({ email }).select("+otpHash");
  assert.notEqual(record.otpHash, code());
  assert.equal(record.otpHash.length, 64);
  assert.equal(mails[0].to, email);
  assert.ok(mails[0].text.includes("\n\n"));
  assert.match(mails[0].subject, /GAZU/);
  await login().expect(403);
  await verify(code()).expect(200);
  assert.equal(mails.filter(m => m.subject.includes("Welcome to GAZU")).length, 1);
  assert.equal((await User.findOne({ email })).emailVerified, true);
  assert.equal(await EmailOtp.countDocuments(), 0);
  await verify(code()).expect(400);
  assert.ok((await login().expect(200)).body.token);
  assert.ok((await login().expect(200)).body.token);
  assert.equal(mails.filter(m => m.subject.includes("Welcome to GAZU")).length, 1);
  const saved = await User.findOne({ email });
  assert.ok(saved.welcomeEmailAttemptedAt);
  assert.ok(saved.welcomeEmailSentAt);
  assert.equal(saved.welcomeEmailPending, false);
});
test("unverified existing JWT is denied while legacy admin remains accessible", async () => {
  const customer = await pending();
  const token = jwt.sign({}, process.env.JWT_SECRET, { subject: customer.id });
  await request(app)
    .get("/api/cart")
    .set("Authorization", `Bearer ${token}`)
    .expect(403);
  await User.collection.insertOne({
    name: "Legacy Admin",
    email: "admin@example.test",
    role: "admin",
    passwordHash: await bcrypt.hash(password, 4),
  });
  const r = await request(app)
    .post("/api/auth/login")
    .send({ email: "admin@example.test", password })
    .expect(200);
  await request(app)
    .get("/api/auth/me")
    .set("Authorization", `Bearer ${r.body.token}`)
    .expect(200);
});
test("expiry is checked even before TTL cleanup", async () => {
  await pending();
  await issueOtp(email);
  await EmailOtp.updateOne(
    { email },
    { $set: { expiresAt: new Date(Date.now() - 1000) } },
  );
  await verify(code()).expect(400);
  assert.equal((await User.findOne({ email })).emailVerified, false);
});
test("concurrent incorrect attempts cannot exceed five or permit later correct code", async () => {
  await pending();
  await issueOtp(email);
  const correct = code(),
    wrong = correct === "000000" ? "111111" : "000000";
  const results = await Promise.all(
    Array.from({ length: 8 }, () =>
      verifyOtp(email, wrong).then(
        () => null,
        (e) => e,
      ),
    ),
  );
  assert.ok(results.every((e) => [400, 429].includes(e.status)));
  assert.equal((await EmailOtp.findOne({ email })).attempts, 5);
  await assert.rejects(verifyOtp(email, correct), (e) => e.status === 429);
});
test("concurrent valid submissions consume exactly once", async () => {
  await pending();
  await issueOtp(email);
  const otp = code();
  const results = await Promise.all([
    verifyOtp(email, otp).then(
      () => 200,
      (e) => e.status,
    ),
    verifyOtp(email, otp).then(
      () => 200,
      (e) => e.status,
    ),
  ]);
  assert.deepEqual(results.sort(), [200, 400]);
  assert.equal(await EmailOtp.countDocuments(), 0);
});
test("concurrent resends send once and invalidate the previous code", async () => {
  await pending();
  await issueOtp(email);
  const old = code();
  await unlock();
  const results = await Promise.all(
    Array.from({ length: 4 }, () =>
      issueOtp(email).then(
        () => 200,
        (e) => e.status,
      ),
    ),
  );
  assert.equal(results.filter((s) => s === 200).length, 1);
  assert.equal(mails.length, 2);
  const current = code();
  if (old !== current)
    await assert.rejects(verifyOtp(email, old), (e) => e.status === 400);
  await verifyOtp(email, current);
});
test("hourly send cap survives OTP cleanup and blocks sixth email", async () => {
  await pending();
  for (let n = 0; n < 5; n++) {
    await unlock();
    await issueOtp(email);
  }
  await unlock();
  await EmailOtp.deleteMany({});
  await assert.rejects(issueOtp(email), (e) => e.code === "OTP_SEND_LIMIT");
  assert.equal(mails.length, 5);
});
test("SMTP failure returns safe resumable response; resend recovers without duplicate user", async () => {
  deliveryFails = true;
  const r = await register().expect(503);
  assert.equal(r.body.code, "OTP_DELIVERY_FAILED");
  assert.equal(r.body.requiresVerification, true);
  assert.ok(!JSON.stringify(r.body).includes("provider-secret"));
  assert.equal(await User.countDocuments(), 1);
  deliveryFails = false;
  await unlock();
  await request(app).post("/api/auth/resend-otp").send({ email }).expect(200);
  await verify(code()).expect(200);
});
test("duplicate registration does not overwrite password; unknown resend is generic", async () => {
  await register().expect(201);
  await register().expect(409);
  assert.equal(mails.length, 1);
  const r = await request(app)
    .post("/api/auth/resend-otp")
    .send({ email: "unknown@example.test" })
    .expect(200);
  assert.match(r.body.message, /If verification is pending/);
  assert.equal(mails.length, 1);
});
test("resend cooldown has Retry-After and malformed OTP is rejected", async () => {
  await pending();
  await issueOtp(email);
  const r = await request(app)
    .post("/api/auth/resend-otp")
    .send({ email })
    .expect(429);
  assert.ok(Number(r.headers["retry-after"]) > 0);
  await verify("abc").expect(400);
  await request(app)
    .post("/api/auth/register")
    .send({ name: "Customer", email, password, emailVerified: true })
    .expect(400);
});


test("welcome email is never retried on login after an unsuccessful send", async () => {
  await register().expect(201);
  const otp = code();
  deliveryFails = true;
  await verify(otp).expect(200);
  const verified = await User.findOne({ email });
  assert.equal(verified.emailVerified, true);
  assert.equal(verified.welcomeEmailPending, false);
  assert.ok(verified.welcomeEmailAttemptedAt);
  assert.ok(verified.welcomeEmailFailedAt);
  assert.equal(verified.welcomeEmailSentAt, undefined);
  deliveryFails = false;
  await login().expect(200);
  await login().expect(200);
  assert.equal(mails.filter(m => m.subject.includes("Welcome to GAZU")).length, 0);
  await verify(otp).expect(400);
});

test("logging in to an already-verified account never triggers welcome", async () => {
  await User.create({
    name: "Previously Verified",
    email,
    passwordHash: await bcrypt.hash(password, 4),
    emailVerified: true,
    welcomeEmailPending: true,
  });
  await login().expect(200);
  await login().expect(200);
  assert.equal(mails.length, 0);
  const saved = await User.findOne({ email });
  assert.equal(saved.welcomeEmailPending, true);
  assert.equal(saved.welcomeEmailAttemptedAt, undefined);
});
