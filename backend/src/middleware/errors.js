import { logger } from "../config/logger.js";
// Return safe, consistent JSON errors; never send database details or stack traces.
export function errorHandler(error, req, res, next) {
  if (error?.type === "entity.parse.failed")
    return res.status(400).json({ message: "Malformed JSON request body." });
  if (error?.type === "entity.too.large")
    return res.status(413).json({ message: "Request body is too large." });
  if (error.name === "MulterError")
    return res
      .status(400)
      .json({ message: "Upload rejected: one image, maximum 3 MB for visual search or 5 MB for product uploads." });
  if (error.name === "ZodError")
    return res.status(400).json({
      message: error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    });
  if (error.code === 11000)
    return res.status(409).json({
      message: "That email, review or checkout reference already exists.",
    });
  if (["CastError", "ValidationError"].includes(error.name))
    return res.status(400).json({ message: "Invalid data." });
  const status = Number.isInteger(error.status) && error.status >= 400 && error.status <= 599
    ? error.status : 500;
  if (status >= 500)
    logger.error("Request failed", {
      requestId: req.requestId,
      errorType: error.name,
    });
  if (error.retryAfter) res.set("Retry-After", String(error.retryAfter));
  const verificationCodes = [
    "EMAIL_NOT_VERIFIED",
    "OTP_COOLDOWN",
    "OTP_SEND_LIMIT",
    "OTP_DELIVERY_FAILED",
    "OTP_EXPIRED",
    "OTP_ATTEMPTS_EXCEEDED",
    "OTP_INCORRECT",
    "OTP_UNAVAILABLE",
  ];
  if (verificationCodes.includes(error.code))
    return res
      .status(status)
      .json({
        message: error.message,
        code: error.code,
        ...(error.requiresVerification
          ? { requiresVerification: true, email: error.email }
          : {}),
        ...(error.retryAfter ? { retryAfter: error.retryAfter } : {}),
      });
  res.status(status).json({
    message: status >= 500 ? "Server error. Please try again." : error.message,
  });
}
