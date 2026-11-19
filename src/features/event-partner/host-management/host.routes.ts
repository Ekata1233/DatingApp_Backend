import { Router } from "express";

import {
  getHostPermissions,
  inviteHost,
  getHosts,
  getHostDetails,
  updateHostPermissions,
  resendHostInvitation,
  pauseHost,
  resumeHost,
  removeHost,
} from "./host.controller";
import { partnerAuthMiddleware } from "../../../middleware/partnerAuth.middleware";
import { requirePartnerRole } from "../../../middleware/partnerRole.middleware";



const router = Router();

/* -------------------------------------------------------------------------- */
/*                          ORGANIZER AUTHENTICATION                          */
/* -------------------------------------------------------------------------- */

router.use(
  partnerAuthMiddleware,
  requirePartnerRole("ORGANIZER"),
);

/* -------------------------------------------------------------------------- */
/*                              HOST MANAGEMENT                               */
/* -------------------------------------------------------------------------- */

router.get("/permissions", getHostPermissions);

router.post("/invite", inviteHost);

router.get("/", getHosts);

router.get("/:hostId", getHostDetails);

router.patch(
  "/:hostId/permissions",
  updateHostPermissions,
);

router.post(
  "/:hostId/resend-invite",
  resendHostInvitation,
);

router.patch("/:hostId/pause", pauseHost);

router.patch("/:hostId/resume", resumeHost);

router.delete("/:hostId", removeHost);

export default router;