import express from "express";
import helmet from "helmet";
import { timingSafeEqual, randomUUID, createHash } from "node:crypto";
import { readFileSync, writeFileSync, renameSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";

const app = express();
app.use(helmet());
app.use(express.json({ limit: "16kb" }));
const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const journalPath = process.env.PAYMENT_JOURNAL_PATH || "./data/decisions.json";
const memoryJournal = new Map();
let loadedPath;
function loadJournal() {
  if (loadedPath === journalPath) return;
  loadedPath = journalPath;
  memoryJournal.clear();
  if (existsSync(journalPath)) {
    for (const [key, value] of Object.entries(JSON.parse(readFileSync(journalPath, "utf8")))) memoryJournal.set(key, value);
  }
}
function persistJournal() {
  mkdirSync(dirname(journalPath), { recursive: true });
  const tmp = `${journalPath}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(Object.fromEntries(memoryJournal)), { mode: 0o600 });
  renameSync(tmp, journalPath);
}
function authorized(req) {
  const expected = Buffer.from(process.env.PAYMENT_SERVICE_SECRET || "");
  const actual = Buffer.from(req.get("X-Service-Key") || "");
  return expected.length >= 32 && expected.length === actual.length && timingSafeEqual(expected, actual);
}
function signature(body) {
  return createHash("sha256").update(JSON.stringify({ outcome: body.outcome, amountPaise: body.amountPaise })).digest("hex");
}
function safeRequestId(req, res, next) {
  const incoming = req.get("X-Request-ID");
  req.traceId = idPattern.test(incoming || "") ? incoming : randomUUID();
  res.set("X-Request-ID", req.traceId);
  next();
}
app.use(safeRequestId);
app.use((req, res, next) => {
  const started = Date.now();
  res.once("finish", () => {
    if (process.env.NODE_ENV !== "test" && req.path !== "/health") {
      try {
        console.log(JSON.stringify({ level: res.statusCode >= 500 ? "error" : "info", timestamp: new Date().toISOString(), requestId: req.traceId, method: req.method, path: req.path, status: res.statusCode, durationMs: Date.now() - started }));
      } catch { /* Logging never interrupts payment simulation. */ }
    }
  });
  next();
});
app.get("/health", (req, res) => res.json({ status: "ok", service: "payment-service" }));
// Never expose this route through the public nginx gateway. Only backend knows the shared key.
app.post("/internal/decision", (req, res) => {
  if (!authorized(req)) return res.status(403).json({ message: "Service access denied." });
  const { idempotencyKey, outcome, amountPaise } = req.body || {};
  if (!idPattern.test(idempotencyKey || "") || !["success", "failure"].includes(outcome) ||
      !Number.isSafeInteger(amountPaise) || amountPaise < 1 || amountPaise > 1000000000)
    return res.status(400).json({ message: "Invalid simulated payment request." });
  try {
    loadJournal();
    const hash = signature(req.body);
    let decision = memoryJournal.get(idempotencyKey);
    if (decision && decision.signature !== hash) return res.status(409).json({ message: "Idempotency key conflicts with an earlier payment attempt." });
    if (!decision) {
      decision = { signature: hash, approved: outcome === "success", simulated: true, status: outcome === "success" ? "approved" : "declined", transactionId: randomUUID() };
      memoryJournal.set(idempotencyKey, decision);
      try { persistJournal(); } catch (error) { memoryJournal.delete(idempotencyKey); throw error; }
    }
    res.json({ approved: decision.approved, simulated: true, status: decision.status, transactionId: decision.transactionId });
  } catch {
    res.status(503).json({ message: "Payment simulator storage is unavailable; retry the same checkout reference." });
  }
});
// The browser must always go through the authenticated Express payment API.
app.use((req, res) => res.status(404).json({ message: "Payment endpoint not found." }));
app.use((err, req, res, next) => res.status(400).json({ message: "Invalid payment request." }));
export default app;
