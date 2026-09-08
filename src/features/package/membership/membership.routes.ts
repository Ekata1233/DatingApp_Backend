import { Router } from "express";
import { getMembershipInvoiceController, getMembershipPlanController } from "./membership.controller";
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

export default router;