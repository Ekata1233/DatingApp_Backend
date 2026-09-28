import { Router } from "express";

import {
  getMatchAnalysisController,
} from "./match-analysis.controller";
import authMiddleware from "../../../middleware/auth.middleware";


const router = Router();

router.get(
  "/match-analysis/:userId",
  authMiddleware,
  getMatchAnalysisController
);

export default router;