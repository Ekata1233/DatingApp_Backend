import { Router } from "express";
import authMiddleware from "../../../middleware/auth.middleware";
import { getUserActivityCardController } from "./activity.controller";


const router = Router();

// ==========================================
// GET ACTIVITY CARD
// ==========================================

router.get(
  "/activity/details/:userId",
  authMiddleware,
  getUserActivityCardController
);

export default router;