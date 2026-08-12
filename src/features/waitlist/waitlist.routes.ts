import { Router } from "express";
import { getWaitlistController, joinWaitlistController } from "./waitlist.controller";
import authMiddleware from "../../middleware/auth.middleware";

const router = Router();

router.post(
  "/waitlist/join",
  authMiddleware,
  joinWaitlistController
);
router.get(
  "/waitlist-user/get",
  authMiddleware,
  getWaitlistController
);
export default router;