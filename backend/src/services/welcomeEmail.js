import User from "../models/User.js";
import { sendEmail } from "./emailService.js";

// Claim each welcome message atomically to avoid duplicates across logins.
// Only newly registered, verified customer accounts are eligible.
export async function sendWelcomeEmail(user) {
  if (!user || user.role !== "customer" || !user.emailVerified) return false;
  const claimedAt = new Date();
  try {
    const claimed = await User.findOneAndUpdate(
      {
        _id: user._id,
        emailVerified: true,
        disabled: { $ne: true },
        welcomeEmailPending: true,
        welcomeEmailSentAt: { $exists: false },
        $or: [
          { welcomeEmailSendingAt: { $exists: false } },
          { welcomeEmailSendingAt: { $lt: new Date(Date.now() - 10 * 60 * 1000) } },
        ],
      },
      { $set: { welcomeEmailSendingAt: claimedAt } },
      { new: true },
    );
    if (!claimed) return false;

    try {
      await sendEmail(
        claimed.email,
        "GAZU - Welcome to GAZU Fashion Store!",
        [
          `Hi ${claimed.name || "Customer"},`,
          "",
          "Welcome to GAZU Fashion Store!",
          "Your account is verified and ready to shop.",
          "Discover our latest collections and enjoy your GAZU experience.",
          "",
          "Thank you for joining us!",
          "GAZU Fashion Store",
        ].join("\n"),
      );
      await User.updateOne(
        { _id: claimed._id, welcomeEmailSendingAt: claimedAt },
        { $set: { welcomeEmailSentAt: new Date(), welcomeEmailPending: false },
          $unset: { welcomeEmailSendingAt: "" } },
      );
      return true;
    } catch (error) {
      // Email delivery is optional: don't block verified sign-in.
      await User.updateOne(
        { _id: claimed._id, welcomeEmailSendingAt: claimedAt },
        { $unset: { welcomeEmailSendingAt: "" } },
      ).catch(() => {});
      console.warn("GAZU welcome email unavailable:", error.name);
      return false;
    }
  } catch (error) {
    console.warn("GAZU welcome email could not be claimed:", error.name);
    return false;
  }
}
