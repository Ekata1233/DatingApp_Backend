import express from "express";
import { activateBoostController, upgradeBoostController } from "./boost.controller";
import authMiddleware from "../../middleware/auth.middleware";


const router = express.Router();

router.post("/boost/upgrade", authMiddleware, upgradeBoostController);
router.post("/boost/activate", authMiddleware, activateBoostController);

export default router;
