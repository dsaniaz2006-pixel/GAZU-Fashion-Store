import "../config/env.js";
import { OAuth2Client } from "google-auth-library";
import { randomBytes, createHash } from "node:crypto";
import { z } from "zod";
import GoogleChallenge from "../models/GoogleChallenge.js";
import { fail } from "../utils/errors.js";
import { isAllowedBrowserOrigin } from "../config/allowedOrigins.js";
export const googleClient = new OAuth2Client();
const cookieName = "gazu_google_challenge";
const digest = (value) => createHash("sha256").update(value).digest("hex");
function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production" || process.env.GAZU_HTTPS_ENABLED === "true",
    path: "/api/auth",
    maxAge: 600000,
  };
}
export function googleOrigin(req, res, next) {
  if (!isAllowedBrowserOrigin(req.get("Origin")))
    fail(403, "Sign-in must start from the GAZU website.");
  if (!req.is("application/json")) fail(400, "Send a JSON request.");
  next();
}
export function googleAudience() {
  const id = (
    process.env.VITE_GOOGLE_CLIENT_ID ||
    process.env.GOOGLE_CLIENT_ID ||
    ""
  ).trim();
  if (!id) fail(503, "Google sign-in is not configured.");
  return id;
}
function browserKey(req) {
  const value = (req.headers.cookie || "")
    .split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith(cookieName + "="))
    ?.slice(cookieName.length + 1);
  return value && /^[a-f0-9]{64}$/.test(value) ? digest(value) : null;
}
export async function beginGoogle(req, res) {
  googleAudience();
  const previous = browserKey(req);
  if (previous) await GoogleChallenge.deleteOne({ _id: previous });
  const binding = randomBytes(32).toString("hex"),
    nonce = randomBytes(32).toString("hex");
  await GoogleChallenge.create({
    _id: digest(binding),
    nonce,
    expiresAt: new Date(Date.now() + 600000),
  });
  res.cookie(cookieName, binding, cookieOptions());
  res.set("Cache-Control", "no-store").json({ nonce });
}
export async function verifyGoogleCredential(credential, nonce) {
  const audience = googleAudience();
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience,
    });
    payload = ticket.getPayload();
  } catch {
    fail(401, "Google sign-in could not be verified. Please try again.");
  }
  if (
    !payload ||
    payload.aud !== audience ||
    !["accounts.google.com", "https://accounts.google.com"].includes(
      payload.iss,
    ) ||
    !Number.isFinite(payload.exp) ||
    payload.exp <= Date.now() / 1000 ||
    typeof payload.sub !== "string" ||
    !payload.sub ||
    payload.sub.length > 255 ||
    payload.email_verified !== true ||
    !z.email().safeParse(payload.email).success ||
    payload.nonce !== nonce
  )
    fail(401, "Google sign-in could not be verified. Please try again.");
  // Google authority is not assumed for third-party emails. All new accounts need GAZU OTP.
  return {
    sub: payload.sub,
    email: payload.email.toLowerCase().trim(),
    name:
      typeof payload.name === "string" && payload.name.trim()
        ? payload.name.trim().slice(0, 80)
        : "GAZU Customer",
  };
}
export async function consumeGoogle(req, res) {
  const key = browserKey(req);
  const challenge =
    key &&
    (await GoogleChallenge.findOne({
      _id: key,
      expiresAt: { $gt: new Date() },
    }));
  if (!challenge) fail(401, "Google sign-in expired. Start again.");
  const identity = await verifyGoogleCredential(
    req.body.credential,
    challenge.nonce,
  );
  const consumed = await GoogleChallenge.findOneAndDelete({
    _id: key,
    expiresAt: { $gt: new Date() },
  });
  if (!consumed) fail(401, "Google sign-in expired. Start again.");
  const { maxAge, ...clearOptions } = cookieOptions();
  res.clearCookie(cookieName, clearOptions);
  return identity;
}
