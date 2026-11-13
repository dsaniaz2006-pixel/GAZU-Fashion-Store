import { Router } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { fail } from "../utils/errors.js";
export const uploadDir = path.resolve(
  process.env.UPLOAD_DIR || "./data/uploads",
);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(req, file, cb) {
    cb(null, ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype));
  },
});
const router = Router();
router.post(
  "/",
  requireAuth,
  requireAdmin,
  upload.single("image"),
  async (req, res) => {
    const b = req.file?.buffer;
    const ext = b
      ?.subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      ? "png"
      : b?.[0] === 255 && b?.[1] === 216 && b?.[2] === 255
        ? "jpg"
        : b?.toString("ascii", 0, 4) === "RIFF" &&
            b?.toString("ascii", 8, 12) === "WEBP"
          ? "webp"
          : null;
    if (!ext)
      fail(400, "Choose a valid JPEG, PNG or WebP image (maximum 5 MB).");
    await mkdir(uploadDir, { recursive: true });
    const name = `${randomUUID()}.${ext}`;
    await writeFile(path.join(uploadDir, name), b, { flag: "wx" });
    res.status(201).json({ url: `/uploads/${name}` });
  },
);
export default router;
