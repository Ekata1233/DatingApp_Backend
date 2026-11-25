import { Router } from "express";



import {
  getHostInvitationController,
  getHostDetailsController,
  acceptHostInvitationController,
  declineHostInvitationController,
  getHostPersonalDetailsController,
  updateHostPersonalDetailsController,
  getHostCodeOfConductController,
  acceptHostCodeOfConductController,
} from "./host-onboarding.controller";
import { partnerAuthMiddleware } from "../../../../middleware/partnerAuth.middleware";
import { hostOnboardingMiddleware } from "../../../../middleware/hostOnboarding.middleware";
import {
  completeHostGovernmentIdController,
  hostGovernmentIdCallbackController,
  initHostGovernmentIdController,
  verifyHostFaceController,
} from "./host-verification.controller";

const router = Router();

router.get("/government-id/callback", hostGovernmentIdCallbackController);

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

router.get("/host-details", getHostDetailsController);

/* -------------------------------------------------------------------------- */
/*                              STEP 1 - INVITE                               */
/* -------------------------------------------------------------------------- */

router.get(
  "/invitation",
  getHostInvitationController,
);

router.post(
  "/agree",
  acceptHostInvitationController,
);

router.post("/decline", declineHostInvitationController);

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
/*                        STEP 3 - AADHAAR VERIFICATION                       */
/* -------------------------------------------------------------------------- */

router.post("/government-id/init", initHostGovernmentIdController);
router.post("/government-id/complete", completeHostGovernmentIdController);

/* -------------------------------------------------------------------------- */
/*                        STEP 4 - FACE VERIFICATION                          */
/* -------------------------------------------------------------------------- */
router.post("/face/verify", verifyHostFaceController);

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
