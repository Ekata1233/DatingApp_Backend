import express from "express";
import { blockUserController, unblockUserController } from "./block.controller";
import authMiddleware from "../../../middleware/auth.middleware";

const router = express.Router();

router.patch(
  "/block",
  authMiddleware,
  blockUserController
);

router.delete(
  "/unblock/:blockedId",
  authMiddleware,
  unblockUserController
);
export default router;