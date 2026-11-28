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
  "/:eventId/guests",
  partnerAuthMiddleware,
  getGuestListController,
);

export default router;