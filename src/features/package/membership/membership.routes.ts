import { Router } from "express";
import { getMembershipInvoiceController, getMembershipPlanController, turnOffAutoRenewController } from "./membership.controller";
import authMiddleware from "../../../middleware/auth.middleware";

const router = Router();

router.get(
  "/membership-plan",
  authMiddleware,
  getMembershipPlanController,
);

router.get(
  "/membership-plan/invoice/:userPackageId",
  authMiddleware,
  getMembershipInvoiceController,
);

router.post(
  "/membership-plan/auto-renew/turn-off",
  authMiddleware,
  turnOffAutoRenewController
);

export default router;