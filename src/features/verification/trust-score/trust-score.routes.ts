import { Router } from "express";


import {
  getPublicTrustScoreController,
} from "./trust-score.controller";
import authMiddleware from "../../../middleware/auth.middleware";

const router = Router();

router.get(
  "/profile/:userId/trust-score",
  authMiddleware,
  getPublicTrustScoreController
);

export default router;