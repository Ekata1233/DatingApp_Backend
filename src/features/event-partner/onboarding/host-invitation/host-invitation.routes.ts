import { Router } from "express";
import { hostInvitationRateLimit } from "./host-invitation.rate-limit";
import { getHostInvitationsController } from "./host-invitation.controller";



const router = Router();

/* -------------------------------------------------------------------------- */
/*                            PUBLIC HOST AUTH ROUTES                         */
/* -------------------------------------------------------------------------- */

router.post(
  "/invitations",
  hostInvitationRateLimit,
  getHostInvitationsController,
);

export default router;
