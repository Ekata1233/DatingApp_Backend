import { Router } from "express";
import { registerPartnerController } from "./partner.controller";

const router = Router();

router.post("/event-partner/register", registerPartnerController);

export default router;