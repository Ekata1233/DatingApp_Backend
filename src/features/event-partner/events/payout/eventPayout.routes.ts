import { Router } from "express";
import { partnerAuthMiddleware } from "../../../../middleware/partnerAuth.middleware";
import { requirePartnerRole } from "../../../../middleware/partnerRole.middleware";
import { getEventPayoutSummaryController } from "./eventPayout.controller";

const router = Router();

router.get(
  "/events/:eventId/payout-so-far",
  partnerAuthMiddleware,
  requirePartnerRole("ORGANIZER"),
  getEventPayoutSummaryController,
);

export default router;