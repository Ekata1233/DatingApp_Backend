import { Router } from "express";
import { partnerAuthMiddleware } from "../../../middleware/partnerAuth.middleware";
import { requirePartnerRole } from "../../../middleware/partnerRole.middleware";
import { PartnerRequest } from "../../../types/partnerAuth.types";
import {
  addBankAccountController,
  findBankBranchController,
  getBankAccountController,
} from "./bank-account.controller";

const router = Router();

router.use(partnerAuthMiddleware, (req: PartnerRequest, res, next) => {
  if (req.partner?.role === "HOST") {
    return res.status(403).json({ success: false, message: "Organizer access required" });
  }
  return next();
});

router.get("/ifsc/:ifscCode", findBankBranchController);

const requireBankAccountOrganizer = requirePartnerRole("ORGANIZER", {
  inferOrganizerBusiness: true,
});

router.get("/bank-details", requireBankAccountOrganizer, getBankAccountController);
router.post("/bank-details/add", requireBankAccountOrganizer, addBankAccountController);

export default router;
