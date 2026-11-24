import { Router } from "express";



import {
  getHostInvitationController,
  acceptHostInvitationController,
  declineHostInvitationController,
  getHostPersonalDetailsController,
  updateHostPersonalDetailsController,
  getHostCodeOfConductController,
  acceptHostCodeOfConductController,
} from "./host-onboarding.controller";
import { partnerAuthMiddleware } from "../../../../middleware/partnerAuth.middleware";
import { hostOnboardingMiddleware } from "../../../../middleware/hostOnboarding.middleware";

const router = Router();

/* -------------------------------------------------------------------------- */
/*                           AUTHENTICATION MIDDLEWARE                        */
/* -------------------------------------------------------------------------- */

router.use(
  partnerAuthMiddleware,
  hostOnboardingMiddleware,

  (_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  },
);

/* -------------------------------------------------------------------------- */
/*                              STEP 1 - INVITE                               */
/* -------------------------------------------------------------------------- */

router.get(
  "/invitation",
  getHostInvitationController,
);

router.post(
  "/accept-invitation",
  acceptHostInvitationController,
);

router.post("/decline-invitation", declineHostInvitationController);

/* -------------------------------------------------------------------------- */
/*                        STEP 2 - PERSONAL DETAILS                           */
/* -------------------------------------------------------------------------- */

router.get(
  "/personal-details",
  getHostPersonalDetailsController,
);

router.patch(
  "/personal-details",
  updateHostPersonalDetailsController,
);

/* -------------------------------------------------------------------------- */
/*                         STEP 5 - CODE OF CONDUCT                           */
/* -------------------------------------------------------------------------- */

router.get(
  "/code-of-conduct",
  getHostCodeOfConductController,
);

router.post(
  "/code-of-conduct",
  acceptHostCodeOfConductController,
);

export default router;
