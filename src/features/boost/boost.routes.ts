import express from "express";
import { activateBoostController, getBoostProgressController, upgradeBoostController } from "./boost.controller";
import authMiddleware from "../../middleware/auth.middleware";


const router = express.Router();

router.post("/boost/upgrade", authMiddleware, upgradeBoostController);
router.post("/boost/activate", authMiddleware, activateBoostController);
router.get("/boost/progress", authMiddleware, getBoostProgressController);

export default router;
