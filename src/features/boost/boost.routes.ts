import express from "express";
import { activateBoostController, upgradeBoostController } from "./boost.controller";
import authMiddleware from "../../middleware/auth.middleware";


const router = express.Router();

router.post("/upgrade", authMiddleware, upgradeBoostController);
router.post("/activate", authMiddleware, activateBoostController);

export default router;
