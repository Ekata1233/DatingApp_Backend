import { Router } from "express";
import { partnerAuthMiddleware } from "../../../middleware/partnerAuth.middleware";
import { requirePartnerRole } from "../../../middleware/partnerRole.middleware";
import { PartnerRequest } from "../../../types/partnerAuth.types";
import {
  getGuestBrandPageController,
  previewBrandPageController,
  saveBrandPageController,
} from "./brand-page.controller";

const router = Router();

router.get("/guest/:businessId", getGuestBrandPageController);

router.use(partnerAuthMiddleware, (req: PartnerRequest, res, next) => {
  if (req.partner?.role === "HOST") {
    return res.status(403).json({ success: false, message: "Organizer access required" });
  }
  return next();
}, requirePartnerRole("ORGANIZER", { inferOrganizerBusiness: true }));

router.get("/", previewBrandPageController);
router.put("/add", saveBrandPageController);

export default router;
