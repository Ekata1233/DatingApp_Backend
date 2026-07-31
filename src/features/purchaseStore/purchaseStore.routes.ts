import { Router } from "express";
import { createPurchaseSchema } from "./purchaseStore.validation";
import { createPurchaseController } from "./purchaseStore.controller";
import authMiddleware from "../../middleware/auth.middleware";

const router = Router();

router.post(
  "/purchase-store/create",
  authMiddleware,
  createPurchaseController
);

export default router;