import User from "../models/User.js";
import { sendEmail } from "./emailService.js";
import { welcomeEmailHtml } from "./emailTemplates.js";

// Called ONLY after a new customer's email OTP is successfully verified.
// Atomically claim the one allowed attempt BEFORE sending to prevent duplicates
// from concurrent requests, repeat logins and ambiguous provider timeouts.
export async function sendWelcomeEmail(user) {
  if (!user || user.role !== "customer" || !user.emailVerified) return false;

  let claimed;
  try {
    claimed = await User.findOneAndUpdate(
      {
        _id: user._id,
        role: "customer",
        emailVerified: true,
        disabled: { $ne: true },
        welcomeEmailPending: true,
        welcomeEmailAttemptedAt: { $exists: false },
        welcomeEmailSentAt: { $exists: false },
      },
      {
        $set: {
          welcomeEmailPending: false,
          welcomeEmailAttemptedAt: new Date(),
        },
        $unset: { welcomeEmailSendingAt: "" },
      },
      { new: true },
    );
  } catch (error) {
    // A welcome email is never required for a user to finish verification.
    console.warn("GAZU welcome claim failed:", error.name);
    return false;
  }

  if (!claimed) return false;

  try {
    await sendEmail(
      claimed.email,
      "Your GAZU account is ready",
      [
        `Hi ${claimed.name || "Customer"},`,
        "",
        "Your email address has been verified and your GAZU account is ready.",
        "",
        "You can now sign in and manage your account or place an order:",
        "https://gazufashionstore.vercel.app/",
        "",
        "If you did not create this account, please contact GAZU support.",
        "",
        "GAZU Fashion Store",
      ].join("\n"),
      welcomeEmailHtml({ name: claimed.name }),
    );

    await User.updateOne(
      { _id: claimed._id },
      {
        $set: { welcomeEmailSentAt: new Date() },
        $unset: { welcomeEmailFailedAt: "" },
      },
    );
    return true;
  } catch (error) {
    // Never re-trigger on a later login. Provider acknowledgement is ambiguous
    // on a timeout: automatically retrying could send duplicate welcome emails.
    await User.updateOne(
      { _id: claimed._id },
      { $set: { welcomeEmailFailedAt: new Date() } },
    ).catch(() => {});
    console.warn("GAZU welcome email not confirmed:", error.name);
    return false;
  }
}
