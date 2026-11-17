import { Router } from "express";
import bcrypt from "bcryptjs";
import { authSession, publicUser } from "../services/authSession.js";
import { sendWelcomeEmail } from "../services/welcomeEmail.js";
import {
  beginGoogle,
  consumeGoogle,
  googleOrigin,
} from "../services/googleIdentity.js";
import {
  requestRecovery,
  resetPassword,
} from "../services/passwordRecovery.js";
import { z } from "zod";
import { rateLimit } from "express-rate-limit";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { fail } from "../utils/errors.js";
import {
  issueOtp,
  verifyOtp,
  verificationError,
} from "../services/emailOtp.js";
const router = Router();
router.use((req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
const emailInput = z.string().trim().toLowerCase().max(254).pipe(z.email());
const emailSchema = z.object({ email: emailInput }).strict();
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many verification requests. Try later." },
});
const credentials = z
  .object({
    email: emailInput,
    password: z
      .string()
      .min(8)
      .max(72)
      .refine(
        (value) => Buffer.byteLength(value, "utf8") <= 72,
        "Password must be at most 72 UTF-8 bytes",
      ),
  })
  .strict();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many sign-in attempts. Try again in 15 minutes." },
});
// Registration always creates a customer; public users cannot assign themselves admin.
router.post(
  "/register",
  limiter,
  validate(
    credentials
      .extend({
        name: z.string().trim().min(2).max(80),
        confirmPassword: z.string().optional(),
      })
      .refine(
        (data) =>
          data.confirmPassword === undefined ||
          data.password === data.confirmPassword,
        { message: "Passwords do not match", path: ["confirmPassword"] },
      ),
  ),
  async (req, res) => {
    const { name, email, password } = req.body;
    if (await User.exists({ email }))
      fail(409, "This email is already registered.");
    const user = await User.create({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: "customer",
      welcomeEmailPending: true,
    });
    await issueOtp(email);
    res.status(201).json({
      requiresVerification: true,
      email,
      retryAfter: 60,
      message: "Verification code sent. Check your inbox and spam folder.",
    });
  },
);
// Compare the supplied password with its hash, never a stored plaintext password.
router.post("/login", limiter, validate(credentials), async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select(
    "+passwordHash",
  );
  if (
    !user?.passwordHash ||
    !(await bcrypt.compare(req.body.password, user.passwordHash))
  )
    fail(401, "Incorrect email or password.");
  if (user.disabled) fail(403, "Account unavailable. Contact support.");
  if (user.role === "customer" && !user.emailVerified)
    throw verificationError(
      403,
      "EMAIL_NOT_VERIFIED",
      "Verify your email before signing in.",
      { requiresVerification: true, email: user.email },
    );
  res.json(authSession(user));
});
router.post(
  "/verify-email",
  otpLimiter,
  validate(emailSchema.extend({ otp: z.string().regex(/^[0-9]{6}$/) })),
  async (req, res) => {
    const user = await verifyOtp(req.body.email, req.body.otp);
    await sendWelcomeEmail(user);
    res.json({ message: "Email verified.", ...authSession(user) });
  },
);
router.post(
  "/resend-otp",
  otpLimiter,
  validate(emailSchema),
  async (req, res) => {
    await issueOtp(req.body.email);
    res.json({
      message:
        "If verification is pending, a code has been sent. Check your inbox and spam folder.",
      retryAfter: 60,
    });
  },
);
router.get("/me", requireAuth, (req, res) =>
  res.json({ user: publicUser(req.user) }),
);

const googleInput = z
  .object({ credential: z.string().min(20).max(12000) })
  .strict();
const googleLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many Google sign-in requests. Try again later." },
});
router.post("/google/challenge", googleOrigin, googleLimiter, beginGoogle);
router.post(
  "/google",
  googleOrigin,
  googleLimiter,
  validate(googleInput),
  async (req, res) => {
    const identity = await consumeGoogle(req, res);
    let user = await User.findOne({ googleSub: identity.sub }).select(
      "+googleSub",
    );
    let created = false;
    if (!user) {
      if (await User.exists({ email: identity.email }))
        fail(
          409,
          "Sign in with your existing method, then link Google in Account settings.",
        );
      // Unique email and provider indexes also protect concurrent registrations.
      user = await User.create({
        name: identity.name,
        email: identity.email,
        googleSub: identity.sub,
        role: "customer",
        emailVerified: false,
        welcomeEmailPending: true,
      });
      created = true;
    }
    if (user.disabled) fail(403, "Account unavailable. Contact support.");
    if (!user.emailVerified) {
      if (created) await issueOtp(user.email);
      res
        .status(created ? 201 : 200)
        .json({
          requiresVerification: true,
          email: user.email,
          retryAfter: created ? 60 : Math.max(
            0,
            Math.ceil(
              (60000 - (Date.now() - (user.verificationLastSentAt || 0))) /
                1000,
            ),
          ),
          message: created
            ? "Verification code sent. Check your inbox and spam folder."
            : "Complete GAZU email verification. Enter your code or request a new one.",
        });
      return;
    }
    res.json(authSession(user));
  },
);
router.get("/methods", requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id).select(
    "+passwordHash +googleSub",
  );
  res.json({
    password: Boolean(user.passwordHash),
    google: Boolean(user.googleSub),
  });
});
router.post(
  "/link-google",
  googleOrigin,
  googleLimiter,
  requireAuth,
  validate(googleInput.extend({ password: credentials.shape.password })),
  async (req, res) => {
    const user = await User.findById(req.user.id).select(
      "+passwordHash +googleSub",
    );
    if (
      !user.emailVerified ||
      !user.passwordHash ||
      !(await bcrypt.compare(req.body.password, user.passwordHash))
    )
      fail(
        403,
        "Verify your GAZU email and confirm your current password to link Google.",
      );
    const identity = await consumeGoogle(req, res);
    if (identity.email !== user.email)
      fail(
        409,
        "Choose the Google account with the same email as your GAZU account.",
      );
    if (user.googleSub && user.googleSub !== identity.sub)
      fail(409, "A different Google account is already linked.");
    const linked = await User.findOneAndUpdate(
      {
        _id: user._id,
        disabled: { $ne: true },
        sessionVersion: user.sessionVersion
          ? user.sessionVersion
          : { $in: [0, null] },
        $or: [{ googleSub: { $exists: false } }, { googleSub: identity.sub }],
      },
      { $set: { googleSub: identity.sub } },
      { new: true },
    );
    if (!linked) fail(409, "Account changed. Sign in again before linking.");
    res.json({
      message: "Google account linked. Your orders and bag are unchanged.",
    });
  },
);
const recoveryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many recovery requests. Try again later." },
});
router.post(
  "/forgot-password",
  recoveryLimiter,
  validate(emailSchema),
  async (req, res) => res.json(await requestRecovery(req.body.email)),
);
router.post(
  "/reset-password",
  recoveryLimiter,
  validate(
    emailSchema
      .extend({
        code: z.string().regex(/^[0-9]{6}$/),
        password: credentials.shape.password,
        confirmPassword: z.string(),
      })
      .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
      }),
  ),
  async (req, res) =>
    res.json(
      await resetPassword(req.body.email, req.body.code, req.body.password),
    ),
);
export default router;
