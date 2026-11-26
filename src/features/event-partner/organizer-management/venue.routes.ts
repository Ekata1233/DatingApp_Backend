import { Router } from "express";
import { partnerAuthMiddleware } from "../../../middleware/partnerAuth.middleware";
import { requirePartnerRole } from "../../../middleware/partnerRole.middleware";
import { PartnerRequest } from "../../../types/partnerAuth.types";
import {
  addOrganizerVenueController,
  deleteOrganizerVenueController,
  listOrganizerVenuesController,
} from "./venue.controller";

const router = Router();

router.use(
  partnerAuthMiddleware,
  (req: PartnerRequest, res, next) => {
    if (req.partner?.role === "HOST") {
      return res.status(403).json({ success: false, message: "Organizer access required" });
    }
    return next();
  },
  requirePartnerRole("ORGANIZER", { inferOrganizerBusiness: true }),
);

router.get("/", listOrganizerVenuesController);
router.post("/add", addOrganizerVenueController);
router.delete("/:venueId", deleteOrganizerVenueController);

export default router;
