import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { fail } from "../utils/errors.js";
// Verify the token, then load the current database role for every protected request.
export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : "";
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
  } catch {
    fail(401, "Please sign in again.");
  }
  if (typeof payload.sub !== "string" || !/^[a-f0-9]{24}$/i.test(payload.sub)) fail(401, "Please sign in again.");
  const user = await User.findById(payload.sub);
  if (!user) fail(401, "Account no longer exists.");
  if (user.disabled) fail(403, "Account unavailable. Contact support.");
  if ((payload.sv || 0) !== (user.sessionVersion || 0)) fail(401, "Please sign in again.");
  if (user.role === "customer" && !user.emailVerified) {
    const error = new Error("Verify your email before continuing.");
    Object.assign(error, {
      status: 403,
      code: "EMAIL_NOT_VERIFIED",
      requiresVerification: true,
      email: user.email,
    });
    throw error;
  }
  req.user = user;
  next();
}
// Frontend visibility is not security: this check protects all admin API endpoints.
export function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") fail(403, "Administrator access required.");
  next();
}
export function allowRoles(...roles){return (req,res,next)=>{
 if(!roles.includes(req.user?.role))fail(403,'This staff role cannot access this operation.');
 next();
};}
