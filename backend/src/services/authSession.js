import jwt from "jsonwebtoken";
export function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}
export function authSession(user) {
  return {
    token: jwt.sign({ sv: user.sessionVersion || 0 }, process.env.JWT_SECRET, {
      subject: user.id,
      expiresIn: "8h",
      algorithm: "HS256",
    }),
    user: publicUser(user),
  };
}
