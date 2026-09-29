import { Router } from "express";
import { getAutoRenewOffPreviewController, getMembershipInvoiceController, getMembershipPlanController, turnOffAutoRenewController, turnOnAutoRenewController } from "./membership.controller";
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

router.get(
  "/membership-plan/auto-renew/off-preview",
  authMiddleware,
  getAutoRenewOffPreviewController
);

router.post(
  "/membership-plan/auto-renew/turn-off",
  authMiddleware,
  turnOffAutoRenewController
);

router.post(
  "/membership-plan/auto-renew/turn-on",
  authMiddleware,
  turnOnAutoRenewController
);

export default router;