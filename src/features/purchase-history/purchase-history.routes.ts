import { Router } from "express";
import { getPurchaseHistoryController } from "./purchase-history.controller";
import authMiddleware from "../../middleware/auth.middleware";

const router = Router();

router.get(
  "/purchase-history",
  authMiddleware,
  getPurchaseHistoryController,
);

export default router;