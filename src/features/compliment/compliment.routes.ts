import { Router } from "express";

import { sendComplimentController } from "./compliment.controller";
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
  "/send",
  authMiddleware,
  sendComplimentController
);

export default router;