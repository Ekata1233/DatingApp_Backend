import { Router } from "express";

import {
  getGuestListController,
} from "./guest.controller";
import { partnerAuthMiddleware } from "../../../../middleware/partnerAuth.middleware";
import { requirePartnerRole } from "../../../../middleware/partnerRole.middleware";

const router = Router();


// ========================================
// GET EVENT GUEST LIST
// ========================================

router.get(
  "/:eventId/guest-list",
  partnerAuthMiddleware,
  requirePartnerRole("ORGANIZER"),
  getGuestListController,
);

export default router;