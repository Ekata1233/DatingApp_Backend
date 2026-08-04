import { Router } from "express";
import authMiddleware from "../../middleware/auth.middleware";
import { sendGiftController } from "./gift.controller";

const router = Router();

router.post(
  "/gift/send",
  authMiddleware,
  sendGiftController
);

export default router;