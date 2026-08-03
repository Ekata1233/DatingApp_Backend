import { Router } from "express";

import { getComplimentBalanceController, getComplimentDashboardController, getComplimentHistoryController, sendComplimentController } from "./compliment.controller";
import authMiddleware from "../../middleware/auth.middleware";

const router = Router();

/* -------------------------------------------------------------------------- */
/*                               Mobile APIs                                  */
/* -------------------------------------------------------------------------- */

/**
 * Send a compliment
 * POST /compliments/send
 */
router.post(
  "/compliments/send",
  authMiddleware,
  sendComplimentController
);

router.get(
  "/compliments/balance",
  authMiddleware,
  getComplimentBalanceController
);

router.get(
  "/compliments/history",
  authMiddleware,
  getComplimentHistoryController
);

router.get(
  "/compliments/dashboard",
  authMiddleware,
  getComplimentDashboardController
);

export default router;