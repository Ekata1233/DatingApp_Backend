import { Router } from "express";
import authMiddleware from "../../../middleware/auth.middleware";
import { verifyVideoLivenessController } from "./video-verification.controller";



const router = Router();

router.post(
  "/verification/video/verify",
  authMiddleware,
  verifyVideoLivenessController
);

export default router;