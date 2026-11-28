import { Router } from "express";

import {
  getAllHostEventsController,
} from "./host-event.controller";
import { partnerAuthMiddleware } from "../../../../middleware/partnerAuth.middleware";
import { requirePartnerRole } from "../../../../middleware/partnerRole.middleware";


const router = Router();


// ============================================
// GET ALL HOST ASSIGNED EVENTS
// ============================================

router.get(
  "/get-all",
  partnerAuthMiddleware,
  requirePartnerRole("HOST"),
  getAllHostEventsController,
);

export default router;