import { Router } from "express";
import { joinWaitlistController } from "./waitlist.controller";
import authMiddleware from "../../middleware/auth.middleware";

const router = Router();

router.post(
  "/waitlist/join",
  authMiddleware,
  joinWaitlistController
);

export default router;