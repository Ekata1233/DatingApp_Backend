import { Router } from "express";
import authMiddleware from "../../../middleware/auth.middleware";
import { getBoostHistoryController, getBoostPerformanceController } from "./boostAnalytics.controller";


const router = Router();

router.get(
  "/boost/history",
  authMiddleware,
  getBoostHistoryController
);

router.get(
  "/boost/performance/:usageId",
  authMiddleware,
  getBoostPerformanceController
);

export default router;