import { randomInt, createHmac, timingSafeEqual } from "node:crypto";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { sendEmail } from "./emailService.js";
import { logger } from "../config/logger.js";
import { fail } from "../utils/errors.js";
const generic =
  "If this account is eligible, a recovery code will arrive shortly. Google-only users can use it to set a GAZU password. Check your inbox or try again later.";
function hash(email, code) {
  const secret = process.env.OTP_SECRET || process.env.JWT_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("Recovery secret is not configured.");
  return createHmac("sha256", secret)
    .update(`password-reset:${email}:${code}`)
    .digest("hex");
}
export async function requestRecovery(email) {
  const code = randomInt(0, 1000000).toString().padStart(6, "0");
  const issued = await mongoose.connection.transaction(async (session) => {
    const user = await User.findOne({
      email,
      disabled: { $ne: true },
      $or: [{ emailVerified: true }, { role: "admin" }],
    }).session(session);
    if (!user) return false;
    const now = new Date(),
      fresh = !user.recoveryWindowAt || now - user.recoveryWindowAt >= 3600000;
    if (
      now - (user.recoveryLastSentAt || 0) < 60000 ||
      (!fresh && user.recoverySendCount >= 5)
    )
      return false;
    user.recoveryHash = hash(email, code);
    user.recoveryExpiresAt = new Date(+now + 600000);
    user.recoveryAttempts = 0;
    user.recoveryLastSentAt = now;
    user.recoveryWindowAt = fresh ? now : user.recoveryWindowAt;
    user.recoverySendCount = fresh ? 1 : user.recoverySendCount + 1;
    await user.save({ session });
    return true;
  });
  if (issued) {
    try {
      await sendEmail(
        email,
        "GAZU - Password recovery",
        `Your GAZU password recovery code is: ${code}\n\nIt expires in 10 minutes and works once. This sets a GAZU password, never your Google password. If you did not request this, ignore this email.`,
      );
    } catch {
      logger.warn("Recovery delivery unavailable", {
        event: "recovery_delivery_failed",
      });
    }
  }
  // Same status/body for absent, disabled, throttled and SMTP-failed accounts.
  return { message: generic, retryAfter: 60 };
}
export async function resetPassword(email, code, password) {
  const passwordHash = await bcrypt.hash(password, 12);
  const changed = await mongoose.connection.transaction(async (session) => {
    const user = await User.findOne({ email, disabled: { $ne: true } })
      .select("+recoveryHash")
      .session(session);
    if (
      !user?.recoveryHash ||
      user.recoveryExpiresAt <= new Date() ||
      user.recoveryAttempts >= 5
    )
      return false;
    if (
      !timingSafeEqual(
        Buffer.from(user.recoveryHash, "hex"),
        Buffer.from(hash(email, code), "hex"),
      )
    ) {
      user.recoveryAttempts += 1;
      await user.save({ session });
      return false;
    }
    user.passwordHash = passwordHash;
    user.recoveryHash = undefined;
    user.recoveryExpiresAt = undefined;
    user.sessionVersion = (user.sessionVersion || 0) + 1;
    await user.save({ session });
    return true;
  });
  if (!changed)
    fail(400, "Recovery code is invalid or expired. Request a new code.");
  try {
    await sendEmail(
      email,
      "GAZU - Password changed",
      "Your GAZU password was changed. Existing GAZU sessions were signed out. If you did not make this change, recover your account and contact support.",
    );
  } catch {
    logger.warn("Security notification delivery unavailable", {
      event: "password_notice_failed",
    });
  }
  return { message: "Password updated. Sign in with your new password." };
}
