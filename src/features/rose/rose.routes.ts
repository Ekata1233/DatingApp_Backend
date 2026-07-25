import { Router } from "express";
import authMiddleware from "../../middleware/auth.middleware";

import {
  sendRoseController,
  getRoseBalanceController,
  getRoseHistoryController,
  addPurchasedRosesController,
} from "./rose.controller";

import { rateLimiter } from "./rose.middleware";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Send Rose
router.post(
  "/rose/send",
  rateLimiter({ windowMs: 60 * 1000, max: 10 }),
  sendRoseController
);

// Get Rose Balance
router.get(
  "/rose/balance",
  rateLimiter({ windowMs: 60 * 1000, max: 30 }),
  getRoseBalanceController
);

// Get Rose History
router.get(
  "/rose/history",
  rateLimiter({ windowMs: 60 * 1000, max: 30 }),
  getRoseHistoryController
);

// Add Purchased Roses (Testing/Admin)
router.post(
  "/rose/purchase",
  rateLimiter({ windowMs: 60 * 1000, max: 10 }),
  addPurchasedRosesController
);

export default router;