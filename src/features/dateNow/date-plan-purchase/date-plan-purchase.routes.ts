import { Router } from "express";


import {
  purchaseDatePlanWithWalletController,
} from "./date-plan-purchase.controller";
import authMiddleware from "../../../middleware/auth.middleware";

const router = Router();

router.post(
  "/date-plan/wallet/top-up",
  authMiddleware,
  purchaseDatePlanWithWalletController
);

export default router;