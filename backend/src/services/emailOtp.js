import { randomInt, createHmac, timingSafeEqual } from "node:crypto";
import mongoose from "mongoose";
import User from "../models/User.js";
import EmailOtp from "../models/EmailOtp.js";
import { sendEmail } from "./emailService.js";
import { AppError } from "../utils/errors.js";
export function verificationError(status, code, message, extra = {}) {
  const error = new AppError(status, message);
  Object.assign(error, { code, ...extra });
  return error;
}
function hash(email, otp) {
  const secret = process.env.OTP_SECRET || process.env.JWT_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("Configure a strong OTP_SECRET or JWT_SECRET.");
  return createHmac("sha256", secret).update(`${email}:${otp}`).digest("hex");
}
// The transaction writes the user on every issuance: simultaneous resends conflict
// and retry against the committed cooldown, including across API instances.
export async function issueOtp(email, deliver = sendEmail) {
  const otp = randomInt(0, 1000000).toString().padStart(6, "0");
  const issued = await mongoose.connection.transaction(async (session) => {
    const user = await User.findOne({
      email,
      role: "customer",
      emailVerified: { $ne: true },
      disabled: { $ne: true },
    }).session(session);
    if (!user) return false;
    const now = new Date();
    const remaining = 60000 - (now - (user.verificationLastSentAt || 0));
    if (remaining > 0)
      throw verificationError(
        429,
        "OTP_COOLDOWN",
        "Please wait before requesting another code.",
        { retryAfter: Math.ceil(remaining / 1000) },
      );
    const fresh =
      !user.verificationWindowAt || now - user.verificationWindowAt >= 3600000;
    if (!fresh && user.verificationSendCount >= 5)
      throw verificationError(
        429,
        "OTP_SEND_LIMIT",
        "Too many codes requested. Try again later.",
        {
          retryAfter: Math.ceil(
            (3600000 - (now - user.verificationWindowAt)) / 1000,
          ),
        },
      );
    user.verificationWindowAt = fresh ? now : user.verificationWindowAt;
    user.verificationSendCount = fresh ? 1 : user.verificationSendCount + 1;
    user.verificationLastSentAt = now;
    await user.save({ session });
    await EmailOtp.findOneAndUpdate(
      { email },
      {
        $set: {
          otpHash: hash(email, otp),
          attempts: 0,
          expiresAt: new Date(+now + 300000),
          lastSentAt: now,
        },
      },
      { upsert: true, session },
    );
    return true;
  });
  if (!issued) return;
  try {
    await deliver(
      email,
      "GAZU Fashion Store - Verify Your Email",
      `Welcome to GAZU Fashion Store!\n\nYour verification code is: ${otp}\n\nThis code expires in 5 minutes. Never share it.\nIf you did not create an account, ignore this email.`,
    );
  } catch {
    // Keep the pending account and cooldown. SMTP failures can be ambiguous;
    // do not create duplicates, leak provider errors, or automatically spam retries.
    throw verificationError(
      503,
      "OTP_DELIVERY_FAILED",
      "We could not confirm email delivery. Your account is saved. Check your inbox or resend after 60 seconds.",
      { requiresVerification: true, email, retryAfter: 60 },
    );
  }
}
export async function verifyOtp(email, otp) {
  const result = await mongoose.connection.transaction(async (session) => {
    const record = await EmailOtp.findOne({ email })
      .select("+otpHash")
      .session(session);
    if (!record || record.expiresAt <= new Date())
      return {
        status: 400,
        code: "OTP_EXPIRED",
        message: "Code expired or unavailable. Request a new code.",
      };
    if (record.attempts >= 5)
      return {
        status: 429,
        code: "OTP_ATTEMPTS_EXCEEDED",
        message: "Too many incorrect attempts. Request a new code.",
      };
    if (
      !timingSafeEqual(
        Buffer.from(record.otpHash, "hex"),
        Buffer.from(hash(email, otp), "hex"),
      )
    ) {
      record.attempts += 1;
      await record.save({ session });
      return {
        status: record.attempts >= 5 ? 429 : 400,
        code: record.attempts >= 5 ? "OTP_ATTEMPTS_EXCEEDED" : "OTP_INCORRECT",
        message:
          record.attempts >= 5
            ? "Too many incorrect attempts. Request a new code."
            : "Incorrect verification code.",
      };
    }
    const user = await User.findOneAndUpdate(
      { email, role: "customer", emailVerified: { $ne: true }, disabled: { $ne: true } },
      { $set: { emailVerified: true } },
      { new: true, session },
    );
    if (!user)
      return {
        status: 400,
        code: "OTP_UNAVAILABLE",
        message: "Verification is no longer pending.",
      };
    await EmailOtp.deleteOne({ _id: record._id }, { session });
    return { user };
  });
  // Throw after commit so a failed attempt is persisted rather than rolled back.
  if (result?.status) throw verificationError(result.status, result.code, result.message);
  return result.user;
}
