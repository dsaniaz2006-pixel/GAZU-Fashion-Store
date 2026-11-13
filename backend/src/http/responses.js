export function identifyApi(_req, res, next) {
  res.set("X-GAZU-API", "gazu-store");
  next();
}

export function apiNotFound(_req, res) {
  res.status(404).json({ message: "API endpoint not found." });
}
