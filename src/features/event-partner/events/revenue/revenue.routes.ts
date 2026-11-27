import { Router } from "express";
import { partnerAuthMiddleware } from "../../../../middleware/partnerAuth.middleware";
import { requirePartnerRole } from "../../../../middleware/partnerRole.middleware";
import { calculateRevenueController } from "./revenue.controller";

const router = Router();

router.post(
  "/event/calculate-revenue",
  partnerAuthMiddleware,
  requirePartnerRole("ORGANIZER"),
  calculateRevenueController,
);

export default router;
