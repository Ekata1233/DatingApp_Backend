import { Router } from "express";
import { partnerAuthMiddleware } from "../../../middleware/partnerAuth.middleware";
import { requirePartnerRole } from "../../../middleware/partnerRole.middleware";
import {
  getOrganizerTeamController,
  getOrganizerTeamMemberController,
  pauseTeamMemberController,
  resumeTeamMemberController,
  previewTeamMemberRemovalController,
  removeTeamMemberController,
} from "./team.controller";

const router = Router();

router.use(
  partnerAuthMiddleware,
  requirePartnerRole("ORGANIZER", { inferOrganizerBusiness: true }),
);

router.get("/", getOrganizerTeamController);
router.get("/:hostId", getOrganizerTeamMemberController);
router.patch("/:hostId/pause", pauseTeamMemberController);
router.patch("/:hostId/resume", resumeTeamMemberController);
router.get("/:hostId/removal-preview", previewTeamMemberRemovalController);
router.post("/:hostId/remove", removeTeamMemberController);

export default router;
