// Wave 3 API entry point. Route handlers are grouped by feature but retain
// the original public /api/wave3/* contract and middleware ordering.
import { Router } from "express";
import fitRoutes from "./wave3/fit.routes.js";
import supportRoutes from "./wave3/support.routes.js";
import languageRoutes from "./wave3/languages.routes.js";
import adminRoutes from "./wave3/admin.routes.js";
import forecastRoutes from "./wave3/forecast.routes.js";

const router = Router();
router.use(fitRoutes);
router.use(supportRoutes);
router.use(languageRoutes);
router.use(adminRoutes);
router.use(forecastRoutes);
export default router;
