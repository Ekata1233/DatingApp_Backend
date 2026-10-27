import { Router } from "express";

import { verifyPurchaseController } from
  "./purchaseVerification.controller";
import authMiddleware from "../../../middleware/auth.middleware";



const router = Router();

router.post(
  "/package/verify-purchase",
  authMiddleware,
  verifyPurchaseController,
);

export default router;