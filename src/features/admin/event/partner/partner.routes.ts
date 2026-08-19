import { Router } from "express";
import { getAllPartnersController, registerPartnerController } from "./partner.controller";

const router = Router();

router.post("/event-partner/register", registerPartnerController);
router.get(
  "/partner",
  getAllPartnersController
);

export default router;