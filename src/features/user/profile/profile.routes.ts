import express from "express";
import { enterNameController } from "./profile.controller";
import authMiddleware from "../../../middleware/auth.middleware";

const router = express.Router();

router.patch("/profile/name", authMiddleware, enterNameController);

export default router;
