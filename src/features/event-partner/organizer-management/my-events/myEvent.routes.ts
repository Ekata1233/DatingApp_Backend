import { Router } from "express";
import { partnerAuthMiddleware } from "../../../../middleware/partnerAuth.middleware";
import { requirePartnerRole } from "../../../../middleware/partnerRole.middleware";
import { getAllOrganizerEventsController } from "./myEvent.controller";


const router = Router();


// ============================================
// GET ALL ORGANIZER EVENTS
// ============================================

router.get(
  "/events/get-all",
  partnerAuthMiddleware,
  requirePartnerRole("ORGANIZER"),
  getAllOrganizerEventsController,
);

export default router;