import { Router } from "express";
import { matchController } from "./match.controller";
import authMiddleware from "../../middleware/auth.middleware";

const router = Router();

router.post(
  "/unmatch/:otherUserId",
  authMiddleware,
  matchController.unmatch
);

export default router;