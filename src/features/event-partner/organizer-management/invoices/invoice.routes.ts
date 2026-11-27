import { Router } from "express";
import { partnerAuthMiddleware } from "../../../../middleware/partnerAuth.middleware";
import { requirePartnerRole } from "../../../../middleware/partnerRole.middleware";
import { getGuestInvoiceDetailsController, getInvoicesController } from "./invoice.controller";


const router = Router();

router.get(
  "/invoices",
  partnerAuthMiddleware,
  requirePartnerRole("ORGANIZER"),
  getInvoicesController,
);

router.get(
  "/invoice/:eventDateId",
  partnerAuthMiddleware,
  requirePartnerRole("ORGANIZER"),
  getGuestInvoiceDetailsController,
);

export default router;