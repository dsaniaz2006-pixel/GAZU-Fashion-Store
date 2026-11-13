import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const folder = mkdtempSync(join(tmpdir(), "gazu-payments-"));
process.env.PAYMENT_JOURNAL_PATH = join(folder, "decisions.json");
process.env.PAYMENT_SERVICE_SECRET = "test-only-internal-service-key-32-characters";
const { default: app } = await import("../src/app.js");
after(() => rmSync(folder, { recursive: true, force: true }));
const key = () => ({ idempotencyKey: randomUUID(), amountPaise: 129900, outcome: "success" });
const post = (body, secret = process.env.PAYMENT_SERVICE_SECRET) => request(app).post("/internal/decision").set("X-Service-Key", secret).send(body);
test("service health and guarded processing API", async () => {
  await request(app).get("/health").expect(200);
  await request(app).post("/internal/decision").send(key()).expect(403);
  await post(key(), "wrong").expect(403);
  await post({ ...key(), amountPaise: -1 }).expect(400);
});
test("success, decline, stable idempotency and key conflict", async () => {
  const body = key();
  const a = await post(body).expect(200);
  const b = await post(body).expect(200);
  assert.equal(a.body.approved, true);
  assert.equal(a.body.transactionId, b.body.transactionId);
  await post({ ...body, outcome: "failure" }).expect(409);
  const decline = await post({ ...key(), outcome: "failure" }).expect(200);
  assert.equal(decline.body.approved, false);
});
test("concurrent identical requests use one persisted transaction", async () => {
  const body = key();
  const responses = await Promise.all(Array.from({ length: 5 }, () => post(body)));
  assert.ok(responses.every(r => r.status === 200));
  assert.equal(new Set(responses.map(r => r.body.transactionId)).size, 1);
});
test("trace ID is echoed when valid", async () => {
  const id = randomUUID();
  const result = await request(app).post("/internal/decision").set("X-Service-Key", process.env.PAYMENT_SERVICE_SECRET).set("X-Request-ID", id).send(key()).expect(200);
  assert.equal(result.headers["x-request-id"], id);
});
test("public service never forwards client API payment requests", async () => {
  await request(app).post("/api/payments/mock/checkout").send({ outcome: "success" }).expect(404);
});
