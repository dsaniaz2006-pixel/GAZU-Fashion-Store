import "./config/env.js";
import { sendEmail } from "./services/emailService.js";

const recipient = process.env.TEST_EMAIL_TO || process.env.EMAIL_USER;

try {
  const result = await sendEmail(
    recipient,
    "GAZU Fashion Store - Email Test",
    "Congratulations! Your GAZU official email is working.",
  );
  console.log("Email sent successfully. Message ID:", result.messageId);
  console.log("Check the recipient inbox (and Spam folder).");
} catch (error) {
  console.error("Email test failed:", error.message);
  process.exitCode = 1;
}
