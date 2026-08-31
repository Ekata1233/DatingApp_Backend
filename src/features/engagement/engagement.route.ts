import { Router } from "express";
import authMiddleware from "../../middleware/auth.middleware";
import { sendEngagement } from "./engagement.controller";

const router = Router();

router.post(
  "/engagement/send",
  authMiddleware,
  sendEngagement
);

export default router;